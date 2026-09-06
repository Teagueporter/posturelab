import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { findSecretsInText } from "./check-secrets.mjs";
import { readEnvFile, requiredEnvNames } from "./setup-check.mjs";

export function checkEnvTemplate({
  filePath = ".env.example",
  required = requiredEnvNames,
} = {}) {
  const text = readFileSync(filePath, "utf8");
  const parsed = readEnvFile(filePath);
  const keys = Object.keys(parsed);
  const missing = required.filter((name) => !keys.includes(name));
  const extra = keys.filter((name) => !required.includes(name));
  const secretFindings = findSecretsInText(text, filePath);

  return {
    ok: missing.length === 0 && extra.length === 0 && secretFindings.length === 0,
    missing,
    extra,
    secretFindings,
  };
}

export function formatEnvTemplateCheck(result) {
  const lines = [`Env template check: ${result.ok ? "PASS" : "FAIL"}`];

  if (result.missing.length > 0) {
    lines.push("Missing template keys:");
    lines.push(...result.missing.map((name) => `- ${name}`));
  }

  if (result.extra.length > 0) {
    lines.push("Unexpected template keys:");
    lines.push(...result.extra.map((name) => `- ${name}`));
  }

  if (result.secretFindings.length > 0) {
    lines.push("Secret-shaped values found in template:");
    lines.push(...result.secretFindings.map((finding) => `- ${finding.name}`));
  }

  return lines.join("\n");
}

function main() {
  const result = checkEnvTemplate();
  const output = formatEnvTemplateCheck(result);

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
