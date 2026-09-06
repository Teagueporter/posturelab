import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("Stripe billing integration contracts", () => {
  it("uses subscription Checkout with dynamic payment methods and integration tracking", () => {
    const checkoutAction = source("src/app/pricing/actions.ts");

    expect(checkoutAction).toContain('mode: "subscription"');
    expect(checkoutAction).toContain("stripe.checkout.sessions.create");
    expect(checkoutAction).toContain("subscription_data");
    expect(checkoutAction).toContain("integration_identifier");
    expect(checkoutAction).not.toContain("payment_method_types");
  });

  it("uses the Customer Portal for billing self-service", () => {
    const accountActions = source("src/app/account/actions.ts");

    expect(accountActions).toContain("billingPortal.sessions.create");
    expect(accountActions).not.toContain("payment_method_types");
  });

  it("disables paid checkout buttons until billing environment variables are configured", () => {
    const pricingPage = source("src/app/pricing/page.tsx");

    expect(pricingPage).toContain("const billingReady = hasSupabaseServerEnv() && hasStripeEnv()");
    expect(pricingPage).toContain("Checkout not live yet");
    expect(pricingPage).toContain(") : !billingReady ? (");
    expect(pricingPage.indexOf(") : !billingReady ? (")).toBeLessThan(pricingPage.indexOf("<form action={startProCheckout}>"));
  });

  it("verifies webhook signatures before processing events", () => {
    const webhookRoute = source("src/app/api/stripe/webhook/route.ts");
    const signatureReadIndex = webhookRoute.indexOf('request.headers.get("stripe-signature")');
    const stripeClientIndex = webhookRoute.indexOf("const stripe = createStripeClient()");
    const signatureIndex = webhookRoute.indexOf("stripe.webhooks.constructEvent");
    const processingIndex = webhookRoute.indexOf("processStripeEvent(event, stripe)");

    expect(signatureReadIndex).toBeGreaterThan(-1);
    expect(stripeClientIndex).toBeGreaterThan(signatureReadIndex);
    expect(signatureIndex).toBeGreaterThan(-1);
    expect(processingIndex).toBeGreaterThan(signatureIndex);
    expect(webhookRoute).toContain('request.headers.get("stripe-signature")');
    expect(webhookRoute).toContain("claimStripeEvent(event)");
  });

  it("only treats processed events and fresh in-flight events as Stripe webhook duplicates", () => {
    const webhookRoute = source("src/app/api/stripe/webhook/route.ts");

    expect(webhookRoute).toContain('if (existing.status === "processed") return "duplicate"');
    expect(webhookRoute).toContain('if (existing.status === "processing" && !isStaleProcessing(existing.processing_started_at)) return "duplicate"');
    expect(webhookRoute).not.toContain('existing.status === "failed") return "duplicate"');
  });

  it("allows failed or stale Stripe webhook events to be claimed again for retry", () => {
    const webhookRoute = source("src/app/api/stripe/webhook/route.ts");
    const duplicateChecksIndex = webhookRoute.indexOf('if (existing.status === "processing" && !isStaleProcessing(existing.processing_started_at)) return "duplicate"');
    const retryUpdateIndex = webhookRoute.indexOf('status: "processing",', duplicateChecksIndex);

    expect(duplicateChecksIndex).toBeGreaterThan(-1);
    expect(retryUpdateIndex).toBeGreaterThan(duplicateChecksIndex);
    expect(webhookRoute).toContain("const STALE_PROCESSING_MINUTES = 10");
    expect(webhookRoute).toContain("markStripeEventFailed(error.eventId, error.originalError)");
  });

  it("fails the Stripe webhook request if processed-event bookkeeping cannot be recorded", () => {
    const webhookRoute = source("src/app/api/stripe/webhook/route.ts");
    const markProcessedCallIndex = webhookRoute.indexOf("await markStripeEventProcessed(event.id)");
    const successResponseIndex = webhookRoute.indexOf("return NextResponse.json({ received: true });");
    const markProcessedIndex = webhookRoute.indexOf("async function markStripeEventProcessed");
    const bookkeepingErrorIndex = webhookRoute.indexOf("throw new StripeEventBookkeepingError", markProcessedIndex);

    expect(markProcessedCallIndex).toBeGreaterThan(-1);
    expect(successResponseIndex).toBeGreaterThan(markProcessedCallIndex);
    expect(markProcessedIndex).toBeGreaterThan(-1);
    expect(bookkeepingErrorIndex).toBeGreaterThan(markProcessedIndex);
    expect(webhookRoute).toContain('super(`Unable to mark Stripe event as ${targetStatus}`)');
  });

  it("documents Stripe Tax as a launch consideration instead of enabling it prematurely", () => {
    const setupDoc = source("PRODUCTION_SETUP.md");
    const checkoutAction = source("src/app/pricing/actions.ts");

    expect(setupDoc).toContain("review Stripe Tax");
    expect(checkoutAction).not.toContain("automatic_tax");
  });
});
