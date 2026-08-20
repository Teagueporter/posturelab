export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

export type PoseResult = {
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
};

export type PoseModel = "lite" | "full" | "heavy";

export interface PoseDetector {
  detect(image: ImageBitmap | HTMLImageElement | HTMLCanvasElement): Promise<PoseResult>;
}
