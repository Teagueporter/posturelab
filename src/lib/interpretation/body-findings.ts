import type { Measurement, ScanAnalysis } from "@/lib/measurements/types";

export type BodyFindingSeverity = "low" | "moderate" | "high";

export type BodyFinding = {
  id: "forward_head" | "rounded_upper_back" | "shoulder_symmetry" | "trunk_stack";
  title: string;
  severity: BodyFindingSeverity;
  score: number;
  metricSummary: string;
  readout: string;
  fixability: string;
  goal: string;
  exercises: string[];
  measurementIds: string[];
};

export type EvidenceTakeaway = {
  title: string;
  summary: string;
  url: string;
};

export const evidenceTakeaways: EvidenceTakeaway[] = [
  {
    title: "Forward-head posture responds to exercise",
    summary: "Systematic reviews report meaningful improvements in craniovertebral angle with therapeutic exercise, especially neck stabilization/deep-neck-flexor work.",
    url: "https://pubmed.ncbi.nlm.nih.gov/30107937/",
  },
  {
    title: "Upper-back curve can change with targeted training",
    summary: "A randomized controlled trial found that 6 months of spine-strengthening exercise and posture training reduced radiographic and clinical kyphosis measures in older adults with hyperkyphosis.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28689306/",
  },
  {
    title: "Rounded shoulders usually need strength plus mobility",
    summary: "Exercise studies commonly pair scapular/upper-back strengthening with pectoral stretching for rounded-shoulder and forward-head posture patterns.",
    url: "https://pubmed.ncbi.nlm.nih.gov/29184298/",
  },
];

export function buildBodyFindings(scan: ScanAnalysis): BodyFinding[] {
  const headOffset = averageAbs(scan.measurements, ["leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset"]);
  const neckLean = averageAbs(scan.measurements, ["leftSide_neck_lean", "rightSide_neck_lean"]);
  const shoulderHip = averageAbs(scan.measurements, ["leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"]);
  const cva = averageRaw(scan.measurements, ["leftSide_craniovertebral_angle_proxy", "rightSide_craniovertebral_angle_proxy"]);
  const shoulderTilt = averageAbs(scan.measurements, ["front_shoulder_tilt", "back_shoulder_tilt"]);
  const shoulderHipTilt = averageAbs(scan.measurements, ["front_shoulder_hip_tilt_difference", "back_shoulder_hip_tilt_difference"]);
  const trunkLean = averageAbs(scan.measurements, ["front_trunk_lean", "back_trunk_lean", "leftSide_trunk_lean", "rightSide_trunk_lean"]);

  const forwardHeadScore = Math.max(
    scoreFrom(headOffset.value, 6, 16),
    scoreFrom(neckLean.value, 8, 18),
    cva.value > 0 ? inverseScore(cva.value, 65, 55) : 0,
  );
  const roundedUpperBackScore = Math.max(
    scoreFrom(shoulderHip.value, 3, 9),
    forwardHeadScore >= 70 ? 45 : 0,
  );
  const shoulderSymmetryScore = Math.max(
    scoreFrom(shoulderTilt.value, 2, 8),
    scoreFrom(shoulderHipTilt.value, 2, 8),
  );
  const trunkStackScore = scoreFrom(trunkLean.value, 4, 12);

  return [
    {
      id: "forward_head",
      title: "Forward head / neck posture",
      severity: severityFromScore(forwardHeadScore),
      score: forwardHeadScore,
      metricSummary: `${format(headOffset)} average head offset, ${format(neckLean)} average neck lean`,
      readout: "Your side views are measuring how far the ear sits from the shoulder line and how steep the neck segment looks. This is the clearest neck-posture signal.",
      fixability: "Good if the driver is posture habit, stiffness, or motor control. Expect weeks of consistent work, not an instant visual change.",
      goal: "Reduce side-view head offset and neck lean while keeping the eyes level and shoulders relaxed.",
      exercises: ["Chin tuck / deep neck flexor hold", "Thoracic extension mobility", "Band row or cable row"],
      measurementIds: [
        "leftSide_ear_over_shoulder_offset",
        "rightSide_ear_over_shoulder_offset",
        "leftSide_neck_lean",
        "rightSide_neck_lean",
        "leftSide_craniovertebral_angle_proxy",
        "rightSide_craniovertebral_angle_proxy",
      ],
    },
    {
      id: "rounded_upper_back",
      title: "Rounded shoulders / upper-back curve proxy",
      severity: severityFromScore(roundedUpperBackScore),
      score: roundedUpperBackScore,
      metricSummary: `${format(shoulderHip)} average shoulder-over-hip offset, ${format(cva)} average CVA proxy`,
      readout: "This is the app's closest read on rounded shoulders and kyphosis-like posture: shoulder position relative to hips plus the side-view head/neck angle.",
      fixability: "Moderate to good for posture-related rounding. Structural kyphosis can still improve in strength, comfort, and positioning, but may not fully normalize.",
      goal: "Stack shoulders closer over hips and build upper-back extension strength without forcing the rib cage up.",
      exercises: ["Thoracic extension mobility", "Band row or cable row", "Prone Y/T/W raises", "Pec doorway stretch"],
      measurementIds: [
        "leftSide_shoulder_over_hip_offset",
        "rightSide_shoulder_over_hip_offset",
        "leftSide_craniovertebral_angle_proxy",
        "rightSide_craniovertebral_angle_proxy",
      ],
    },
    {
      id: "shoulder_symmetry",
      title: "Shoulder height and torso symmetry",
      severity: severityFromScore(shoulderSymmetryScore),
      score: shoulderSymmetryScore,
      metricSummary: `${format(shoulderTilt)} average shoulder tilt, ${format(shoulderHipTilt)} shoulder-hip tilt gap`,
      readout: "Front/back photos estimate whether your shoulder line is level and whether the shoulder and hip lines match.",
      fixability: "Variable. It is often trainable when it reflects stance, muscle tone, or control; less predictable when it is structural.",
      goal: "Keep shoulder and hip lines more parallel across repeat scans.",
      exercises: ["Band row or cable row", "Prone Y/T/W raises", "Hip hinge + split squat pattern"],
      measurementIds: ["front_shoulder_tilt", "back_shoulder_tilt", "front_shoulder_hip_tilt_difference", "back_shoulder_hip_tilt_difference"],
    },
    {
      id: "trunk_stack",
      title: "Trunk stacking",
      severity: severityFromScore(trunkStackScore),
      score: trunkStackScore,
      metricSummary: `${format(trunkLean)} average trunk lean`,
      readout: "This checks whether the shoulder midpoint stacks vertically over the hip midpoint across the four camera views.",
      fixability: "Good when it comes from posture habit, balance, or strength endurance.",
      goal: "Make upright standing easier to reproduce without bracing or forcing posture.",
      exercises: ["Thoracic extension mobility", "Hip hinge + split squat pattern", "Band row or cable row"],
      measurementIds: ["front_trunk_lean", "back_trunk_lean", "leftSide_trunk_lean", "rightSide_trunk_lean"],
    },
  ];
}

export function severityLabel(severity: BodyFindingSeverity) {
  if (severity === "high") return "High priority";
  if (severity === "moderate") return "Moderate priority";
  return "Low priority";
}

function averageAbs(measurements: Measurement[], ids: string[]) {
  return average(
    ids
      .map((id) => measurements.find((measurement) => measurement.id === id))
      .filter((measurement): measurement is Measurement => Boolean(measurement))
      .map((measurement) => ({ value: Math.abs(measurement.signedValue ?? measurement.value), unit: measurement.unit })),
  );
}

function averageRaw(measurements: Measurement[], ids: string[]) {
  return average(
    ids
      .map((id) => measurements.find((measurement) => measurement.id === id))
      .filter((measurement): measurement is Measurement => Boolean(measurement))
      .map((measurement) => ({ value: measurement.value, unit: measurement.unit })),
  );
}

function average(values: Array<{ value: number; unit: Measurement["unit"] }>) {
  if (!values.length) return { value: 0, unit: "deg" as const };
  return {
    value: round(values.reduce((sum, item) => sum + item.value, 0) / values.length),
    unit: values[0].unit,
  };
}

function scoreFrom(value: number, moderateAt: number, highAt: number) {
  if (value <= moderateAt) return 10;
  if (value >= highAt) return 90;
  return Math.round(10 + ((value - moderateAt) / (highAt - moderateAt)) * 80);
}

function inverseScore(value: number, moderateAt: number, highAt: number) {
  if (value >= moderateAt) return 10;
  if (value <= highAt) return 90;
  return Math.round(10 + ((moderateAt - value) / (moderateAt - highAt)) * 80);
}

function severityFromScore(score: number): BodyFindingSeverity {
  if (score >= 70) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

function format(item: { value: number; unit: Measurement["unit"] }) {
  return `${item.value}${item.unit}`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
