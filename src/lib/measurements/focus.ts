import type { Measurement } from "@/lib/measurements/types";

export type FocusLevel = "low" | "moderate" | "high";

export type MeasurementFocus = {
  level: FocusLevel;
  score: number;
  label: string;
};

export function focusForMeasurement(measurement: Measurement): MeasurementFocus {
  const value = Math.abs(measurement.signedValue ?? measurement.value);
  const score = deviationScore(measurement, value);
  const level = levelFromScore(score);

  return {
    level,
    score,
    label: level === "high" ? "High deviation" : level === "moderate" ? "Moderate deviation" : "Near reference",
  };
}

function deviationScore(measurement: Measurement, value: number) {
  if (measurement.id.includes("craniovertebral_angle_proxy")) {
    return measurement.value >= 65 ? 10 : measurement.value >= 55 ? 45 : 80;
  }
  if (measurement.id.includes("gaze_angle_proxy")) {
    return scoreFrom(value, 5, 18);
  }
  if (measurement.id.includes("ear_over_shoulder_offset") || measurement.id.includes("ear_over_hip_offset")) {
    return scoreFrom(value, 6, 18);
  }
  if (measurement.id.includes("shoulder_over_hip_offset")) {
    return scoreFrom(value, 3, 9);
  }
  if (measurement.id.includes("head_lateral_offset")) {
    return scoreFrom(value, 5, 16);
  }
  if (measurement.id.includes("neck_lean") || measurement.id.includes("trunk_lean")) {
    return scoreFrom(value, 4, 14);
  }
  if (measurement.id.includes("shoulder_hip_tilt_difference")) {
    return scoreFrom(value, 2, 8);
  }
  if (measurement.id.includes("shoulder_tilt") || measurement.id.includes("hip_tilt") || measurement.id.includes("head_tilt")) {
    return scoreFrom(value, 2, 9);
  }
  return scoreFrom(value, 4, 14);
}

function scoreFrom(value: number, moderateAt: number, highAt: number) {
  if (value <= moderateAt) return 10;
  if (value >= highAt) return 90;
  return Math.round(10 + ((value - moderateAt) / (highAt - moderateAt)) * 80);
}

function levelFromScore(score: number): FocusLevel {
  if (score >= 70) return "high";
  if (score >= 35) return "moderate";
  return "low";
}
