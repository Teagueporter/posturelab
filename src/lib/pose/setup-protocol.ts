export type ScanSetupItem = {
  title: string;
  detail: string;
  prevents: string[];
};

export const scanSetupProtocol: ScanSetupItem[] = [
  {
    title: "Camera height",
    detail: "Place the camera around chest to mid-torso height and keep it level. Do not angle it up or down.",
    prevents: ["distorted trunk lean", "inconsistent shoulder-over-hip offset"],
  },
  {
    title: "Camera distance",
    detail: "Frame from the top of the head to just below the hips, with a small margin above the head and around both shoulders.",
    prevents: ["cropped head", "cropped hips", "inconsistent shoulder-over-hip offset"],
  },
  {
    title: "Lighting and clothing",
    detail: "Use even lighting and clothing that lets the app distinguish ears, shoulders, and hips.",
    prevents: ["low landmark confidence", "missing upper-body landmarks"],
  },
  {
    title: "Standing position",
    detail: "Stand in the same spot for every scan, with arms relaxed and not covering the sides of your torso.",
    prevents: ["distance drift", "covered hip landmarks"],
  },
  {
    title: "Natural posture",
    detail: "Stand normally. Do not intentionally pull shoulders back, tuck the chin, or fix posture for the scan.",
    prevents: ["biased baseline", "false improvement"],
  },
  {
    title: "Side-view alignment",
    detail: "For left and right side photos, turn fully sideways instead of standing at a 45 degree angle.",
    prevents: ["side-photo rotation error", "unreliable head alignment"],
  },
  {
    title: "Repeatable environment",
    detail: "Use the same camera, room, distance, lighting, and clothing style for trend scans.",
    prevents: ["measurement noise", "uninterpretable trend changes"],
  },
];
