import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function checkStripeCli({ runStripe = defaultRunStripe } = {}) {
  try {
    const output = runStripe(["whoami", "--format", "json"]);
    const account = parseStripeWhoami(output);
    const authenticated = Boolean(account.accountId || account.accountName || account.userEmail);

    return {
      ok: authenticated,
      installed: true,
      authenticated,
      account,
      detail: account.accountName ? `authenticated as ${account.accountName}` : "authenticated",
    };
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    const missing = code === "ENOENT" || message.includes("ENOENT");

    return {
      ok: false,
      installed: !missing,
      authenticated: false,
      account: {},
      detail: missing ? "Stripe CLI is not installed or not on PATH" : safeError(message),
    };
  }
}

export function formatStripeCliCheck(result) {
  const lines = [`Stripe CLI check: ${result.ok ? "PASS" : "FAIL"}`];
  lines.push(`- Installed: ${result.installed ? "yes" : "no"}`);
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
  };
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
