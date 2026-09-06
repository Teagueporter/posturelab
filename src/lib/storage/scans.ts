"use client";

import { analyzeScan } from "@/lib/measurements/analyze";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { deleteScanFromCloud, hydrateLocalScansFromCloud, syncScanToCloud } from "@/lib/storage/cloud";

const KEY = "posturelab.scans.v1";

export function listScans(): ScanAnalysis[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as ScanAnalysis[]).map(normalizeScan);
  } catch {
    return [];
  }
}

export function saveScan(scan: ScanAnalysis) {
  const scans = [scan, ...listScans().filter((item) => item.id !== scan.id)];
  window.localStorage.setItem(KEY, JSON.stringify(scans));
  void syncScanToCloud(scan);
}

export function getScan(scanId: string) {
  return listScans().find((scan) => scan.id === scanId);
}

export function deleteScan(scanId: string) {
  if (typeof window === "undefined") return [];
  const scans = listScans().filter((scan) => scan.id !== scanId);
  window.localStorage.setItem(KEY, JSON.stringify(scans));
  void deleteScanFromCloud(scanId);
  return scans;
}

export async function hydrateScansFromCloud() {
  if (typeof window === "undefined") return [];
  const scans = await hydrateLocalScansFromCloud(listScans());
  window.localStorage.setItem(KEY, JSON.stringify(scans));
  return scans;
}

function normalizeScan(scan: ScanAnalysis): ScanAnalysis {
  const hasUpperBodyAnalysis = scan.measurements.some((measurement) => measurement.id === "rightSide_craniovertebral_angle_proxy");
  const hasCurrentFullBody = scan.measurements.some((measurement) => measurement.id === "front_whole_body_lean");
  const hasCurrentSideLabels = scan.measurements.some((measurement) => measurement.id === "leftSide_neck_lean" && measurement.label === "Left-side view neck lean");
  if (hasUpperBodyAnalysis && scan.quality && !hasCurrentFullBody && hasCurrentSideLabels) return scan;
  if (!scan.front || !scan.leftSide || !scan.rightSide || !scan.back) return scan;
  return analyzeScan({
    id: scan.id,
    createdAt: scan.createdAt,
    front: scan.front,
    leftSide: scan.leftSide,
    rightSide: scan.rightSide,
    back: scan.back,
    frontImage: scan.frontImage,
    leftSideImage: scan.leftSideImage,
    rightSideImage: scan.rightSideImage,
    backImage: scan.backImage,
  });
}
