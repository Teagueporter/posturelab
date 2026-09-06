import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { envWithLocalFile, invalidEnvMessages, missingEnvNames } from "./setup-check.mjs";
import { checkSupabaseSchema } from "./check-supabase-schema.mjs";
import { checkLiveSupabase } from "./check-live-supabase.mjs";
import { checkLiveStripe } from "./check-live-stripe.mjs";
import { checkStripeCli } from "./check-stripe-cli.mjs";
import { checkVercelDeployment } from "./check-vercel-deployment.mjs";
import { checkVercelEnvPresence } from "./check-vercel-env.mjs";
import { runProductionSmokeChecks } from "./smoke-production.mjs";

export async function buildLaunchStatus({
  env = envWithLocalFile(),
  fetchImpl = globalThis.fetch,
  runGit = defaultRunGit,
  includeLiveServices = false,
  includeVercelEnv = false,
  includeStripeCli = false,
  liveSupabaseCheck = includeLiveServices ? checkLiveSupabase({ env }) : null,
  liveStripeCheck = includeLiveServices ? checkLiveStripe({ env }) : null,
  stripeCliCheck = includeStripeCli ? checkStripeCli() : null,
  vercelEnvCheck = includeVercelEnv ? checkVercelEnvPresence() : null,
  vercelDeploymentCheck = includeVercelEnv ? checkVercelDeployment() : null,
} = {}) {
  const missingEnv = missingEnvNames(env);
  const invalidEnv = invalidEnvMessages(env);
  const schemaFailures = checkSupabaseSchema();
  const productionSmoke = await safeSmoke(fetchImpl, env.NEXT_PUBLIC_APP_URL);
  const git = gitStatus(runGit);
  const liveSupabase = liveSupabaseCheck ? await liveSupabaseCheck : null;
  const liveStripe = liveStripeCheck ? await liveStripeCheck : null;
  const stripeCli = stripeCliCheck ? await stripeCliCheck : null;
  const vercelEnv = vercelEnvCheck ? await vercelEnvCheck : null;
  const vercelDeployment = vercelDeploymentCheck ? await vercelDeploymentCheck : null;

  return {
    ok:
      missingEnv.length === 0 &&
      invalidEnv.length === 0 &&
      schemaFailures.length === 0 &&
      productionSmoke.ok &&
      git.clean &&
      (!includeLiveServices || (liveSupabase?.ok === true && liveStripe?.ok === true)) &&
      (!includeStripeCli || stripeCli?.ok === true) &&
      (!includeVercelEnv || (vercelEnv?.ok === true && vercelDeployment?.ok === true)),
    git,
    localEnvironment: {
      configured: missingEnv.length === 0 && invalidEnv.length === 0,
      missing: missingEnv,
      invalid: invalidEnv,
    },
    supabaseSchema: {
      ok: schemaFailures.length === 0,
      failures: schemaFailures,
    },
    productionSmoke,
    liveSupabase,
    liveStripe,
    stripeCli,
    vercelEnv,
    vercelDeployment,
  };
}

export function formatLaunchStatus(status) {
  const lines = [
    `Launch status: ${status.ok ? "READY" : "NOT READY"}`,
    `- Git: ${status.git.clean ? "clean" : "dirty"} on ${status.git.branch}`,
    `- Local env: ${status.localEnvironment.configured ? "configured" : `${status.localEnvironment.missing.length} missing, ${status.localEnvironment.invalid.length} invalid`}`,
    `- Supabase schema: ${status.supabaseSchema.ok ? "pass" : `${status.supabaseSchema.failures.length} failure(s)`}`,
    `- Production smoke: ${status.productionSmoke.ok ? "pass" : "fail"} (${status.productionSmoke.detail})`,
  ];

  if (status.liveSupabase) {
    lines.push(`- Live Supabase: ${status.liveSupabase.ok ? "pass" : "fail"}`);
  }
  if (status.liveStripe) {
    lines.push(`- Live Stripe: ${status.liveStripe.ok ? "pass" : "fail"}`);
  }
  if (status.stripeCli) {
    lines.push(`- Stripe CLI: ${status.stripeCli.ok ? "pass" : "fail"} (${status.stripeCli.detail})`);
  }
  if (status.vercelEnv) {
    lines.push(`- Vercel env: ${status.vercelEnv.ok ? "pass" : "fail"}`);
  }
  if (status.vercelDeployment) {
    lines.push(`- Vercel deployment: ${status.vercelDeployment.ok ? "pass" : "fail"}`);
  }

  if (status.localEnvironment.missing.length > 0) {
    lines.push("Missing env vars:");
    lines.push(...status.localEnvironment.missing.map((name) => `  - ${name}`));
  }
  if (status.localEnvironment.invalid.length > 0) {
    lines.push("Invalid env vars:");
    lines.push(...status.localEnvironment.invalid.map((message) => `  - ${message}`));
  }
  if (status.supabaseSchema.failures.length > 0) {
    lines.push("Supabase schema failures:");
    lines.push(...status.supabaseSchema.failures.map((failure) => `  - ${failure}`));
  }
  if (status.liveSupabase && !status.liveSupabase.ok) {
    lines.push(...formatNestedLiveFailures("Live Supabase failures:", status.liveSupabase));
  }
  if (status.liveStripe && !status.liveStripe.ok) {
    lines.push(...formatNestedLiveFailures("Live Stripe failures:", status.liveStripe));
  }
  if (status.stripeCli && !status.stripeCli.ok) {
    lines.push("Stripe CLI failures:");
    if (!status.stripeCli.installed) {
      lines.push("  - Stripe CLI is not installed");
    } else if (status.stripeCli.versionOk === false) {
      lines.push(`  - Stripe CLI version ${status.stripeCli.version ?? "unknown"} is below the required minimum`);
    } else if (!status.stripeCli.authenticated) {
      lines.push("  - Stripe CLI is not authenticated");
    }
  }
  if (status.vercelEnv && !status.vercelEnv.ok) {
    lines.push("Vercel env failures:");
    lines.push(
      ...status.vercelEnv.checks
        .filter((check) => !check.ok)
        .map((check) => {
          if (!check.present) return `  - missing ${check.name}`;
          return `  - ${check.name}: missing ${check.missingTargets.join(", ")}`;
        }),
    );
  }
  if (status.vercelDeployment && !status.vercelDeployment.ok) {
    lines.push("Vercel deployment failures:");
    lines.push(`  - expected alias ${status.vercelDeployment.expectedUrl}`);
    lines.push(`  - status ${status.vercelDeployment.status}`);
  }

  return lines.join("\n");
}

export function launchStatusExitCode(status, { failOnNotReady = false } = {}) {
  return failOnNotReady && !status.ok ? 1 : 0;
}

function formatNestedLiveFailures(title, result) {
  const lines = [title];
  if (result.missing?.length > 0) {
    lines.push(...result.missing.map((name) => `  - missing ${name}`));
  }
  if (result.invalid?.length > 0) {
    lines.push(...result.invalid.map((message) => `  - ${message}`));
  }
  if (result.tableChecks?.length > 0) {
    lines.push(...result.tableChecks.filter((check) => !check.ok).map((check) => `  - ${check.table}: ${check.detail}`));
  }
  if (result.storage && !result.storage.ok) {
    lines.push(`  - storage: ${result.storage.detail}`);
  }
  if (result.priceChecks?.length > 0) {
    lines.push(...result.priceChecks.filter((check) => !check.ok).map((check) => `  - ${check.name}: ${check.detail}`));
  }
  return lines;
}

async function safeSmoke(fetchImpl, baseUrl) {
  try {
    const result = await runProductionSmokeChecks({ baseUrl, fetchImpl });
    return {
      ok: result.ok,
      detail: result.results.map((check) => `${check.name}=${check.ok ? "pass" : "fail"}`).join(", "),
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function gitStatus(runGit) {
  const branch = runGit(["branch", "--show-current"]).trim() || "unknown";
  const porcelain = runGit(["status", "--porcelain"]).trim();
  const relevantDirtyLines = porcelain
    .split("\n")
    .filter(Boolean)
    .filter((line) => !line.endsWith("GITHUB_PROFILE_README_DRAFT.md"));

  return {
    branch,
    clean: relevantDirtyLines.length === 0,
    dirtyLines: relevantDirtyLines,
  };
}

function defaultRunGit(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

async function main() {
  const status = await buildLaunchStatus({
    includeLiveServices: process.argv.includes("--include-live-services"),
    includeVercelEnv: process.argv.includes("--include-vercel-env"),
    includeStripeCli: process.argv.includes("--include-stripe-cli"),
  });
  console.log(formatLaunchStatus(status));
  process.exitCode = launchStatusExitCode(status, {
    failOnNotReady: process.argv.includes("--fail-on-not-ready"),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
