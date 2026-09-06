import { describe, expect, it } from "vitest";
import {
  checkVercelDeployment,
  formatVercelDeploymentCheck,
  parseVercelInspectOutput,
} from "../scripts/check-vercel-deployment.mjs";

describe("Vercel deployment checker", () => {
  it("parses Vercel inspect output", () => {
    const parsed = parseVercelInspectOutput(inspectOutput());

    expect(parsed).toEqual({
      id: "dpl_4zzdTduAZzPkZx7EWbKPRMXT7K9J",
      status: "Ready",
      url: "https://posturelab-m0n7ilwuo-teagueporters-projects.vercel.app",
      aliases: [
        "https://posturelab-six.vercel.app",
        "https://posturelab-teagueporters-projects.vercel.app",
      ],
    });
  });

  it("passes when the deployment is ready and the production alias is attached", () => {
    const result = checkVercelDeployment({
      runVercel: () => inspectOutput(),
      productionUrl: "https://posturelab-six.vercel.app",
    });

    expect(result.ok).toBe(true);
    expect(formatVercelDeploymentCheck(result)).toContain("Vercel deployment check: PASS");
  });

  it("fails when the expected production alias is missing", () => {
    const result = checkVercelDeployment({
      runVercel: () => inspectOutput().replace("https://posturelab-six.vercel.app", "https://preview.example.com"),
      productionUrl: "https://posturelab-six.vercel.app",
    });

    expect(result.ok).toBe(false);
    expect(formatVercelDeploymentCheck(result)).toContain("Vercel deployment check: FAIL");
  });
});

function inspectOutput() {
  return `Vercel CLI 59.11.7 (Node.js 24.19.0)
Fetching deployment "posturelab-six.vercel.app" in teagueporters-projects
> Fetched deployment "posturelab-m0n7ilwuo-teagueporters-projects.vercel.app" in teagueporters-projects [321ms]

  General

    id		dpl_4zzdTduAZzPkZx7EWbKPRMXT7K9J
    name	posturelab
    target	production
    status	● Ready
    url		https://posturelab-m0n7ilwuo-teagueporters-projects.vercel.app
    created	Sun Sep 06 2026 11:34:49 GMT-0600 (Mountain Daylight Time) [2m ago]


  Aliases

    ╶ https://posturelab-six.vercel.app
    ╶ https://posturelab-teagueporters-projects.vercel.app
`;
}
