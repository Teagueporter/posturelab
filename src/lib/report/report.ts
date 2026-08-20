import { decisionRules, evidenceNotes, interpretScan, protocolPhases, routine } from "@/lib/interpretation/rules";
import { measurementTrends } from "@/lib/interpretation/progress";
import { buildTrackingScore, buildWeeklyProgressReview } from "@/lib/interpretation/scan-summary";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { summarizeCheckIns, type CheckIn } from "@/lib/storage/checkins";
import type { WorkoutCompletion } from "@/lib/storage/workouts";

export function buildMarkdownReport(scans: ScanAnalysis[], checkIns: CheckIn[] = [], completions: WorkoutCompletion[] = []) {
  const latest = scans[0];
  const trends = measurementTrends(scans);
  const checkInSummary = summarizeCheckIns(checkIns);
  const trackingScore = buildTrackingScore(latest);
  const weeklyReview = buildWeeklyProgressReview({ scans, checkIns, completions, routineCount: routine.length });
  const lines: string[] = [];

  lines.push("# PostureLab Self-Experiment Report");
  lines.push("");
  lines.push("This report summarizes posture-photo measurements and a conservative exercise protocol. It does not diagnose kyphosis, scoliosis, disc problems, nerve compression, or spinal curvature.");
  lines.push("");

  if (!latest) {
    lines.push("No scans have been recorded yet.");
    return lines.join("\n");
  }

  lines.push("## Latest Scan");
  lines.push(`- Date: ${new Date(latest.createdAt).toLocaleString()}`);
  lines.push(`- Scan quality: ${latest.quality.overall}`);
  lines.push(`- Trend ready: ${latest.quality.trendReady ? "Yes" : "No"}`);
  lines.push(`- Tracking score: ${trackingScore.total}/100 (${trackingScore.confidence} confidence)`);
  for (const view of Object.values(latest.quality.views)) {
    lines.push(`- ${viewLabel(view.view)}: ${view.quality}; ${view.requiredVisible ? "upper-body landmarks visible" : "upper-body landmarks not reliable"}`);
  }
  lines.push("");

  lines.push("## Weekly Review");
  lines.push(`- Status: ${weeklyReview.status}`);
  lines.push(`- Summary: ${weeklyReview.summary}`);
  for (const bullet of weeklyReview.bullets) {
    lines.push(`- ${bullet}`);
  }
  lines.push("");

  lines.push("## Subjective Check-Ins");
  if (!checkInSummary.count) {
    lines.push("- No symptom/function check-ins recorded yet.");
  } else {
    lines.push(`- Check-ins: ${checkInSummary.count}`);
    lines.push(`- Average discomfort: ${checkInSummary.averageDiscomfort}/10`);
    lines.push(`- Average posture control: ${checkInSummary.averagePostureControl}/10`);
    lines.push(`- Average energy: ${checkInSummary.averageEnergy}/10`);
    lines.push(`- Red-flag check-ins: ${checkInSummary.redFlagCount}`);
    for (const checkIn of checkIns.slice(0, 5)) {
      lines.push(`- ${checkIn.date}: discomfort ${checkIn.discomfort}/10, posture control ${checkIn.postureControl}/10, energy ${checkIn.energy}/10${checkIn.notes ? `. Notes: ${checkIn.notes}` : ""}`);
    }
  }
  lines.push("");

  lines.push("## Key Measurements");
  for (const measurement of latest.measurements) {
    lines.push(`- ${measurement.label}: ${measurement.value}${measurement.unit} (${measurement.quality})`);
  }
  lines.push("");

  lines.push("## Interpretation");
  for (const finding of interpretScan(latest)) {
    lines.push(`### ${finding.title}`);
    lines.push(`- Priority: ${finding.priority}`);
    lines.push(`- Summary: ${finding.summary}`);
    lines.push(`- Can suggest: ${finding.whatItCanMean}`);
    lines.push(`- Cannot prove: ${finding.whatItCannotMean}`);
    lines.push(`- Track: ${finding.target}`);
    lines.push("");
  }

  lines.push("## Target Trends");
  for (const trend of trends) {
    lines.push(`- ${trend.label}: ${trend.status}; latest ${trend.latest ?? "n/a"}${trend.unit ?? ""}; delta ${trend.delta === undefined ? "n/a" : `${trend.delta > 0 ? "+" : ""}${trend.delta}${trend.unit ?? ""}`}. ${trend.summary}`);
  }
  lines.push("");

  lines.push("## 12-Week Routine");
  for (const item of routine) {
    lines.push(`### ${item.name}`);
    lines.push(`- Dosage: ${item.dosage}`);
    lines.push(`- Reason: ${item.reason}`);
    lines.push(`- Setup: ${item.setup}`);
    for (const level of item.levels) {
      lines.push(`- ${level.level}: ${level.name}; ${level.prescription}; use when ${level.whenToUse}`);
    }
    lines.push(`- Steps: ${item.steps.join(" ")}`);
    lines.push(`- Cues: ${item.cues.join("; ")}`);
    lines.push(`- Progression: ${item.progression}`);
    lines.push(`- Stop if: ${item.stopIf}`);
    lines.push("");
  }

  lines.push("## Experiment Protocol");
  for (const phase of protocolPhases) {
    lines.push(`### ${phase.name} (${phase.timing})`);
    lines.push(`- Actions: ${phase.actions.join(" ")}`);
    lines.push(`- Success criteria: ${phase.successCriteria.join(" ")}`);
    lines.push("");
  }

  lines.push("## Decision Rules");
  for (const rule of decisionRules) {
    lines.push(`- If ${rule.trigger}: ${rule.action} Rationale: ${rule.rationale}`);
  }
  lines.push("");

  lines.push("## Evidence Notes");
  for (const source of evidenceNotes) {
    lines.push(`- ${source.label} (${source.type}, ${source.strength} certainty): ${source.note} Boundary: ${source.claimBoundary} ${source.url}`);
  }

  return lines.join("\n");
}

function viewLabel(view: string) {
  if (view === "leftSide") return "Left side";
  if (view === "rightSide") return "Right side";
  return view[0].toUpperCase() + view.slice(1);
}
