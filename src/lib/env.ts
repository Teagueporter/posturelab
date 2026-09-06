export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function getPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  return process.env[name];
}

export function getRequiredServerEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function hasSupabaseBrowserEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function hasSupabaseServerEnv() {
  return hasSupabaseBrowserEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasStripeEnv() {
  return Boolean(
    process.env.STRIPE_RESTRICTED_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  );
}
