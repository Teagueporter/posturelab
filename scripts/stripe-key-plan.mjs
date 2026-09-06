import { pathToFileURL } from "node:url";

export const stripeRestrictedKeyPermissions = [
  {
    resource: "Customers",
    access: "read/write",
    reason: "Checkout creates or reuses a Stripe Customer mapped to the signed-in user.",
  },
  {
    resource: "Checkout Sessions",
    access: "write",
    reason: "Upgrade flow creates subscription Checkout Sessions.",
  },
  {
    resource: "Customer Portal Sessions",
    access: "write",
    reason: "Account page creates hosted portal sessions for billing self-service.",
  },
  {
    resource: "Subscriptions",
    access: "read/write",
    reason: "Webhook processing reads subscriptions, and account deletion can cancel active subscriptions.",
  },
  {
    resource: "Prices",
    access: "read",
    reason: "Launch readiness verifies the configured monthly and yearly price IDs.",
  },
  {
    resource: "Products",
    access: "read",
    reason: "Launch readiness expands prices to confirm their Product is active.",
  },
];

export function buildStripeKeyPlan({ permissions = stripeRestrictedKeyPermissions } = {}) {
  return [
    "Stripe restricted key setup plan",
    "",
    "Create a restricted key, not a broad secret key, for STRIPE_RESTRICTED_KEY.",
    "Use separate test and live restricted keys.",
    "",
    "Required permissions:",
    ...permissions.map((permission) => `- ${permission.resource}: ${permission.access} - ${permission.reason}`),
    "",
    "Store the key only in local .env.local and Vercel sensitive environment variables.",
    "After local Stripe env vars are filled, run: npm run stripe:live-check",
  ].join("\n");
}

async function main() {
  console.log(buildStripeKeyPlan());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
