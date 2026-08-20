import type { Measurement, ScanAnalysis } from "@/lib/measurements/types";

export type MeasurementTarget = {
  id: string;
  label: string;
  direction: "decrease" | "stabilize" | "increase-quality";
  reason: string;
};

export type MeasurementTrend = {
  id: string;
  label: string;
  points: Array<{ date: string; value: number; quality: string; unit: string }>;
  baseline?: number;
  latest?: number;
  delta?: number;
  unit?: string;
  status: "not-enough-data" | "improving" | "worsening" | "stable" | "mixed-quality";
  summary: string;
};

export const measurementTargets: MeasurementTarget[] = [
  {
    id: "leftSide_ear_over_shoulder_offset",
    label: "Left-side view head alignment",
    direction: "decrease",
    reason: "Side-photo proxy for forward head position.",
  },
  {
    id: "rightSide_ear_over_shoulder_offset",
    label: "Right-side view head alignment",
    direction: "decrease",
    reason: "Side-photo proxy for forward head position.",
  },
  {
    id: "leftSide_neck_lean",
    label: "Left-side view neck lean",
    direction: "decrease",
    reason: "Side-photo proxy for head/neck segment lean.",
  },
  {
    id: "rightSide_neck_lean",
    label: "Right-side view neck lean",
    direction: "decrease",
    reason: "Side-photo proxy for head/neck segment lean.",
  },
  {
    id: "leftSide_craniovertebral_angle_proxy",
    label: "Left-side view CVA proxy",
    direction: "stabilize",
    reason: "Side-photo craniovertebral-angle style proxy; track consistency across repeat scans.",
  },
  {
    id: "rightSide_craniovertebral_angle_proxy",
    label: "Right-side view CVA proxy",
    direction: "stabilize",
    reason: "Side-photo craniovertebral-angle style proxy; track consistency across repeat scans.",
  },
  {
    id: "leftSide_shoulder_over_hip_offset",
    label: "Left-side view shoulder-over-hip offset",
    direction: "decrease",
    reason: "Side-photo proxy for rounded trunk or shoulder position.",
  },
  {
    id: "rightSide_shoulder_over_hip_offset",
    label: "Right-side view shoulder-over-hip offset",
    direction: "decrease",
    reason: "Side-photo proxy for rounded trunk or shoulder position.",
  },
  {
    id: "front_trunk_lean",
    label: "Front trunk lean",
    direction: "stabilize",
    reason: "Upper-body vertical alignment proxy from shoulders to hips.",
  },
  {
    id: "back_trunk_lean",
    label: "Back trunk lean",
    direction: "stabilize",
    reason: "Upper-body vertical alignment proxy from shoulders to hips.",
  },
  {
    id: "front_shoulder_hip_tilt_difference",
    label: "Front shoulder-hip tilt difference",
    direction: "decrease",
    reason: "Front-view asymmetry consistency check.",
  },
];

export function latestMeasurement(scans: ScanAnalysis[], id: string): Measurement | undefined {
  return scans[0]?.measurements.find((measurement) => measurement.id === id);
}

export function baselineMeasurement(scans: ScanAnalysis[], id: string): Measurement | undefined {
  return scans.at(-1)?.measurements.find((measurement) => measurement.id === id);
}

export function measurementDelta(scans: ScanAnalysis[], id: string) {
  const latest = latestMeasurement(scans, id);
  const baseline = baselineMeasurement(scans, id);
  if (!latest || !baseline) return undefined;
  return Math.round((latest.value - baseline.value) * 10) / 10;
}

export function measurementTrend(scans: ScanAnalysis[], target: MeasurementTarget): MeasurementTrend {
  const chronological = [...scans].reverse();
  const points = chronological.flatMap((scan) => {
    const measurement = scan.measurements.find((item) => item.id === target.id);
    return measurement
      ? [{
          date: scan.createdAt,
          value: measurement.value,
          quality: measurement.quality,
          unit: measurement.unit,
        }]
      : [];
  });
  const baseline = points[0]?.value;
  const latest = points.at(-1)?.value;
  const delta = baseline === undefined || latest === undefined ? undefined : round(latest - baseline);
  const lowQuality = points.some((point) => point.quality !== "High");
  const unit = points.at(-1)?.unit;

  if (points.length < 3) {
    return {
      id: target.id,
      label: target.label,
      points,
      baseline,
      latest,
      delta,
      unit,
      status: lowQuality ? "mixed-quality" : "not-enough-data",
      summary: lowQuality
        ? "Capture quality varies. Improve scan repeatability before judging this trend."
        : "Need at least three comparable scans before calling this a trend.",
    };
  }

  if (lowQuality) {
    return {
      id: target.id,
      label: target.label,
      points,
      baseline,
      latest,
      delta,
      unit,
      status: "mixed-quality",
      summary: "Trend is limited by mixed landmark quality. Retake low-quality scans before making conclusions.",
    };
  }

  const absoluteDelta = Math.abs(delta ?? 0);
  if (absoluteDelta < 1) {
    return {
      id: target.id,
      label: target.label,
      points,
      baseline,
      latest,
      delta,
      unit,
      status: "stable",
      summary: "Change is small enough that it may be measurement noise. Keep scanning consistently.",
    };
  }

  const desiredDecrease = target.direction === "decrease";
  const improving = desiredDecrease ? (delta ?? 0) < 0 : absoluteDelta < 2;
  return {
    id: target.id,
    label: target.label,
    points,
    baseline,
    latest,
    delta,
    unit,
    status: improving ? "improving" : "worsening",
    summary: improving
      ? "This target is moving in the intended direction across comparable scans."
      : "This target is not moving in the intended direction yet. Check routine consistency and scan setup.",
  };
}

export function measurementTrends(scans: ScanAnalysis[]) {
  return measurementTargets.map((target) => measurementTrend(scans, target));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
