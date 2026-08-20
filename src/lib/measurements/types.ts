import type { Landmark, PoseResult } from "@/lib/pose/types";

export type MeasurementQuality = "High" | "Medium" | "Low" | "Unavailable";

export type Measurement = {
  id: string;
  label: string;
  value: number;
  unit: "deg" | "%";
  signedValue?: number;
  quality: MeasurementQuality;
  explanation: string;
  limitations: string;
  view: "front" | "leftSide" | "rightSide" | "back";
  category?: "head" | "trunk" | "upper" | "pelvis" | "lower" | "fullBody";
  landmarks: string[];
};

export type ScanAnalysis = {
  id: string;
  createdAt: string;
  front: PoseResult;
  leftSide: PoseResult;
  rightSide: PoseResult;
  back: PoseResult;
  frontImage?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  backImage?: string;
  measurements: Measurement[];
  quality: ScanQualityReport;
};

export type LandmarkInput = Landmark[];

export type ScanQualityReport = {
  overall: MeasurementQuality;
  views: Record<"front" | "leftSide" | "rightSide" | "back", ViewQualityReport>;
  trendReady: boolean;
  notes: string[];
};

export type ViewQualityReport = {
  view: "front" | "leftSide" | "rightSide" | "back";
  quality: MeasurementQuality;
  requiredVisible: boolean;
  fullBodyVisible: boolean;
  cropWarnings: string[];
  lowConfidenceLandmarks: string[];
  notes: string[];
};
