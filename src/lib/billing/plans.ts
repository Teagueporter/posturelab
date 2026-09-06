export type BillingInterval = "monthly" | "yearly";

export type Plan = {
  id: "free" | "pro";
  name: string;
  description: string;
  price: string;
  interval?: BillingInterval;
  audience: string;
  features: string[];
  limits: string[];
  priceEnv?: "STRIPE_PRO_MONTHLY_PRICE_ID" | "STRIPE_PRO_YEARLY_PRICE_ID";
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Validate the scan and understand the main findings.",
    price: "$0",
    audience: "Best for trying the camera flow and seeing whether the posture readout feels useful.",
    features: ["1 saved scan", "Body-level findings", "Starter corrective routine"],
    limits: ["No long-term trend history", "No weekly progress review", "No report export"],
  },
  {
    id: "pro",
    name: "Pro monthly",
    description: "For active posture tracking and weekly plan progression.",
    price: "$4.99",
    interval: "monthly",
    priceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID",
    audience: "Best when you want to rescan, adjust the plan, and keep yourself accountable month to month.",
    features: ["Unlimited scans", "Weekly progress reviews", "Personalized exercise progression", "Exportable reports"],
    limits: ["Cancel from the billing portal", "Photo-based tracking only; not medical diagnosis"],
  },
  {
    id: "pro",
    name: "Pro yearly",
    description: "Best price for ongoing posture work.",
    price: "$29",
    interval: "yearly",
    priceEnv: "STRIPE_PRO_YEARLY_PRICE_ID",
    audience: "Best for a longer posture rebuild where month-to-month comparison matters.",
    features: ["Unlimited scans", "Weekly progress reviews", "Personalized exercise progression", "Exportable reports"],
    limits: ["About 52% less than monthly", "Photo-based tracking only; not medical diagnosis"],
  },
];

export function isProStatus(status?: string | null) {
  return status === "active" || status === "trialing";
}

export function parseBillingInterval(value: FormDataEntryValue | string | null | undefined): BillingInterval | null {
  if (value === "monthly" || value === "yearly") return value;
  return null;
}
