"use client";

import type { PoseDetector, PoseModel, PoseResult } from "@/lib/pose/types";

const MODEL_FILES: Record<PoseModel, string> = {
  lite: "pose_landmarker_lite.task",
  full: "pose_landmarker_full.task",
  heavy: "pose_landmarker_heavy.task",
};

export async function createMediaPipePoseDetector(model: PoseModel = "full"): Promise<PoseDetector> {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
  );
  const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${model}/float16/latest/${MODEL_FILES[model]}`,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
  });

  return {
    async detect(image) {
      const result = landmarker.detect(image);
      return normalizePoseResult(result);
    },
  };
}

function normalizePoseResult(result: {
  landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number; presence?: number }>>;
  worldLandmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number; presence?: number }>>;
}): PoseResult {
  return {
    landmarks: result.landmarks?.[0] ?? [],
    worldLandmarks: result.worldLandmarks?.[0],
  };
}
