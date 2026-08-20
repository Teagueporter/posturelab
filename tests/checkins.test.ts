import { describe, expect, it } from "vitest";
import { summarizeCheckIns, type CheckIn } from "@/lib/storage/checkins";

describe("check-in summaries", () => {
  it("summarizes subjective outcomes and red flags", () => {
    const summary = summarizeCheckIns([
      checkIn("2026-01-02", 4, 6, 7, true),
      checkIn("2026-01-01", 2, 8, 5, false),
    ]);
    expect(summary.count).toBe(2);
    expect(summary.averageDiscomfort).toBe(3);
    expect(summary.averagePostureControl).toBe(7);
    expect(summary.averageEnergy).toBe(6);
    expect(summary.redFlagCount).toBe(1);
  });

  it("returns an empty summary without averages", () => {
    expect(summarizeCheckIns([])).toEqual({ count: 0, redFlagCount: 0 });
  });
});

function checkIn(date: string, discomfort: number, postureControl: number, energy: number, redFlags: boolean): CheckIn {
  return {
    id: date,
    date,
    discomfort,
    postureControl,
    energy,
    redFlags,
    notes: "",
    createdAt: `${date}T00:00:00.000Z`,
  };
}
