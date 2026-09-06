import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { envWithLocalFile, invalidEnvMessages, missingEnvNames } from "./setup-check.mjs";
import { checkSupabaseSchema } from "./check-supabase-schema.mjs";
import { runProductionSmokeChecks } from "./smoke-production.mjs";

export async function buildLaunchStatus({
  env = envWithLocalFile(),
  fetchImpl = globalThis.fetch,
  runGit = defaultRunGit,
} = {}) {
  const missingEnv = missingEnvNames(env);
  const invalidEnv = invalidEnvMessages(env);
  const schemaFailures = checkSupabaseSchema();
  const productionSmoke = await safeSmoke(fetchImpl, env.NEXT_PUBLIC_APP_URL);
  const git = gitStatus(runGit);

  return {
    ok: missingEnv.length === 0 && invalidEnv.length === 0 && schemaFailures.length === 0 && productionSmoke.ok && git.clean,
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

  return lines.join("\n");
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
  const status = await buildLaunchStatus();
  console.log(formatLaunchStatus(status));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
