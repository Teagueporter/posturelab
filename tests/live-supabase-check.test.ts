import { describe, expect, it } from "vitest";
import { checkLiveSupabase, formatLiveSupabaseCheck } from "../scripts/check-live-supabase.mjs";

describe("live Supabase checker", () => {
  it("fails safely when live Supabase env vars are missing", async () => {
    const result = await checkLiveSupabase({
      env: { NODE_ENV: "test" } as NodeJS.ProcessEnv,
      client: fakeSupabaseClient() as never,
    });

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    expect(formatLiveSupabaseCheck(result)).toContain("Live Supabase check: FAIL");
  });

  it("checks app tables and requires the scan photo bucket to be private", async () => {
    const result = await checkLiveSupabase({
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "sb_secret_example",
      } as NodeJS.ProcessEnv,
      client: fakeSupabaseClient() as never,
      tables: ["profiles", "scans", "stripe_webhook_events"],
    });

    const output = formatLiveSupabaseCheck(result);

    expect(result.ok).toBe(true);
    expect(result.tableChecks.map((check) => check.table)).toEqual(["profiles", "scans", "stripe_webhook_events"]);
    expect(result.storage.detail).toBe("scan-images bucket exists and is private");
    expect(output).toContain("PASS profiles");
    expect(output).not.toContain("sb_secret_example");
  });

  it("fails when the scan photo bucket is public", async () => {
    const result = await checkLiveSupabase({
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "sb_secret_example",
      } as NodeJS.ProcessEnv,
      client: fakeSupabaseClient({ publicBucket: true }) as never,
      tables: ["profiles"],
    });

    expect(result.ok).toBe(false);
    expect(result.storage.detail).toBe("scan-images bucket must be private");
  });
});

function fakeSupabaseClient({ publicBucket = false } = {}) {
  return {
    from() {
      return {
        select() {
          return Promise.resolve({ data: null, error: null, count: 0 });
        },
      };
    },
    storage: {
      listBuckets() {
        return Promise.resolve({
          data: [{ name: "scan-images", public: publicBucket }],
          error: null,
        });
      },
    },
  };
}
