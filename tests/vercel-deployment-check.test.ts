import { describe, expect, it } from "vitest";
import {
  checkVercelDeployment,
  formatVercelDeploymentCheck,
  parseVercelInspectOutput,
  parseVercelListGitSha,
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
      githubCommitSha: "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
    });
  });

  it("passes when the deployment is ready and the production alias is attached", () => {
    const result = checkVercelDeployment({
      expectedGitSha: "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
      runVercel: () => inspectOutput(),
      productionUrl: "https://posturelab-six.vercel.app",
    });

    expect(result.ok).toBe(true);
    expect(formatVercelDeploymentCheck(result)).toContain("Vercel deployment check: PASS");
  });

  it("parses Vercel JSON inspect output", () => {
    const parsed = parseVercelInspectOutput(`Fetching deployment "posturelab-six.vercel.app"\n${JSON.stringify({
      id: "dpl_json",
      readyState: "READY",
      url: "posturelab-current.vercel.app",
      aliases: ["posturelab-six.vercel.app"],
      meta: {
        githubCommitSha: "abc123",
      },
    })}`);

    expect(parsed).toEqual({
      id: "dpl_json",
      status: "Ready",
      url: "https://posturelab-current.vercel.app",
      aliases: ["https://posturelab-six.vercel.app"],
      githubCommitSha: "abc123",
    });
  });

  it("falls back to Vercel list metadata when inspect omits the commit", () => {
    const calls: string[][] = [];
    const result = checkVercelDeployment({
      expectedGitSha: "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
      productionUrl: "https://posturelab-six.vercel.app",
      runVercel: (args) => {
        calls.push(args);
        return args[0] === "inspect" ? inspectJsonWithoutGitSha() : listJsonOutput();
      },
    });

    expect(result.ok).toBe(true);
    expect(result.githubCommitSha).toBe("2fe55cb53015b90ba08cea5d7e7acf5a61a35271");
    expect(calls).toEqual([
      ["inspect", "https://posturelab-six.vercel.app", "--json"],
      ["ls", "--json", "--limit", "20"],
    ]);
  });

  it("parses Git metadata from Vercel list output", () => {
    expect(parseVercelListGitSha(listJsonOutput(), "https://posturelab-oi843d07y-teagueporters-projects.vercel.app")).toBe(
      "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
    );
  });

  it("fails when the expected production alias is missing", () => {
    const result = checkVercelDeployment({
      expectedGitSha: "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
      runVercel: () => inspectOutput().replace("https://posturelab-six.vercel.app", "https://preview.example.com"),
      productionUrl: "https://posturelab-six.vercel.app",
    });

    expect(result.ok).toBe(false);
    expect(formatVercelDeploymentCheck(result)).toContain("Vercel deployment check: FAIL");
  });

  it("fails when the production deployment is behind the current commit", () => {
    const result = checkVercelDeployment({
      expectedGitSha: "current-commit",
      runVercel: () => inspectOutput(),
      productionUrl: "https://posturelab-six.vercel.app",
    });

    expect(result.ok).toBe(false);
    expect(result.gitShaMatches).toBe(false);
    expect(formatVercelDeploymentCheck(result)).toContain("Deployed commit: 2fe55cb53015b90ba08cea5d7e7acf5a61a35271");
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

  Git

    githubCommitSha 2fe55cb53015b90ba08cea5d7e7acf5a61a35271
`;
}

function inspectJsonWithoutGitSha() {
  return `Fetching deployment "posturelab-six.vercel.app"\n${JSON.stringify({
    id: "dpl_BpsrnkQi4VY1aRcNqk1mGk9PsuR8",
    readyState: "READY",
    url: "posturelab-oi843d07y-teagueporters-projects.vercel.app",
    aliases: [
      "posturelab-six.vercel.app",
      "posturelab-teagueporters-projects.vercel.app",
      "posturelab-git-main-teagueporters-projects.vercel.app",
    ],
  })}`;
}

function listJsonOutput() {
  return JSON.stringify({
    deployments: [
      {
        url: "posturelab-oi843d07y-teagueporters-projects.vercel.app",
        meta: {
          githubCommitSha: "2fe55cb53015b90ba08cea5d7e7acf5a61a35271",
        },
      },
    ],
  });
}
