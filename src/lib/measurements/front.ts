import { angleFromHorizontal, angleFromVertical, distance2D, midpoint, normalizedHorizontalOffset } from "@/lib/geometry/geometry";
import { POSE } from "@/lib/pose/landmarks";
import { qualityForLandmarks } from "@/lib/pose/quality";
import type { LandmarkInput, Measurement } from "./types";

const LIMITATIONS = "Camera angle, clothing, lighting, and landmark confidence can affect repeatability.";

export function measureFront(landmarks: LandmarkInput, view: "front" | "back" = "front"): Measurement[] {
  const leftShoulder = landmarks[POSE.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE.LEFT_HIP];
  const rightHip = landmarks[POSE.RIGHT_HIP];
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const shoulderWidth = distance2D(leftShoulder, rightShoulder);
  const headPair = landmarks[POSE.LEFT_EYE] && landmarks[POSE.RIGHT_EYE] ? [POSE.LEFT_EYE, POSE.RIGHT_EYE] : [POSE.LEFT_EAR, POSE.RIGHT_EAR];
  const headCenter = midpoint(landmarks[headPair[0]], landmarks[headPair[1]]);
  const shoulderTilt = angleFromHorizontal(leftShoulder, rightShoulder);
  const hipTilt = angleFromHorizontal(leftHip, rightHip);
  const headTilt = angleFromHorizontal(landmarks[headPair[0]], landmarks[headPair[1]]);
  const trunkLean = angleFromVertical(shoulderMid, hipMid);
  const headOffset = normalizedHorizontalOffset(headCenter, shoulderMid, shoulderWidth);
  const shoulderHipTiltDifference = Math.abs(shoulderTilt - hipTilt);

  return [
    measurement(`${view}_shoulder_tilt`, view === "back" ? "Back shoulder tilt" : "Shoulder tilt", shoulderTilt, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Angle of the shoulder line compared with a level horizontal reference.", LIMITATIONS, ["left_shoulder", "right_shoulder"]),
    measurement(`${view}_hip_tilt`, view === "back" ? "Back hip tilt" : "Hip tilt", hipTilt, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Angle of the hip landmark line compared with a level horizontal reference.", LIMITATIONS, ["left_hip", "right_hip"]),
    measurement(`${view}_head_tilt`, view === "back" ? "Back head tilt" : "Head tilt", headTilt, "deg", view, qualityForLandmarks(landmarks, headPair), "Angle of the eye or ear line compared with horizontal.", "This is a 2D photo landmark measurement and should not be interpreted as cervical alignment.", ["left_eye_or_ear", "right_eye_or_ear"]),
    measurement(`${view}_trunk_lean`, view === "back" ? "Back trunk lean" : "Trunk lean", trunkLean, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Angle from the shoulder midpoint to hip midpoint compared with vertical.", LIMITATIONS, ["shoulder_midpoint", "hip_midpoint"]),
    measurement(`${view}_head_lateral_offset`, view === "back" ? "Back head lateral offset" : "Head lateral offset", headOffset, "%", view, qualityForLandmarks(landmarks, [...headPair, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Horizontal head-center offset from shoulder midpoint, normalized by shoulder width.", LIMITATIONS, ["head_center", "shoulder_midpoint"]),
    measurement(`${view}_shoulder_hip_tilt_difference`, view === "back" ? "Back shoulder-hip tilt difference" : "Shoulder-hip tilt difference", shoulderHipTiltDifference, "deg", view, qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Absolute difference between shoulder-line tilt and hip-line tilt in the same photo.", LIMITATIONS, ["left_shoulder", "right_shoulder", "left_hip", "right_hip"]),
  ];
}

function measurement(id: string, label: string, signed: number, unit: "deg" | "%", view: Measurement["view"], quality: Measurement["quality"], explanation: string, limitations: string, landmarks: string[]): Measurement {
  return { id, label, value: round(Math.abs(signed)), signedValue: round(signed), unit, quality, explanation, limitations, view, category: categoryFor(id), landmarks };
}

function categoryFor(id: string): Measurement["category"] {
  if (id.includes("head")) return "head";
  if (id.includes("hip")) return "pelvis";
  if (id.includes("trunk")) return "trunk";
  if (id.includes("shoulder")) return "upper";
  return "fullBody";
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
