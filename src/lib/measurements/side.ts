import { angleFromHorizontal, angleFromVertical, distance2D, midpoint, normalizedHorizontalOffset } from "@/lib/geometry/geometry";
import { POSE } from "@/lib/pose/landmarks";
import { qualityForLandmarks } from "@/lib/pose/quality";
import type { LandmarkInput, Measurement } from "./types";

const LIMITATIONS = "Side-photo rotation matters; a 45 degree photo should be retaken rather than treated as a true side view.";

export function measureSide(landmarks: LandmarkInput, view: "leftSide" | "rightSide" = "leftSide"): Measurement[] {
  const shoulder = midpoint(landmarks[POSE.LEFT_SHOULDER], landmarks[POSE.RIGHT_SHOULDER]);
  const hip = midpoint(landmarks[POSE.LEFT_HIP], landmarks[POSE.RIGHT_HIP]);
  const ear = midpoint(landmarks[POSE.LEFT_EAR], landmarks[POSE.RIGHT_EAR]);
  const eye = midpoint(landmarks[POSE.LEFT_EYE], landmarks[POSE.RIGHT_EYE]);
  const trunkLength = distance2D(shoulder, hip);
  const earOffset = normalizedHorizontalOffset(ear, shoulder, trunkLength);
  const earHipOffset = normalizedHorizontalOffset(ear, hip, trunkLength);
  const shoulderOffset = normalizedHorizontalOffset(shoulder, hip, trunkLength);
  const trunkLean = angleFromVertical(shoulder, hip);
  const neckLean = angleFromVertical(ear, shoulder);
  const craniovertebralAngle = Math.abs(angleFromHorizontal(shoulder, ear));
  const gazeAngle = angleFromHorizontal(ear, eye);

  return [
    measurement(`${view}_ear_over_shoulder_offset`, view === "leftSide" ? "Left-side view head alignment" : "Right-side view head alignment", earOffset, "%", view, qualityForLandmarks(landmarks, [POSE.LEFT_EAR, POSE.RIGHT_EAR, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Horizontal ear-center position compared with shoulder midpoint, normalized by trunk length.", ["ear_center", "shoulder_midpoint"]),
    measurement(`${view}_ear_over_hip_offset`, view === "leftSide" ? "Left-side view head over hip" : "Right-side view head over hip", earHipOffset, "%", view, qualityForLandmarks(landmarks, [POSE.LEFT_EAR, POSE.RIGHT_EAR, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Horizontal ear-center position compared with hip midpoint, normalized by trunk length.", ["ear_center", "hip_midpoint"]),
    measurement(`${view}_neck_lean`, view === "leftSide" ? "Left-side view neck lean" : "Right-side view neck lean", neckLean, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_EAR, POSE.RIGHT_EAR, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Angle from ear midpoint to shoulder midpoint compared with vertical in the side photo.", ["ear_center", "shoulder_midpoint"]),
    measurement(`${view}_craniovertebral_angle_proxy`, view === "leftSide" ? "Left-side view CVA proxy" : "Right-side view CVA proxy", craniovertebralAngle, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_EAR, POSE.RIGHT_EAR, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Side-photo angle between the shoulder-to-ear line and a horizontal reference.", ["ear_center", "shoulder_midpoint", "horizontal_reference"]),
    measurement(`${view}_gaze_angle_proxy`, view === "leftSide" ? "Left-side view gaze angle" : "Right-side view gaze angle", gazeAngle, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_EYE, POSE.RIGHT_EYE, POSE.LEFT_EAR, POSE.RIGHT_EAR]), "Side-photo angle from ear midpoint to eye midpoint compared with horizontal.", ["ear_center", "eye_center", "horizontal_reference"]),
    measurement(`${view}_shoulder_over_hip_offset`, view === "leftSide" ? "Left-side view shoulder over hip" : "Right-side view shoulder over hip", shoulderOffset, "%", view, qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Horizontal shoulder midpoint position compared with hip midpoint.", ["shoulder_midpoint", "hip_midpoint"]),
    measurement(`${view}_trunk_lean`, view === "leftSide" ? "Left-side view trunk lean" : "Right-side view trunk lean", trunkLean, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Angle from shoulder midpoint to hip midpoint compared with vertical in the side photo.", ["shoulder_midpoint", "hip_midpoint"]),
  ];
}

function measurement(id: string, label: string, signed: number, unit: "deg" | "%", view: Measurement["view"], quality: Measurement["quality"], explanation: string, landmarks: string[]): Measurement {
  return { id, label, value: round(Math.abs(signed)), signedValue: round(signed), unit, quality, explanation, limitations: LIMITATIONS, view, category: categoryFor(id), landmarks };
}

function categoryFor(id: string): Measurement["category"] {
  if (id.includes("ear") || id.includes("neck") || id.includes("craniovertebral") || id.includes("gaze")) return "head";
  return "trunk";
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
