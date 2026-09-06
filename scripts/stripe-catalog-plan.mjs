import { pathToFileURL } from "node:url";

export const stripeProduct = {
  name: "Posture Pro",
  description: "PostureLab Pro subscription.",
  placeholder: "prod_REPLACE_PRO",
};

export const stripeCatalogItems = [
  {
    key: "monthly",
    lookupKey: "posture_pro_monthly",
    unitAmount: 499,
    interval: "month",
    priceEnvName: "STRIPE_PRO_MONTHLY_PRICE_ID",
    productPlaceholder: "prod_REPLACE_MONTHLY",
  },
  {
    key: "yearly",
    lookupKey: "posture_pro_yearly",
    unitAmount: 2900,
    interval: "year",
    priceEnvName: "STRIPE_PRO_YEARLY_PRICE_ID",
    productPlaceholder: "prod_REPLACE_YEARLY",
  },
];

export function buildStripeCatalogPlan({ catalogItems = stripeCatalogItems, product = stripeProduct } = {}) {
  const lines = [
    "Stripe catalog setup plan",
    "",
    "Run these with the Stripe CLI after selecting the right Stripe mode.",
    "These commands do not include or print Stripe API keys.",
    "",
    "# Posture Pro product",
    [
      "stripe products create",
      `--name ${quoteShell(product.name)}`,
      `--description ${quoteShell(product.description)}`,
    ].join(" "),
    `Use the returned product id in place of ${product.placeholder} for both prices.`,
    "",
  ];

  for (const item of catalogItems) {
    lines.push(`# Posture Pro ${item.key}`);
    lines.push(
      [
        "stripe prices create",
        `--product ${product.placeholder}`,
        "--currency usd",
        `--unit-amount ${item.unitAmount}`,
        `--recurring interval=${item.interval}`,
        `--lookup-key ${item.lookupKey}`,
      ].join(" "),
    );
    lines.push(`Copy the returned price id to ${item.priceEnvName}.`);
    lines.push("");
  }

  lines.push("After local env vars are filled, run:");
  lines.push("npm run stripe:live-check");

  return lines.join("\n");
}

function quoteShell(value) {
  return JSON.stringify(value);
}

async function main() {
  console.log(buildStripeCatalogPlan());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
