import { describe, expect, it } from "vitest";
import nextConfig from "@/../next.config";

describe("security headers", () => {
  it("allows required Stripe, Supabase, and MediaPipe hosts without wildcarding all origins", async () => {
    const headers = await nextConfig.headers?.();
    const csp = headers?.[0]?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("https://*.stripe.com");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("https://cdn.jsdelivr.net");
    expect(csp).toContain("https://storage.googleapis.com");
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).toContain("worker-src 'self' blob: https://cdn.jsdelivr.net");
    expect(csp).not.toContain("default-src *");
    expect(csp).not.toContain("connect-src *");
  });
});
