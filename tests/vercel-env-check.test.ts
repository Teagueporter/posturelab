import { describe, expect, it } from "vitest";
import { checkVercelEnvPresence, formatVercelEnvPresence, parseVercelEnvListOutput } from "../scripts/check-vercel-env.mjs";

describe("Vercel env presence checker", () => {
  it("parses Vercel CLI JSON output after the progress preface", () => {
    const parsed = parseVercelEnvListOutput('Retrieving project...\n{"envs":[{"key":"NEXT_PUBLIC_APP_URL","value":"encrypted"}]}');

    expect(parsed.envs[0].key).toBe("NEXT_PUBLIC_APP_URL");
  });

  it("reports missing Vercel env vars without printing encrypted values", () => {
    const result = checkVercelEnvPresence({
      runVercel: () =>
        JSON.stringify({
          envs: [
            {
              key: "NEXT_PUBLIC_APP_URL",
              value: "encrypted-secret-blob",
              type: "encrypted",
              visibility: "config",
              target: ["production", "preview", "development"],
            },
          ],
        }),
    });

    const output = formatVercelEnvPresence(result);

    expect(result.ok).toBe(false);
    expect(output).toContain("Vercel env check: FAIL");
    expect(output).toContain("PASS NEXT_PUBLIC_APP_URL");
    expect(output).toContain("FAIL NEXT_PUBLIC_SUPABASE_URL");
    expect(output).not.toContain("encrypted-secret-blob");
  });

  it("requires each configured variable to cover production and preview", () => {
    const result = checkVercelEnvPresence({
      required: ["NEXT_PUBLIC_APP_URL"],
      runVercel: () =>
        JSON.stringify({
          envs: [
            {
              key: "NEXT_PUBLIC_APP_URL",
              value: "encrypted-secret-blob",
              type: "encrypted",
              visibility: "config",
              target: ["production"],
            },
          ],
        }),
    });

    expect(result.ok).toBe(false);
    expect(result.checks[0]?.missingTargets).toEqual(["preview"]);
    expect(formatVercelEnvPresence(result)).toContain("missing preview");
  });

  it("requires server secrets to be stored as Vercel sensitive variables", () => {
    const result = checkVercelEnvPresence({
      required: ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_APP_URL"],
      runVercel: () =>
        JSON.stringify({
          envs: [
            {
              key: "SUPABASE_SERVICE_ROLE_KEY",
              value: "encrypted-secret-blob",
              type: "encrypted",
              visibility: "config",
              target: ["production", "preview"],
            },
            {
              key: "NEXT_PUBLIC_APP_URL",
              value: "encrypted-public-blob",
              type: "encrypted",
              visibility: "config",
              target: ["production", "preview"],
            },
          ],
        }),
    });

    const output = formatVercelEnvPresence(result);

    expect(result.ok).toBe(false);
    expect(result.checks.find((check) => check.name === "SUPABASE_SERVICE_ROLE_KEY")?.sensitivityOk).toBe(false);
    expect(result.checks.find((check) => check.name === "NEXT_PUBLIC_APP_URL")?.sensitivityOk).toBe(true);
    expect(output).toContain("SUPABASE_SERVICE_ROLE_KEY: must be stored as a Vercel sensitive variable");
    expect(output).not.toContain("encrypted-secret-blob");
  });
});
