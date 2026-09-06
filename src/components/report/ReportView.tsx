"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clipboard, Download, History, Lock, Printer } from "lucide-react";
import { buildMarkdownReport } from "@/lib/report/report";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { hydrateCheckInsFromCloud, listCheckIns, type CheckIn } from "@/lib/storage/checkins";
import { hydrateScansFromCloud, listScans } from "@/lib/storage/scans";
import { hydrateWorkoutCompletionsFromCloud, listWorkoutCompletions, type WorkoutCompletion } from "@/lib/storage/workouts";

export function ReportView({ isPro = false, paywallEnabled = false }: { isPro?: boolean; paywallEnabled?: boolean }) {
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
      void hydrateScansFromCloud().then(setScans);
      void hydrateCheckInsFromCloud().then(setCheckIns);
      void hydrateWorkoutCompletionsFromCloud().then(setCompletions);
    });
  }, []);

  async function copyReport() {
    if (paywallEnabled && !isPro) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadReport() {
    if (paywallEnabled && !isPro) return;
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
          <button disabled={paywallEnabled && !isPro} onClick={copyReport} className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy"}</button>
          <button disabled={paywallEnabled && !isPro} onClick={downloadReport} className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />Download</button>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white"><Printer className="h-4 w-4" />Print</button>
        </div>
      </div>

      {paywallEnabled && !isPro ? (
        <section className="mt-6 rounded-md border border-[#efd1c8] bg-[#fff8f5] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#9d3b2b]">
            <Lock className="h-4 w-4" />
            Pro report export
          </p>
          <h2 className="mt-2 text-xl font-semibold">Upgrade to copy and download full reports.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6c514b]">
            Free users can preview report content. Pro adds exportable summaries for progress reviews, coaches, or clinicians.
          </p>
          <Link href="/pricing" className="mt-3 inline-flex h-10 items-center rounded-md bg-[#17211b] px-3 text-sm font-semibold text-white">
            View pricing
          </Link>
        </section>
      ) : null}

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
