"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clipboard, Download, History, Printer } from "lucide-react";
import { buildMarkdownReport } from "@/lib/report/report";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { listCheckIns, type CheckIn } from "@/lib/storage/checkins";
import { listScans } from "@/lib/storage/scans";
import { listWorkoutCompletions, type WorkoutCompletion } from "@/lib/storage/workouts";

export function ReportView() {
  const [scans, setScans] = useState<ScanAnalysis[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => buildMarkdownReport(scans, checkIns, completions), [scans, checkIns, completions]);

  useEffect(() => {
    queueMicrotask(() => {
      setScans(listScans());
      setCheckIns(listCheckIns());
      setCompletions(listWorkoutCompletions());
    });
  }, []);

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `posturelab-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Shareable summary</p>
          <h1 className="mt-2 text-4xl font-semibold">PostureLab report</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyReport} className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy"}</button>
          <button onClick={downloadReport} className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold"><Download className="h-4 w-4" />Download</button>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white"><Printer className="h-4 w-4" />Print</button>
        </div>
      </div>

      <section className="mt-6 rounded-md border border-[#d8ded7] bg-white p-4">
        <h2 className="text-lg font-semibold">Use this carefully</h2>
        <p className="mt-2 text-sm leading-6 text-[#516156]">
          This report is meant for self-tracking or discussion with a qualified clinician or coach. It summarizes posture-photo proxies and an exercise protocol; it is not a diagnosis.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/plan" className="inline-flex h-10 items-center rounded-md border border-[#cfd8d1] px-3 text-sm font-semibold">Plan</Link>
          <Link href="/history" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd8d1] px-3 text-sm font-semibold"><History className="h-4 w-4" />History</Link>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-[#d8ded7] bg-[#101712] p-4 text-white">
        <h2 className="text-lg font-semibold">Markdown preview</h2>
        <pre className="mt-3 max-h-[70dvh] overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#dce5dc]">{report}</pre>
      </section>
    </main>
  );
}
