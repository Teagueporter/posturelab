import { measurementTrends } from "@/lib/interpretation/progress";
import type { ScanAnalysis } from "@/lib/measurements/types";
import type { CheckIn } from "@/lib/storage/checkins";
import type { WorkoutCompletion } from "@/lib/storage/workouts";

export type TrackingScore = {
  total: number;
  confidence: "High" | "Medium" | "Low";
  parts: Array<{ label: string; score: number; note: string }>;
  summary: string;
};

export type WeeklyProgressReview = {
  title: string;
  status: "baseline" | "building" | "review" | "caution";
  summary: string;
  bullets: string[];
};

export function buildTrackingScore(scan?: ScanAnalysis): TrackingScore {
  if (!scan) {
    return {
      total: 0,
      confidence: "Low",
      parts: [],
      summary: "No scan has been recorded yet.",
    };
  }

  const headAverage = average([
    value(scan, "leftSide_ear_over_shoulder_offset"),
    value(scan, "rightSide_ear_over_shoulder_offset"),
    value(scan, "leftSide_neck_lean"),
    value(scan, "rightSide_neck_lean"),
  ]);
  const trunkAverage = average([
    value(scan, "leftSide_shoulder_over_hip_offset"),
    value(scan, "rightSide_shoulder_over_hip_offset"),
    value(scan, "front_trunk_lean"),
    value(scan, "back_trunk_lean"),
  ]);
  const symmetryAverage = average([
    value(scan, "front_shoulder_tilt"),
    value(scan, "back_shoulder_tilt"),
    value(scan, "front_shoulder_hip_tilt_difference"),
    value(scan, "back_shoulder_hip_tilt_difference"),
  ]);

  const parts = [
    {
      label: "Head position",
      score: scoreFrom(headAverage, 6, 24),
      note: "Uses side-view head offset and neck-lean proxies.",
    },
    {
      label: "Trunk position",
      score: scoreFrom(trunkAverage, 4, 18),
      note: "Uses side shoulder-over-hip offset and front/back trunk lean.",
    },
    {
      label: "Symmetry",
      score: scoreFrom(symmetryAverage, 2, 12),
      note: "Uses shoulder tilt and shoulder-hip tilt difference.",
    },
    {
      label: "Scan reliability",
      score: qualityScore(scan),
      note: "Uses landmark quality across the four scan views.",
    },
  ];
  const total = round(parts.reduce((sum, part) => sum + part.score, 0) / parts.length);
  const confidence = scan.quality.overall === "High" && scan.quality.trendReady ? "High" : scan.quality.overall === "Unavailable" ? "Low" : "Medium";

  return {
    total,
    confidence,
    parts,
    summary: `Tracking score ${total}/100. Reliability: ${confidence.toLowerCase()}. Use this as a trend summary, not a diagnosis.`,
  };
}

export function buildWeeklyProgressReview(input: {
  scans: ScanAnalysis[];
  checkIns: CheckIn[];
  completions: WorkoutCompletion[];
  routineCount: number;
  today?: Date;
}): WeeklyProgressReview {
  const today = input.today ?? new Date();
  const weekStart = weeklyReviewStartKey(today);
  const recentScans = input.scans.filter((scan) => scan.createdAt.slice(0, 10) >= weekStart);
  const recentCheckIns = input.checkIns.filter((checkIn) => checkIn.date >= weekStart);
  const recentCompletions = input.completions.filter((completion) => completion.date >= weekStart);
  const adherenceSlots = Math.max(1, input.routineCount * 7);
  const adherence = Math.round((recentCompletions.length / adherenceSlots) * 100);
  const redFlags = recentCheckIns.filter((checkIn) => checkIn.redFlags).length;
  const trends = measurementTrends(input.scans);
  const improving = trends.filter((trend) => trend.status === "improving").length;
  const reviewable = trends.filter((trend) => trend.status !== "not-enough-data").length;

  if (redFlags > 0) {
    return {
      title: "Weekly review",
      status: "caution",
      summary: "Symptoms were flagged this week, so training changes should be conservative.",
      bullets: [
        `${redFlags} red-flag check-in${redFlags === 1 ? "" : "s"} recorded.`,
        "Stop provoking exercises and consider qualified clinical input if symptoms persist or worsen.",
        `Workout adherence: ${adherence}%.`,
      ],
    };
  }

  if (input.scans.length < 3) {
    return {
      title: "Weekly review",
      status: "baseline",
      summary: "Keep collecting comparable scans before judging whether posture metrics are changing.",
      bullets: [
        `${Math.max(0, 3 - input.scans.length)} more comparable scan${3 - input.scans.length === 1 ? "" : "s"} needed for trend labels.`,
        `Workout adherence this week: ${adherence}%.`,
        `${recentScans.length} scan${recentScans.length === 1 ? "" : "s"} recorded in the last 7 days.`,
      ],
    };
  }

  return {
    title: "Weekly review",
    status: improving > 0 ? "review" : "building",
    summary: improving > 0
      ? `${improving} of ${reviewable} reviewable targets are moving in the intended direction.`
      : "No target is clearly improving yet; check adherence and scan repeatability before changing exercises.",
    bullets: [
      `Workout adherence this week: ${adherence}%.`,
      `${recentCheckIns.length} symptom/function check-in${recentCheckIns.length === 1 ? "" : "s"} recorded.`,
      reviewable === 0 ? "Trend labels are still limited by data quality or scan count." : `${reviewable} target${reviewable === 1 ? "" : "s"} have enough data for review.`,
    ],
  };
}

export function weeklyReviewStartKey(today = new Date()) {
  return dateKey(daysAgo(today, 6));
}

function value(scan: ScanAnalysis, id: string) {
  return scan.measurements.find((measurement) => measurement.id === id)?.value;
}

function average(values: Array<number | undefined>) {
  const present = values.filter((item): item is number => item !== undefined);
  if (!present.length) return 0;
  return present.reduce((sum, item) => sum + item, 0) / present.length;
}

function scoreFrom(value: number, good: number, poor: number) {
  if (value <= good) return 100;
  if (value >= poor) return 45;
  return round(100 - ((value - good) / (poor - good)) * 55);
}

function qualityScore(scan: ScanAnalysis) {
  if (scan.quality.overall === "High") return 100;
  if (scan.quality.overall === "Medium") return 78;
  if (scan.quality.overall === "Low") return 55;
  return 25;
}

function daysAgo(today: Date, days: number) {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
