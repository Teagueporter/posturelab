import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { requiredEnvNames } from "./setup-check.mjs";
import { vercelEnvTargets } from "./vercel-env-plan.mjs";

export function checkVercelEnvPresence({
  runVercel = defaultRunVercel,
  required = requiredEnvNames,
  targets = vercelEnvTargets,
} = {}) {
  const output = runVercel(["env", "list", "--json"]);
  const envs = parseVercelEnvListOutput(output).envs ?? [];

  const byKey = new Map(envs.map((env) => [env.key, env]));
  const checks = required.map((name) => {
    const entry = byKey.get(name);
    const configuredTargets = Array.isArray(entry?.target) ? entry.target : [];
    const missingTargets = targets.filter((target) => !configuredTargets.includes(target));

    return {
      name,
      present: Boolean(entry),
      configuredTargets,
      missingTargets,
      ok: Boolean(entry) && missingTargets.length === 0,
    };
  });

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function formatVercelEnvPresence(result) {
  const lines = [
    `Vercel env check: ${result.ok ? "PASS" : "FAIL"}`,
    `- Ready vars: ${result.checks.filter((check) => check.ok).length}/${result.checks.length}`,
  ];

  for (const check of result.checks) {
    if (check.ok) {
      lines.push(`- PASS ${check.name}: configured for ${check.configuredTargets.join(", ")}`);
    } else if (!check.present) {
      lines.push(`- FAIL ${check.name}: missing from Vercel`);
    } else {
      lines.push(`- FAIL ${check.name}: missing ${check.missingTargets.join(", ")}`);
    }
  }

  return lines.join("\n");
}

export function parseVercelEnvListOutput(output) {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("Unable to parse Vercel env list output.");
  }
  return JSON.parse(output.slice(jsonStart));
}

function defaultRunVercel(args) {
  return execFileSync("npx", ["vercel", ...args], {
    encoding: "utf8",
  });
}

function main() {
  const result = checkVercelEnvPresence();
  const output = formatVercelEnvPresence(result);

  if (result.ok) {
    console.log(output);
    return;
  }

  console.error(output);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
