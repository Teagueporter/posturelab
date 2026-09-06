import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe/server";
import { getRequiredServerEnv } from "@/lib/env";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { logRouteDone, logRouteError, logRouteStart, routeLogContext } from "@/lib/observability/logging";

export const runtime = "nodejs";

const STALE_PROCESSING_MINUTES = 10;

export async function POST(request: Request) {
  const context = routeLogContext("/api/stripe/webhook", request);
  logRouteStart(context);

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      logRouteDone(context, 400, { reason: "missing-signature" });
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    const stripe = createStripeClient();
    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, getRequiredServerEnv("STRIPE_WEBHOOK_SECRET"));
    } catch (error) {
      logRouteError(context, error, 400, { reason: "invalid-signature" });
      return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
    }

    const claim = await claimStripeEvent(event);
    if (claim === "duplicate") {
      logRouteDone(context, 200, { eventType: event.type, stripeEventId: event.id, webhookClaim: claim });
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (claim === "claim-failed") {
      logRouteError(context, new Error("Unable to claim Stripe event"), 500, { eventType: event.type, stripeEventId: event.id });
      return NextResponse.json({ error: "Unable to claim Stripe event" }, { status: 500 });
    }

    await processStripeEvent(event, stripe);
    await markStripeEventProcessed(event.id);
    logRouteDone(context, 200, { eventType: event.type, stripeEventId: event.id, webhookClaim: claim });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (isStripeEventProcessingError(error)) {
      await markStripeEventFailed(error.eventId, error.originalError);
    }
    logRouteError(context, error);
    return NextResponse.json({ error: "Unable to process Stripe event" }, { status: 500 });
  }
}

async function processStripeEvent(event: Stripe.Event, stripe: Stripe) {
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscriptionFromStripe(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    logStripeProcessingError(event, error);
    throw new StripeEventProcessingError(event.id, error);
  }
}

function logStripeProcessingError(event: Stripe.Event, error: unknown) {
  console.error(
    JSON.stringify({
      error: error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook processing error",
      eventType: event.type,
      level: "error",
      msg: "stripe-webhook-processing-failed",
      stripeEventId: event.id,
    }),
  );
}

async function claimStripeEvent(event: Stripe.Event) {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type,
    status: "processing",
    processing_started_at: now,
    last_error: null,
  });

  if (!error) return "claimed" as const;
  if (error.code !== "23505") return "claim-failed" as const;

  const { data: existing, error: readError } = await supabase
    .from("stripe_webhook_events")
    .select("status,processing_started_at")
    .eq("id", event.id)
    .maybeSingle();

  if (readError || !existing) return "claim-failed" as const;
  if (existing.status === "processed") return "duplicate" as const;
  if (existing.status === "processing" && !isStaleProcessing(existing.processing_started_at)) return "duplicate" as const;

  const { error: updateError } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      processing_started_at: now,
      last_error: null,
    })
    .eq("id", event.id);

  return updateError ? "claim-failed" as const : "claimed" as const;
}

async function markStripeEventProcessed(eventId: string) {
  const now = new Date().toISOString();
  const { error } = await createSupabaseServiceClient()
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      processed_at: now,
      last_error: null,
    })
    .eq("id", eventId);

  if (error) {
    throw new StripeEventBookkeepingError(eventId, "processed", error);
  }
}

async function markStripeEventFailed(eventId: string, error: unknown) {
  await createSupabaseServiceClient()
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      last_error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown webhook processing error",
    })
    .eq("id", eventId);
}

function isStaleProcessing(startedAt: string) {
  return Date.now() - new Date(startedAt).getTime() > STALE_PROCESSING_MINUTES * 60 * 1000;
}

class StripeEventProcessingError extends Error {
  constructor(
    readonly eventId: string,
    readonly originalError: unknown,
  ) {
    super("Stripe event processing failed");
  }
}

function isStripeEventProcessingError(error: unknown): error is StripeEventProcessingError {
  return error instanceof StripeEventProcessingError;
}

class StripeEventBookkeepingError extends Error {
  constructor(
    readonly eventId: string,
    readonly targetStatus: "processed",
    readonly originalError: unknown,
  ) {
    super(`Unable to mark Stripe event as ${targetStatus}`);
  }
}
