import type { ScanAnalysis } from "@/lib/measurements/types";

export function repeatabilityStats(scans: ScanAnalysis[]) {
  const ids = Array.from(new Set(scans.flatMap((scan) => scan.measurements.map((m) => m.id))));
  return ids.map((id) => {
    const values = scans.flatMap((scan) => scan.measurements.filter((m) => m.id === id).map((m) => m.value));
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1);
    return { id, count: values.length, mean: round(mean), sd: round(Math.sqrt(variance)), range: round(Math.max(...values) - Math.min(...values)) };
  });
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
