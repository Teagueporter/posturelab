import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  actionLogContext,
  logActionDone,
  logActionError,
  logActionStart,
  logRouteDone,
  logRouteError,
  logRouteStart,
  routeLogContext,
} from "@/lib/observability/logging";

function source(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("structured route logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes compact JSON logs with route, status, duration, and request id", () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1042);
    const request = new Request("https://example.com/api/health", {
      headers: { "x-vercel-id": "sfo1::abc-123" },
    });

    const context = routeLogContext("/api/health", request);
    logRouteStart(context);
    logRouteDone(context, 200, { supabase: "missing-env", stripe: "configured" });

    expect(info).toHaveBeenCalledTimes(2);
    expect(JSON.parse(info.mock.calls[0][0])).toMatchObject({
      level: "info",
      msg: "start",
      requestId: "sfo1::abc-123",
      route: "/api/health",
    });
    expect(JSON.parse(info.mock.calls[1][0])).toMatchObject({
      level: "info",
      msg: "done",
      ms: 42,
      requestId: "sfo1::abc-123",
      route: "/api/health",
      status: 200,
      stripe: "configured",
      supabase: "missing-env",
    });
  });

  it("truncates error messages and avoids logging known secret-shaped payloads", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1010);
    const context = routeLogContext("/api/stripe/webhook", new Request("https://example.com/api/stripe/webhook"));

    logRouteError(context, new Error("x".repeat(700)), 500, { eventType: "customer.subscription.updated" });

    const payload = JSON.parse(error.mock.calls[0][0]);
    expect(payload).toMatchObject({
      eventType: "customer.subscription.updated",
      level: "error",
      msg: "failed",
      route: "/api/stripe/webhook",
      status: 500,
    });
    expect(payload.error).toHaveLength(500);
    expect(error.mock.calls[0][0]).not.toMatch(/whsec_|rk_(live|test)_|sk_(live|test)_|sb_secret_/);
  });

  it("instruments launch-critical API routes", () => {
    for (const route of ["src/app/api/health/route.ts", "src/app/api/account/export/route.ts", "src/app/api/stripe/webhook/route.ts"]) {
      const routeSource = source(route);

      expect(routeSource).toContain("routeLogContext(");
      expect(routeSource).toContain("logRouteStart(context)");
      expect(routeSource).toMatch(/logRoute(Done|Error)\(context/);
    }
  });

  it("writes action logs without request-specific private identifiers", () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(Date, "now").mockReturnValueOnce(2000).mockReturnValueOnce(2015).mockReturnValueOnce(2025);
    const context = actionLogContext("startProCheckout");

    logActionStart(context, { interval: "monthly" });
    logActionDone(context, "redirect-checkout", { interval: "monthly" });
    logActionError(context, new Error("provider failed"), { reason: "checkout-create-failed" });

    expect(JSON.parse(info.mock.calls[0][0])).toMatchObject({
      action: "startProCheckout",
      interval: "monthly",
      level: "info",
      msg: "start",
    });
    expect(JSON.parse(info.mock.calls[1][0])).toMatchObject({
      action: "startProCheckout",
      level: "info",
      msg: "done",
      ms: 15,
      result: "redirect-checkout",
    });
    expect(JSON.parse(error.mock.calls[0][0])).toMatchObject({
      action: "startProCheckout",
      error: "provider failed",
      level: "error",
      msg: "failed",
      ms: 25,
      reason: "checkout-create-failed",
    });
  });

  it("instruments billing and auth server actions without logging email or user id fields", () => {
    for (const actionFile of ["src/app/login/actions.ts", "src/app/pricing/actions.ts", "src/app/account/actions.ts"]) {
      const actionSource = source(actionFile);

      expect(actionSource).toContain("actionLogContext(");
      expect(actionSource).toContain("logActionStart(context");
      expect(actionSource).toMatch(/logAction(Done|Error)\(context/);
      expect(actionSource).not.toMatch(/logAction(?:Start|Done|Error)\([^)]*(?:user\.id|user\.email|email,)/);
    }
  });
});
