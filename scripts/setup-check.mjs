import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const requiredEnvNames = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_RESTRICTED_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_YEARLY_PRICE_ID",
];

export function missingEnvNames(env = process.env) {
  return requiredEnvNames.filter((name) => !env[name]);
}

export function formatMissingEnv(missing) {
  return ["Missing production environment variables:", ...missing.map((name) => `- ${name}`)].join("\n");
}

export function invalidEnvMessages(env = process.env) {
  const messages = [];

  if (env.VERCEL_OIDC_TOKEN) {
    messages.push("VERCEL_OIDC_TOKEN should not be kept in .env.local; pull only app runtime env vars.");
  }
  if (env.NEXT_PUBLIC_APP_URL && !isHttpUrl(env.NEXT_PUBLIC_APP_URL)) {
    messages.push("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL.");
  }
  if (env.NEXT_PUBLIC_SUPABASE_URL && !isHttpUrl(env.NEXT_PUBLIC_SUPABASE_URL)) {
    messages.push("NEXT_PUBLIC_SUPABASE_URL must be an absolute Supabase project URL.");
  }
  if (env.STRIPE_RESTRICTED_KEY && !env.STRIPE_RESTRICTED_KEY.startsWith("rk_")) {
    messages.push("STRIPE_RESTRICTED_KEY should use a Stripe restricted key that starts with rk_.");
  }
  if (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_")) {
    messages.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_.");
  }
  if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
    messages.push("STRIPE_WEBHOOK_SECRET must start with whsec_.");
  }
  for (const name of ["STRIPE_PRO_MONTHLY_PRICE_ID", "STRIPE_PRO_YEARLY_PRICE_ID"]) {
    if (env[name] && !env[name].startsWith("price_")) {
      messages.push(`${name} must be a Stripe Price ID that starts with price_.`);
    }
  }

  return messages;
}

export function formatInvalidEnv(messages) {
  return ["Invalid production environment variables:", ...messages.map((message) => `- ${message}`)].join("\n");
}

export function envWithLocalFile(env = process.env, filePath = ".env.local") {
  return {
    ...readEnvFile(filePath),
    ...env,
  };
}

export function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const parsed = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    parsed[key] = unquoteEnvValue(rawValue);
  }

  return parsed;
}

function main() {
  const env = envWithLocalFile();
  const missing = missingEnvNames(env);

  if (missing.length > 0) {
    console.error(formatMissingEnv(missing));
    process.exit(1);
  }

  const invalid = invalidEnvMessages(env);
  if (invalid.length > 0) {
    console.error(formatInvalidEnv(invalid));
    process.exit(1);
  }

  console.log("Production environment variables are present.");
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
