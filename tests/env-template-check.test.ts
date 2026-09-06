import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkEnvTemplate, formatEnvTemplateCheck } from "../scripts/check-env-template.mjs";
import { requiredEnvNames } from "../scripts/setup-check.mjs";

describe("env template checker", () => {
  it("keeps .env.example aligned with required launch env vars", () => {
    const result = checkEnvTemplate();

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
  });

  it("reports missing and unexpected template keys without values", () => {
    const filePath = tempEnvFile("NEXT_PUBLIC_APP_URL=https://posturelab.example\nEXTRA_KEY=secret-value\n");
    const result = checkEnvTemplate({ filePath, required: ["NEXT_PUBLIC_APP_URL", "STRIPE_WEBHOOK_SECRET"] });
    const output = formatEnvTemplateCheck(result);

    expect(result.ok).toBe(false);
    expect(output).toContain("Missing template keys:\n- STRIPE_WEBHOOK_SECRET");
    expect(output).toContain("Unexpected template keys:\n- EXTRA_KEY");
    expect(output).not.toContain("secret-value");
  });

  it("flags secret-shaped values in the template", () => {
    const restrictedKey = ["rk", "test", "1234567890123456"].join("_");
    const filePath = tempEnvFile(`${requiredEnvNames.map((name) => `${name}=`).join("\n")}\nSTRIPE_RESTRICTED_KEY=${restrictedKey}\n`);
    const result = checkEnvTemplate({ filePath });

    expect(result.ok).toBe(false);
    expect(result.secretFindings.map((finding) => finding.name)).toEqual(["Stripe restricted key"]);
  });
});

function tempEnvFile(contents: string) {
  const filePath = path.join(mkdtempSync(path.join(tmpdir(), "posturelab-env-example-")), ".env.example");
  writeFileSync(filePath, contents);
  return filePath;
}
