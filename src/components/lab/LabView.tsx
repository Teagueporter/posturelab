"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileText, FlaskConical } from "lucide-react";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { hydrateScansFromCloud, listScans } from "@/lib/storage/scans";
import { repeatabilityStats } from "@/lib/validation/repeatability";

export function LabView() {
  const [scans, setScans] = useState<ScanAnalysis[]>([]);
  const stats = useMemo(() => repeatabilityStats(scans), [scans]);

  useEffect(() => {
    queueMicrotask(() => {
      setScans(listScans());
      void hydrateScansFromCloud().then(setScans);
    });
  }, []);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ scans, repeatability: stats }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `posturelab-export-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]"><FlaskConical className="h-4 w-4" />Research mode</p>
          <h1 className="mt-2 text-4xl font-semibold">Repeatability lab</h1>
        </div>
        <div className="flex gap-2">
          <a href="/report" className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold"><FileText className="h-4 w-4" />Report</a>
          <button onClick={exportJson} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white"><Download className="h-4 w-4" />Export JSON</button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-[#d8ded7] bg-white p-4">
          <h2 className="font-semibold">Repeated scans</h2>
          <p className="mt-2 text-sm text-[#516156]">Run several scans using the same setup, then compare standard deviation and range for each measurement.</p>
          <Link href="/scan" className="mt-4 inline-flex h-10 items-center rounded-md border border-[#cfd8d1] px-3 text-sm font-semibold">Perform scan</Link>
        </section>
        <section className="rounded-md border border-[#d8ded7] bg-white p-4">
          <h2 className="font-semibold">Orientation validation</h2>
          <p className="mt-2 text-sm text-[#516156]">Retake visibly rotated side photos before comparing measurements. Consistent side angles make head, shoulder, and trunk trends easier to trust.</p>
        </section>
      </div>
      <section className="mt-6 rounded-md border border-[#d8ded7] bg-white p-4">
        <h2 className="font-semibold">Repeatability statistics</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[#516156]"><tr><th className="py-2">Measurement</th><th>Count</th><th>Mean</th><th>SD</th><th>Range</th></tr></thead>
            <tbody>
              {stats.map((row) => <tr key={row.id} className="border-t border-[#eef0ed]"><td className="py-2 font-medium">{row.id}</td><td>{row.count}</td><td>{row.mean}</td><td>{row.sd}</td><td>{row.range}</td></tr>)}
              {stats.length === 0 && <tr><td className="py-3 text-[#516156]" colSpan={5}>No scan data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 rounded-md border border-[#d8ded7] bg-[#101712] p-4 text-white">
        <h2 className="font-semibold">Raw landmark data</h2>
        <pre className="mt-3 max-h-[420px] overflow-auto text-xs leading-5 text-[#dce5dc]">{JSON.stringify(scans, null, 2)}</pre>
      </section>
    </main>
  );
}
