import { NextResponse } from "next/server";
import { hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";
import { logRouteDone, logRouteStart, routeLogContext } from "@/lib/observability/logging";

export function healthPayload(now = new Date()) {
  const supabaseConfigured = hasSupabaseServerEnv();
  const stripeConfigured = hasStripeEnv();

  return {
    ok: true,
    checkedAt: now.toISOString(),
    services: {
      supabase: supabaseConfigured ? "configured" : "missing-env",
      stripe: stripeConfigured ? "configured" : "missing-env",
    },
  };
}

export function healthHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}

export function GET(request: Request) {
  const context = routeLogContext("/api/health", request);
  logRouteStart(context);

  const payload = healthPayload();
  logRouteDone(context, 200, {
    stripe: payload.services.stripe,
    supabase: payload.services.supabase,
  });

  return NextResponse.json(payload, {
    headers: healthHeaders(),
  });
}
