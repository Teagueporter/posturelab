import { pathToFileURL } from "node:url";
import { envWithLocalFile, invalidEnvMessages, missingEnvNames, requiredEnvNames } from "./setup-check.mjs";

export const sensitiveEnvNames = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_RESTRICTED_KEY",
  "STRIPE_WEBHOOK_SECRET",
]);

export const vercelEnvTargets = ["production", "preview", "development"];

export function buildVercelEnvPlan({
  env = envWithLocalFile(),
  names = requiredEnvNames,
  targets = vercelEnvTargets,
} = {}) {
  const missing = missingEnvNames(env);
  const invalid = invalidEnvMessages(env);
  const ready = names.filter((name) => env[name] && !missing.includes(name));

  return {
    ok: missing.length === 0 && invalid.length === 0,
    targets,
    missing,
    invalid,
    ready: ready.map((name) => ({
      name,
      sensitive: sensitiveEnvNames.has(name),
      command: `vercel env add ${name} ${targets.join(" ")}`,
    })),
  };
}

export function formatVercelEnvPlan(plan) {
  const lines = [
    `Vercel env plan: ${plan.ok ? "READY" : "NOT READY"}`,
    `- Targets: ${plan.targets.join(", ")}`,
    `- Ready vars: ${plan.ready.length}/${requiredEnvNames.length}`,
    "- Values are never printed. Run each command and paste the matching value when Vercel prompts.",
  ];

  if (plan.missing.length > 0) {
    lines.push("Missing local env vars:");
    lines.push(...plan.missing.map((name) => `  - ${name}`));
  }

  if (plan.invalid.length > 0) {
    lines.push("Invalid local env vars:");
    lines.push(...plan.invalid.map((message) => `  - ${message}`));
  }

  if (plan.ready.length > 0) {
    lines.push("Interactive Vercel commands:");
    for (const item of plan.ready) {
      lines.push(`  - ${item.command} (${item.sensitive ? "sensitive" : "public"})`);
    }
  }

  return lines.join("\n");
}

async function main() {
  console.log(formatVercelEnvPlan(buildVercelEnvPlan()));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
