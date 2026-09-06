import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const minimumStripeCliVersion = "1.43.3";

export function checkStripeCli({ runStripe = defaultRunStripe } = {}) {
  let version = null;
  let versionOk = false;

  try {
    const versionOutput = runStripe(["version"]);
    version = parseStripeCliVersion(versionOutput);
    versionOk = version ? compareSemver(version, minimumStripeCliVersion) >= 0 : false;
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    const missing = code === "ENOENT" || message.includes("ENOENT");

    return {
      ok: false,
      installed: !missing,
      authenticated: false,
      version: null,
      versionOk: false,
      account: {},
      detail: missing ? "Stripe CLI is not installed or not on PATH" : safeError(message),
    };
  }

  try {
    const output = runStripe(["whoami", "--format", "json"]);
    return stripeCliResultFromWhoami(output, { version, versionOk });
  } catch (error) {
    if (error?.stdout) {
      return stripeCliResultFromWhoami(String(error.stdout), { version, versionOk });
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      installed: true,
      authenticated: false,
      version,
      versionOk,
      account: {},
      detail: versionOk === false ? `Stripe CLI must be ${minimumStripeCliVersion}+ for current setup docs` : safeError(message),
    };
  }
}

export function formatStripeCliCheck(result) {
  const lines = [`Stripe CLI check: ${result.ok ? "PASS" : "FAIL"}`];
  lines.push(`- Installed: ${result.installed ? "yes" : "no"}`);
  if (result.installed) {
    lines.push(`- Version: ${result.version ?? "unknown"}${result.versionOk === false ? `, expected ${minimumStripeCliVersion}+` : ""}`);
  }
  lines.push(`- Authenticated: ${result.authenticated ? "yes" : "no"}`);
  lines.push(`- Detail: ${result.detail}`);

  if (!result.ok) {
    lines.push("- Setup path: install/authenticate Stripe CLI, or use the Stripe Dashboard with the same product, price, restricted-key, and webhook settings.");
  }

  return lines.join("\n");
}

export function parseStripeWhoami(output) {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) return {};

  const parsed = JSON.parse(output.slice(jsonStart));
  return {
    accountId: parsed.account_id ?? parsed.accountId,
    accountName: parsed.account_name ?? parsed.accountName,
    userEmail: parsed.user_email ?? parsed.userEmail,
    authenticated: parsed.authenticated,
    profileName: parsed.profile_name ?? parsed.profileName,
  };
}

export function parseStripeCliVersion(output) {
  const match = output.match(/\b(\d+\.\d+\.\d+)\b/);
  return match?.[1] ?? null;
}

function stripeCliResultFromWhoami(output, { version, versionOk }) {
  const account = parseStripeWhoami(output);
  const authenticated =
    account.authenticated === true || Boolean(account.accountId || account.accountName || account.userEmail);

  return {
    ok: authenticated && versionOk !== false,
    installed: true,
    authenticated,
    version,
    versionOk,
    account,
    detail: versionOk === false
      ? `Stripe CLI must be ${minimumStripeCliVersion}+ for current setup docs`
      : authenticated
      ? account.accountName
        ? `authenticated as ${account.accountName}`
        : "authenticated"
      : `Stripe CLI is installed but not authenticated${account.profileName ? ` for profile ${account.profileName}` : ""}`,
  };
}

function compareSemver(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function defaultRunStripe(args) {
  return execFileSync("stripe", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function safeError(message) {
  return message.split("\n")[0] || "Stripe CLI check failed";
}

function main() {
  const result = checkStripeCli();
  const output = formatStripeCliCheck(result);

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
