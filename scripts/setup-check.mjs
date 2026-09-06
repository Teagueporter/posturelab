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

function main() {
  const missing = missingEnvNames();

  if (missing.length > 0) {
    console.error(formatMissingEnv(missing));
    process.exit(1);
  }

  const invalid = invalidEnvMessages();
  if (invalid.length > 0) {
    console.error(formatInvalidEnv(invalid));
    process.exit(1);
  }

  console.log("Production environment variables are present.");
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
