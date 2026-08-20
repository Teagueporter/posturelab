import type { PoseResult } from "@/lib/pose/types";
import { assessScanQuality } from "@/lib/pose/scan-quality";
import { measureFront } from "./front";
import { measureSide } from "./side";
import type { ScanAnalysis } from "./types";

export function analyzeScan(input: {
  id?: string;
  createdAt?: string;
  front: PoseResult;
  leftSide: PoseResult;
  rightSide: PoseResult;
  back: PoseResult;
  frontImage?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  backImage?: string;
}): ScanAnalysis {
  return {
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    front: input.front,
    leftSide: input.leftSide,
    rightSide: input.rightSide,
    back: input.back,
    frontImage: input.frontImage,
    leftSideImage: input.leftSideImage,
    rightSideImage: input.rightSideImage,
    backImage: input.backImage,
    measurements: [
      ...measureFront(input.front.landmarks, "front"),
      ...measureSide(input.leftSide.landmarks, "leftSide"),
      ...measureSide(input.rightSide.landmarks, "rightSide"),
      ...measureFront(input.back.landmarks, "back"),
    ],
    quality: assessScanQuality({
      front: input.front,
      leftSide: input.leftSide,
      rightSide: input.rightSide,
      back: input.back,
    }),
  };
}
