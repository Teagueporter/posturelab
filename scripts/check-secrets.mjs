import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const secretPatterns = [
  { name: "Stripe secret key", pattern: /\bsk_(?:live|test)_[A-Za-z0-9_]{16,}\b/g },
  { name: "Stripe restricted key", pattern: /\brk_(?:live|test)_[A-Za-z0-9_]{16,}\b/g },
  { name: "Stripe webhook secret", pattern: /\bwhsec_[A-Za-z0-9_]{16,}\b/g },
  { name: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_]{16,}\b/g },
  { name: "Vercel OIDC token", pattern: /\bVERCEL_OIDC_TOKEN\s*=\s*["']?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+["']?/g },
];

const allowedFiles = new Set([".env.example", "PRODUCTION_SETUP.md", "scripts/check-secrets.mjs"]);

export function findSecretsInText(text, filePath = "") {
  const findings = [];
  for (const { name, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      findings.push({
        name,
        filePath,
        index: match.index ?? 0,
      });
    }
  }
  return findings;
}

export function trackedAndUntrackedFiles() {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((filePath) => !allowedFiles.has(filePath));
}

export function scanFiles(filePaths = trackedAndUntrackedFiles()) {
  return filePaths.flatMap((filePath) => {
    try {
      return findSecretsInText(readFileSync(filePath, "utf8"), filePath);
    } catch {
      return [];
    }
  });
}

function main() {
  const findings = scanFiles();
  if (findings.length === 0) {
    console.log("No Stripe, Supabase, or Vercel OIDC secrets found in tracked or untracked source files.");
    return;
  }

  console.error("Potential committed secrets found:");
  for (const finding of findings) {
    console.error(`- ${finding.name} in ${finding.filePath}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
