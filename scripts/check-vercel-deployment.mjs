import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { defaultProductionUrl } from "./smoke-production.mjs";

export function checkVercelDeployment({
  runVercel = defaultRunVercel,
  productionUrl = defaultProductionUrl,
} = {}) {
  const output = runVercel(["inspect", productionUrl]);
  const parsed = parseVercelInspectOutput(output);
  const expectedHost = new URL(productionUrl).host;
  const aliasHosts = parsed.aliases.map((alias) => new URL(alias).host);

  return {
    ok: parsed.status === "Ready" && aliasHosts.includes(expectedHost),
    expectedUrl: productionUrl,
    id: parsed.id,
    status: parsed.status,
    url: parsed.url,
    aliases: parsed.aliases,
  };
}

export function parseVercelInspectOutput(output) {
  return {
    id: matchRequired(output, /^\s*id\s+(\S+)/m, "deployment id"),
    status: matchRequired(output, /^\s*status\s+(?:[^\w\n]*)?([A-Za-z]+)/m, "deployment status"),
    url: matchRequired(output, /^\s*url\s+(https?:\/\/\S+)/m, "deployment url"),
    aliases: [...output.matchAll(/^\s*╶\s+(https?:\/\/\S+)/gm)].map((match) => match[1]),
  };
}

export function formatVercelDeploymentCheck(result) {
  return [
    `Vercel deployment check: ${result.ok ? "PASS" : "FAIL"}`,
    `- Expected alias: ${result.expectedUrl}`,
    `- Deployment: ${result.id}`,
    `- Status: ${result.status}`,
    `- URL: ${result.url}`,
    `- Aliases: ${result.aliases.join(", ") || "none"}`,
  ].join("\n");
}

function matchRequired(output, pattern, label) {
  const match = output.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Unable to parse Vercel ${label}.`);
  }
  return match[1];
}

function defaultRunVercel(args) {
  const command = ["npx", "vercel", ...args].map(quoteShell).join(" ");
  return execFileSync("sh", ["-c", `${command} 2>&1`], {
    encoding: "utf8",
  });
}

function quoteShell(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function main() {
  const result = checkVercelDeployment();
  const output = formatVercelDeploymentCheck(result);

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
