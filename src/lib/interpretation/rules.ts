import type { Measurement, ScanAnalysis } from "@/lib/measurements/types";

export type Finding = {
  id: string;
  title: string;
  priority: "watch" | "focus" | "baseline";
  measurementIds: string[];
  summary: string;
  whatItCanMean: string;
  whatItCannotMean: string;
  target: string;
};

export type RoutineItem = {
  name: string;
  dosage: string;
  reason: string;
  setup: string;
  steps: string[];
  cues: string[];
  levels: ExerciseLevel[];
  progression: string;
  stopIf: string;
  targetMeasurements: string[];
};

export type ExerciseLevel = {
  level: "Level 1" | "Level 2" | "Level 3";
  name: string;
  prescription: string;
  whenToUse: string;
};

export type ProgressMilestone = {
  week: string;
  expected: string;
  measurements: string[];
};

export type ProtocolPhase = {
  name: string;
  timing: string;
  actions: string[];
  successCriteria: string[];
};

export type DecisionRule = {
  trigger: string;
  action: string;
  rationale: string;
};

export type EvidenceNote = {
  label: string;
  url: string;
  type: "guideline" | "position-stand" | "review";
  strength: "higher" | "moderate" | "limited";
  note: string;
  claimBoundary: string;
};

export function interpretScan(scan: ScanAnalysis): Finding[] {
  const measurements = scan.measurements;
  const leftHead = byId(measurements, "leftSide_ear_over_shoulder_offset");
  const rightHead = byId(measurements, "rightSide_ear_over_shoulder_offset");
  const leftShoulderHip = byId(measurements, "leftSide_shoulder_over_hip_offset");
  const rightShoulderHip = byId(measurements, "rightSide_shoulder_over_hip_offset");
  const backHeadTilt = byId(measurements, "back_head_tilt");

  const findings: Finding[] = [];
  const sideHeadAverage = averageValues([leftHead, rightHead]);
  const sideShoulderHipAverage = averageValues([leftShoulderHip, rightShoulderHip]);

  findings.push({
    id: "kyphosis_proxy",
    title: "Rounded upper-back / kyphosis-related proxy",
    priority: sideHeadAverage >= 12 || sideShoulderHipAverage >= 5 ? "focus" : "watch",
    measurementIds: ["leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset", "leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
    summary: `Your side-photo head alignment average is ${round(sideHeadAverage)}% and shoulder-over-hip average is ${round(sideShoulderHipAverage)}%. These are posture-photo proxies for forward head and trunk position.`,
    whatItCanMean: "When repeatable, larger side offsets can suggest a forward-head or rounded-upper-back posture pattern worth training and tracking.",
    whatItCannotMean: "This cannot diagnose kyphosis or measure thoracic spine curvature. Clinical kyphosis measurement requires an exam and usually dedicated tools or imaging.",
    target: "Track a gradual reduction in side head alignment and shoulder-over-hip offset across repeated scans using the same setup.",
  });

  if (backHeadTilt && backHeadTilt.value >= 4) {
    findings.push({
      id: "head_tilt_watch",
      title: "Head tilt asymmetry signal",
      priority: "watch",
      measurementIds: ["front_head_tilt", "back_head_tilt"],
      summary: `Back-view head tilt measured ${backHeadTilt.value}${backHeadTilt.unit}.`,
      whatItCanMean: "This can reflect how the head landmark line appears in a single camera view.",
      whatItCannotMean: "It does not diagnose neck alignment, scoliosis, or spinal rotation.",
      target: "Recheck this number across several scans before treating it as a trend.",
    });
  }

  return findings;
}

export const routine: RoutineItem[] = [
  {
    name: "Thoracic extension mobility",
    dosage: "2 sets of 6-8 slow reps, 4-6 days/week",
    reason: "Targets thoracic extension capacity, which is commonly included in hyperkyphosis exercise programs.",
    setup: "Use a foam roller, firm towel roll, or chair back at mid-back height. Support the head with hands if needed.",
    steps: [
      "Place the roller or towel across the upper back, just below the shoulder blades, not under the low back.",
      "Support the head with your hands, exhale, and gently extend the upper back over the support.",
      "Return to neutral, then move the support one small segment after 3-4 reps.",
    ],
    cues: ["Ribs stay down", "Neck stays supported", "Upper back moves while low back stays quiet"],
    levels: [
      { level: "Level 1", name: "Towel roll extension", prescription: "1-2 sets of 5 slow breaths at 2-3 upper-back spots", whenToUse: "Start here if the foam roller feels too intense or you are stiff." },
      { level: "Level 2", name: "Foam roller extension", prescription: "2 sets of 6-8 slow reps", whenToUse: "Use when Level 1 feels comfortable and symptoms stay quiet." },
      { level: "Level 3", name: "Extension with reach", prescription: "2 sets of 6 reps with arms reaching overhead only as tolerated", whenToUse: "Use when Level 2 is easy and shoulder motion does not provoke symptoms." },
    ],
    progression: "Add one rep per set first. Then use a slightly firmer support or longer pause, without forcing end range.",
    stopIf: "Stop for sharp pain, dizziness, rib pain, numbness, or symptoms traveling into the arms.",
    targetMeasurements: ["leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset", "leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
  },
  {
    name: "Band row or cable row",
    dosage: "2-3 sets of 8-12 reps, 2-3 days/week",
    reason: "Builds upper-back pulling strength and supports a more repeatable shoulder/trunk position.",
    setup: "Anchor a band at lower-chest height or use a cable row. Stand or sit tall with the ribs stacked over the pelvis.",
    steps: [
      "Start with arms long, shoulders relaxed, and the band or cable pulling straight toward the anchor.",
      "Pull elbows toward your side ribs while the shoulder blades slide back and slightly down.",
      "Pause for one second, then return slowly until the arms are long again.",
    ],
    cues: ["No shrugging", "Elbows to ribs", "Neck and jaw stay relaxed"],
    levels: [
      { level: "Level 1", name: "Light band row", prescription: "2 sets of 8 controlled reps", whenToUse: "Start here if neck or shoulder tension shows up quickly." },
      { level: "Level 2", name: "Band or cable row", prescription: "2-3 sets of 8-12 reps", whenToUse: "Use when you can keep the neck relaxed through every rep." },
      { level: "Level 3", name: "Paused row", prescription: "3 sets of 10-12 reps with a 2-second squeeze", whenToUse: "Use when Level 2 is controlled for two sessions." },
    ],
    progression: "When 3 sets of 12 feel controlled for two sessions, increase band tension or load slightly.",
    stopIf: "Stop for shoulder pinching, neck symptoms, or inability to control the return phase.",
    targetMeasurements: ["leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset", "front_shoulder_tilt", "back_shoulder_tilt"],
  },
  {
    name: "Prone Y/T/W raises",
    dosage: "2 sets of 6-10 controlled reps each, 2-3 days/week",
    reason: "Trains scapular control and posterior shoulder endurance without needing heavy loading.",
    setup: "Lie face down on the floor or an incline bench. Keep the forehead supported on a towel if that keeps the neck relaxed.",
    steps: [
      "Lie face down with the forehead supported and thumbs pointing up.",
      "Lift the hands only 1-2 inches in W, then T, then Y, without lifting the head.",
      "Pause briefly, lower slowly, and reduce range if the neck starts taking over.",
    ],
    cues: ["Small range is fine", "Shoulder blades slide instead of pinch", "No low-back arching"],
    levels: [
      { level: "Level 1", name: "Prone W only", prescription: "2 sets of 6-8 small reps", whenToUse: "Start here if Y or T positions cause neck gripping." },
      { level: "Level 2", name: "Prone Y/T/W", prescription: "2 sets of 6-10 reps in each shape", whenToUse: "Use when W reps are clean and shoulders feel comfortable." },
      { level: "Level 3", name: "Incline Y/T/W", prescription: "2-3 sets of 8-10 reps, optional very light load", whenToUse: "Use when floor work is easy without low-back arching." },
    ],
    progression: "Increase reps before load. Add very light weights only if neck and shoulder control stay clean.",
    stopIf: "Stop for shoulder pain, tingling, or neck gripping that does not settle when range is reduced.",
    targetMeasurements: ["front_shoulder_tilt", "back_shoulder_tilt", "leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
  },
  {
    name: "Chin tuck / deep neck flexor hold",
    dosage: "5 holds of 5-10 seconds, 4-6 days/week",
    reason: "Commonly used for forward-head posture control; progress should be judged by repeat scans and symptoms, not by one session.",
    setup: "Lie on your back or stand against a wall. Keep jaw relaxed and eyes level.",
    steps: [
      "Set up with eyes level and the jaw relaxed.",
      "Slide the back of the head straight backward as if making a double chin, without looking down.",
      "Hold gently while breathing, then release fully before the next rep.",
    ],
    cues: ["Gentle effort", "Long back of neck", "No jaw clenching"],
    levels: [
      { level: "Level 1", name: "Supine chin nod", prescription: "5 holds of 5 seconds", whenToUse: "Start here if standing versions create jaw, neck, or headache symptoms." },
      { level: "Level 2", name: "Wall chin tuck", prescription: "5 holds of 5-10 seconds", whenToUse: "Use when supine holds are symptom-free and controlled." },
      { level: "Level 3", name: "Band-assisted resisted tuck", prescription: "2 sets of 5 gentle 5-second holds", whenToUse: "Use only when Level 2 is easy and no symptoms increase." },
    ],
    progression: "Build holds from 5 to 10 seconds. Then add more total holds rather than pushing harder.",
    stopIf: "Stop for headache, dizziness, jaw pain, nerve symptoms, or neck pain that increases during holds.",
    targetMeasurements: ["leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset", "front_head_lateral_offset"],
  },
  {
    name: "Pec doorway stretch",
    dosage: "2-3 holds of 30-45 seconds, 4-6 days/week",
    reason: "Addresses anterior chest stiffness that can contribute to rounded-shoulder posture.",
    setup: "Place forearm on a doorway with elbow near shoulder height. Step through gently until a chest stretch appears.",
    steps: [
      "Place the forearm on a doorway with the elbow at or slightly below shoulder height.",
      "Step through or turn away until you feel a chest stretch, not a shoulder pinch.",
      "Keep ribs down, breathe, and hold without bouncing.",
    ],
    cues: ["No shoulder pinch", "Easy breathing", "Stretch the chest, not the front of the shoulder joint"],
    levels: [
      { level: "Level 1", name: "Low doorway stretch", prescription: "2 holds of 20-30 seconds", whenToUse: "Start here if shoulder-height stretching pinches." },
      { level: "Level 2", name: "Doorway stretch", prescription: "2-3 holds of 30-45 seconds", whenToUse: "Use when the stretch stays in the chest and breathing is easy." },
      { level: "Level 3", name: "Two-angle doorway stretch", prescription: "2 holds each at low and shoulder-height angles", whenToUse: "Use when Level 2 is comfortable and does not cause numbness." },
    ],
    progression: "Increase hold time to 45 seconds before adding intensity.",
    stopIf: "Stop for shoulder pinching, hand numbness, or symptoms down the arm.",
    targetMeasurements: ["leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
  },
  {
    name: "Hip hinge + split squat pattern",
    dosage: "2-3 sets of 6-10 reps, 2 days/week",
    reason: "Keeps the plan honest by training trunk control and lower-body strength, not only neck/upper back.",
    setup: "Use bodyweight first. Keep a chair, wall, or counter nearby for balance.",
    steps: [
      "Stand with feet hip-width apart, soft knees, and ribs stacked over the pelvis.",
      "Push the hips back while keeping a long spine, then stand by squeezing the glutes.",
      "For split squats, use a short staggered stance and lower under control without rushing.",
    ],
    cues: ["Tripod foot", "Knee tracks over toes", "Ribs stay over pelvis"],
    levels: [
      { level: "Level 1", name: "Chair-supported hinge", prescription: "2 sets of 6-8 slow reps", whenToUse: "Start here if balance or back tension is a limiter." },
      { level: "Level 2", name: "Hinge + split squat", prescription: "2-3 sets of 6-10 reps", whenToUse: "Use when trunk control stays steady with bodyweight." },
      { level: "Level 3", name: "Loaded hinge + split squat", prescription: "3 sets of 8-10 reps with light external load", whenToUse: "Use when Level 2 is controlled for two sessions with no symptom flare." },
    ],
    progression: "Add reps first, then range of motion, then external load if control remains consistent.",
    stopIf: "Stop for knee pain that sharpens, loss of balance, back pain, or symptoms that alter your gait.",
    targetMeasurements: ["front_trunk_lean", "back_trunk_lean", "leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
  },
];

export const progressMilestones: ProgressMilestone[] = [
  {
    week: "Week 0",
    expected: "Baseline only. Do not judge success from one scan; repeat once to estimate measurement noise.",
    measurements: ["all"],
  },
  {
    week: "Weeks 2-4",
    expected: "Better consistency and body awareness. Measurable posture changes may be small; quality and repeatability should improve first.",
    measurements: ["measurement quality", "side head alignment"],
  },
  {
    week: "Weeks 6-8",
    expected: "If the plan is working, side head alignment and shoulder-over-hip offsets may start trending down across comparable scans.",
    measurements: ["leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset", "leftSide_shoulder_over_hip_offset", "rightSide_shoulder_over_hip_offset"],
  },
  {
    week: "Weeks 10-12",
    expected: "Look for sustained trend rather than a perfect number: lower average offsets, better scan repeatability, and easier upright positioning.",
    measurements: ["repeatability SD", "side offsets", "front/back trunk lean"],
  },
];

export const protocolPhases: ProtocolPhase[] = [
  {
    name: "Baseline",
    timing: "Days 0-7",
    actions: [
      "Complete two scans using the same camera height, distance, lighting, clothing, and standing position.",
      "Do not intentionally correct posture for the scan.",
      "Use the better-quality scan as baseline only if all four views are trend ready.",
    ],
    successCriteria: [
      "All four views show required landmarks.",
      "Head, shoulders, and hips are inside frame.",
      "Primary target measurements are High or Medium quality.",
    ],
  },
  {
    name: "Training block",
    timing: "Weeks 1-4",
    actions: [
      "Complete the routine at the prescribed frequency.",
      "Mark exercises complete in the plan checklist.",
      "Repeat a scan at the end of week 2 or week 4, not daily.",
    ],
    successCriteria: [
      "At least 70% routine adherence.",
      "No worsening symptoms.",
      "Scan quality is comparable to baseline.",
    ],
  },
  {
    name: "Trend check",
    timing: "Weeks 6-8",
    actions: [
      "Compare at least three comparable scans.",
      "Review head alignment and shoulder-over-hip offsets first.",
      "Treat mixed-quality scans as capture problems before training conclusions.",
    ],
    successCriteria: [
      "Side head alignment average trends down.",
      "Shoulder-over-hip offset trends down or stabilizes with better quality.",
      "Routine adherence remains consistent.",
    ],
  },
  {
    name: "Decision point",
    timing: "Weeks 10-12",
    actions: [
      "Review trend status, scan repeatability, and symptoms together.",
      "Continue, progress, or modify exercises based on trend and tolerance.",
      "Avoid changing multiple variables at once.",
    ],
    successCriteria: [
      "At least one target trend is improving or stable with better repeatability.",
      "No safety stop symptoms are present.",
      "You can reproduce the scan setup without quality warnings.",
    ],
  },
];

export const decisionRules: DecisionRule[] = [
  {
    trigger: "Fewer than three comparable scans",
    action: "Do not call progress or failure yet.",
    rationale: "One or two scans cannot separate real change from measurement noise.",
  },
  {
    trigger: "Trend worsens but scan quality is mixed",
    action: "Retake a high-quality scan before changing the routine.",
    rationale: "Low landmark confidence or cropping can move measurements more than posture does.",
  },
  {
    trigger: "Adherence is below 70% for two weeks",
    action: "Reduce volume before changing exercise selection.",
    rationale: "A simpler routine done consistently is more interpretable than a larger routine done sporadically.",
  },
  {
    trigger: "Pain, numbness, weakness, dizziness, or symptoms worsen",
    action: "Stop the provoking exercise and seek qualified clinical input.",
    rationale: "The app is a measurement and training tracker, not a diagnostic or medical treatment tool.",
  },
  {
    trigger: "Targets improve for two consecutive trend checks",
    action: "Progress load, reps, or hold time modestly while keeping scan setup unchanged.",
    rationale: "Changing only one variable at a time keeps the self-experiment interpretable.",
  },
];

export const evidenceNotes: EvidenceNote[] = [
  {
    label: "ACSM physical activity guidance",
    url: "https://acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines/",
    type: "guideline",
    strength: "higher",
    note: "Adults should perform muscle-strengthening activity at least two days per week, alongside regular aerobic activity.",
    claimBoundary: "Supports including strength work in the plan; does not prove posture-photo measurements will change.",
  },
  {
    label: "ACSM resistance training position stand",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/",
    type: "position-stand",
    strength: "higher",
    note: "Resistance training benefits are driven strongly by consistent participation and progressive work across major muscle groups.",
    claimBoundary: "Supports progressive strengthening and adherence tracking; not specific to kyphosis diagnosis.",
  },
  {
    label: "Exercise for age-related hyperkyphotic posture review",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3997126/",
    type: "review",
    strength: "limited",
    note: "Exercise studies for hyperkyphotic posture suggest possible benefit, but evidence quality and exact dosing vary.",
    claimBoundary: "Supports cautious thoracic mobility/strength emphasis; does not justify diagnosing kyphosis from a phone photo.",
  },
];

function byId(measurements: Measurement[], id: string) {
  return measurements.find((measurement) => measurement.id === id);
}

function averageValues(measurements: Array<Measurement | undefined>) {
  const values = measurements.filter((measurement): measurement is Measurement => Boolean(measurement)).map((measurement) => measurement.value);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
