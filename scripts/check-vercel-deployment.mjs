import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { defaultProductionUrl } from "./smoke-production.mjs";

export function checkVercelDeployment({
  expectedGitSha = defaultGitSha(),
  runVercel = defaultRunVercel,
  productionUrl = defaultProductionUrl,
} = {}) {
  const output = runVercel(["inspect", productionUrl, "--json"]);
  const parsed = parseVercelInspectOutput(output);
  const expectedHost = new URL(productionUrl).host;
  const aliasHosts = parsed.aliases.map((alias) => new URL(alias).host);
  const githubCommitSha = parsed.githubCommitSha ?? deploymentGitShaFromList({
    deploymentUrl: parsed.url,
    runVercel,
  });
  const gitShaMatches = !expectedGitSha || githubCommitSha === expectedGitSha;

  return {
    ok: parsed.status === "Ready" && aliasHosts.includes(expectedHost) && gitShaMatches,
    expectedUrl: productionUrl,
    expectedGitSha,
    gitShaMatches,
    id: parsed.id,
    status: parsed.status,
    url: parsed.url,
    aliases: parsed.aliases,
    githubCommitSha,
  };
}

export function parseVercelInspectOutput(output) {
  const json = parseJsonInspectOutput(output);
  if (json) {
    return {
      id: requiredValue(json.id, "deployment id"),
      status: normalizeReadyState(requiredValue(json.readyState, "deployment status")),
      url: normalizeDeploymentUrl(requiredValue(json.url, "deployment url")),
      aliases: (json.aliases ?? []).map(normalizeDeploymentUrl),
      githubCommitSha: json.meta?.githubCommitSha,
    };
  }

  return {
    id: matchRequired(output, /^\s*id\s+(\S+)/m, "deployment id"),
    status: matchRequired(output, /^\s*status\s+(?:[^\w\n]*)?([A-Za-z]+)/m, "deployment status"),
    url: matchRequired(output, /^\s*url\s+(https?:\/\/\S+)/m, "deployment url"),
    aliases: [...output.matchAll(/^\s*╶\s+(https?:\/\/\S+)/gm)].map((match) => match[1]),
    githubCommitSha: output.match(/^\s*githubCommitSha\s+(\S+)/m)?.[1],
  };
}

export function parseVercelListGitSha(output, deploymentUrl) {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) return undefined;

  let parsed;
  try {
    parsed = JSON.parse(output.slice(jsonStart));
  } catch {
    return undefined;
  }

  const deploymentHost = new URL(deploymentUrl).host;
  const deployment = parsed.deployments?.find((item) => normalizeDeploymentUrl(item.url) === `https://${deploymentHost}`);
  return deployment?.meta?.githubCommitSha;
}

export function formatVercelDeploymentCheck(result) {
  return [
    `Vercel deployment check: ${result.ok ? "PASS" : "FAIL"}`,
    `- Expected alias: ${result.expectedUrl}`,
    `- Expected commit: ${result.expectedGitSha || "not checked"}`,
    `- Deployed commit: ${result.githubCommitSha || "unknown"}`,
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

function parseJsonInspectOutput(output) {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) return null;
  try {
    return JSON.parse(output.slice(jsonStart));
  } catch {
    return null;
  }
}

function normalizeReadyState(value) {
  if (value === "READY") return "Ready";
  return String(value);
}

function normalizeDeploymentUrl(value) {
  const text = String(value);
  return text.startsWith("http") ? text : `https://${text}`;
}

function requiredValue(value, label) {
  if (!value) {
    throw new Error(`Unable to parse Vercel ${label}.`);
  }
  return value;
}

function deploymentGitShaFromList({ deploymentUrl, runVercel }) {
  try {
    return parseVercelListGitSha(runVercel(["ls", "--json", "--limit", "20"]), deploymentUrl);
  } catch {
    return undefined;
  }
}

function defaultGitSha() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
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
