import { pathToFileURL } from "node:url";

export const stripeCatalogItems = [
  {
    key: "monthly",
    productName: "Posture Pro Monthly",
    productDescription: "PostureLab Pro subscription billed monthly.",
    lookupKey: "posture_pro_monthly",
    unitAmount: 499,
    interval: "month",
    priceEnvName: "STRIPE_PRO_MONTHLY_PRICE_ID",
    productPlaceholder: "prod_REPLACE_MONTHLY",
  },
  {
    key: "yearly",
    productName: "Posture Pro Yearly",
    productDescription: "PostureLab Pro subscription billed yearly.",
    lookupKey: "posture_pro_yearly",
    unitAmount: 2900,
    interval: "year",
    priceEnvName: "STRIPE_PRO_YEARLY_PRICE_ID",
    productPlaceholder: "prod_REPLACE_YEARLY",
  },
];

export function buildStripeCatalogPlan({ catalogItems = stripeCatalogItems } = {}) {
  const lines = [
    "Stripe catalog setup plan",
    "",
    "Run these with the Stripe CLI after selecting the right Stripe mode.",
    "These commands do not include or print Stripe API keys.",
    "",
  ];

  for (const item of catalogItems) {
    lines.push(`# ${item.productName}`);
    lines.push(
      [
        "stripe products create",
        `--name ${quoteShell(item.productName)}`,
        `--description ${quoteShell(item.productDescription)}`,
      ].join(" "),
    );
    lines.push(
      [
        "stripe prices create",
        `--product ${item.productPlaceholder}`,
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
