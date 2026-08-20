import { angleFromHorizontal, angleFromVertical, distance2D, midpoint, normalizedHorizontalOffset } from "@/lib/geometry/geometry";
import { POSE } from "@/lib/pose/landmarks";
import { qualityForLandmarks } from "@/lib/pose/quality";
import type { LandmarkInput, Measurement } from "./types";

const LIMITATIONS = "Lower-body landmarks need full-body framing. Shoes, stance width, floor angle, and cropped feet can reduce repeatability.";

export function measureFullBody(landmarks: LandmarkInput, view: "front" | "back"): Measurement[] {
  const leftShoulder = landmarks[POSE.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE.LEFT_HIP];
  const rightHip = landmarks[POSE.RIGHT_HIP];
  const leftKnee = landmarks[POSE.LEFT_KNEE];
  const rightKnee = landmarks[POSE.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE.RIGHT_ANKLE];
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const kneeMid = midpoint(leftKnee, rightKnee);
  const ankleMid = midpoint(leftAnkle, rightAnkle);
  const shoulderWidth = distance2D(leftShoulder, rightShoulder);
  const hipWidth = distance2D(leftHip, rightHip);
  const bodyHeightProxy = Math.max(distance2D(shoulderMid, ankleMid), 0.001);
  const stanceWidth = distance2D(leftAnkle, rightAnkle);

  return [
    measurement(`${view}_knee_line_tilt`, view === "front" ? "Front knee line tilt" : "Back knee line tilt", angleFromHorizontal(leftKnee, rightKnee), "deg", view, "lower", qualityForLandmarks(landmarks, [POSE.LEFT_KNEE, POSE.RIGHT_KNEE]), "Angle of the knee landmark line compared with a level horizontal reference.", ["left_knee", "right_knee"]),
    measurement(`${view}_ankle_line_tilt`, view === "front" ? "Front ankle line tilt" : "Back ankle line tilt", angleFromHorizontal(leftAnkle, rightAnkle), "deg", view, "lower", qualityForLandmarks(landmarks, [POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE]), "Angle of the ankle landmark line compared with a level horizontal reference.", ["left_ankle", "right_ankle"]),
    measurement(`${view}_pelvis_over_ankle_offset`, view === "front" ? "Front pelvis over feet" : "Back pelvis over feet", normalizedHorizontalOffset(hipMid, ankleMid, shoulderWidth), "%", view, "fullBody", qualityForLandmarks(landmarks, [POSE.LEFT_HIP, POSE.RIGHT_HIP, POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Horizontal pelvis midpoint offset from ankle midpoint, normalized by shoulder width.", ["hip_midpoint", "ankle_midpoint"]),
    measurement(`${view}_knee_center_offset`, view === "front" ? "Front knee center offset" : "Back knee center offset", normalizedHorizontalOffset(kneeMid, ankleMid, shoulderWidth), "%", view, "lower", qualityForLandmarks(landmarks, [POSE.LEFT_KNEE, POSE.RIGHT_KNEE, POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]), "Horizontal knee midpoint offset from ankle midpoint, normalized by shoulder width.", ["knee_midpoint", "ankle_midpoint"]),
    measurement(`${view}_stance_width`, view === "front" ? "Front stance width" : "Back stance width", (stanceWidth / Math.max(hipWidth, 0.001)) * 100, "%", view, "lower", qualityForLandmarks(landmarks, [POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE, POSE.LEFT_HIP, POSE.RIGHT_HIP]), "Ankle-to-ankle distance normalized by hip landmark width.", ["left_ankle", "right_ankle", "hip_width"]),
    measurement(`${view}_whole_body_lean`, view === "front" ? "Front whole-body lean" : "Back whole-body lean", angleFromVertical(shoulderMid, ankleMid), "deg", view, "fullBody", qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE]), "Angle from shoulder midpoint to ankle midpoint compared with vertical.", ["shoulder_midpoint", "ankle_midpoint"]),
    measurement(`${view}_shoulder_to_ankle_length_proxy`, view === "front" ? "Front body-length proxy" : "Back body-length proxy", bodyHeightProxy * 100, "%", view, "fullBody", qualityForLandmarks(landmarks, [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_ANKLE, POSE.RIGHT_ANKLE]), "Normalized image-space distance from shoulder midpoint to ankle midpoint. Track only when camera setup is consistent.", ["shoulder_midpoint", "ankle_midpoint"]),
  ];
}

function measurement(id: string, label: string, signed: number, unit: "deg" | "%", view: Measurement["view"], category: Measurement["category"], quality: Measurement["quality"], explanation: string, landmarks: string[]): Measurement {
  return {
    id,
    label,
    value: round(Math.abs(signed)),
    signedValue: round(signed),
    unit,
    quality,
    explanation,
    limitations: LIMITATIONS,
    view,
    category,
    landmarks,
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
