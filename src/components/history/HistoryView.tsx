"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, Dumbbell } from "lucide-react";
import { measurementTrends } from "@/lib/interpretation/progress";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { listScans } from "@/lib/storage/scans";

const summaryIds = ["front_shoulder_tilt", "leftSide_ear_over_shoulder_offset", "rightSide_ear_over_shoulder_offset", "front_trunk_lean"];

export function HistoryView() {
  const [scans, setScans] = useState<ScanAnalysis[]>([]);
  const improvingCount = measurementTrends(scans).filter((trend) => trend.status === "improving").length;
  const readyTrendCount = measurementTrends(scans).filter((trend) => trend.status !== "not-enough-data").length;

  useEffect(() => {
    queueMicrotask(() => setScans(listScans()));
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold">History</h1>
        <div className="flex gap-2">
          <Link href="/plan" className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold"><Dumbbell className="h-4 w-4" />Plan</Link>
          <Link href="/scan" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white"><Camera className="h-4 w-4" />Scan</Link>
        </div>
      </div>
      <Link href="/plan" className="mt-6 block rounded-md border border-[#d8ded7] bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Progress trends</h2>
            <p className="mt-1 text-sm text-[#516156]">
              {scans.length < 3
                ? `${Math.max(0, 3 - scans.length)} more comparable scan${3 - scans.length === 1 ? "" : "s"} needed before trend labels are meaningful.`
                : `${improvingCount} of ${readyTrendCount} tracked targets are currently improving.`}
            </p>
          </div>
          <span className="text-sm font-semibold text-[#237a57]">Open plan</span>
        </div>
      </Link>
      <div className="mt-6 space-y-3">
        {scans.length === 0 && <p className="rounded-md border border-[#d8ded7] bg-white p-4 text-[#516156]">No saved scans yet.</p>}
        {scans.map((scan) => (
          <Link key={scan.id} href={`/results/${scan.id}`} className="block rounded-md border border-[#d8ded7] bg-white p-4">
            <h2 className="font-semibold">{new Date(scan.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</h2>
            <dl className="mt-3 grid gap-2">
              {summaryIds.map((id) => {
                const measurement = scan.measurements.find((m) => m.id === id);
                return measurement ? (
                  <div key={id} className="flex justify-between text-sm">
                    <dt className="text-[#516156]">{measurement.label}</dt>
                    <dd className="font-semibold">{measurement.value}{measurement.unit}</dd>
                  </div>
                ) : null;
              })}
            </dl>
          </Link>
        ))}
      </div>
    </main>
  );
}
