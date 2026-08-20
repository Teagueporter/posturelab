"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Dumbbell, ExternalLink, FileText, History, Info, Ruler } from "lucide-react";
import { PoseOverlay } from "@/components/pose/PoseOverlay";
import { MeasurementCard } from "@/components/results/MeasurementCard";
import { QualityPanel } from "@/components/results/QualityPanel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildBodyFindings, evidenceTakeaways, severityLabel, type BodyFindingSeverity } from "@/lib/interpretation/body-findings";
import { buildTrackingScore } from "@/lib/interpretation/scan-summary";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { getScan } from "@/lib/storage/scans";

export function ResultsView({ scanId }: { scanId: string }) {
  const [scan, setScan] = useState<ScanAnalysis>();

  useEffect(() => {
    queueMicrotask(() => setScan(getScan(scanId)));
  }, [scanId]);

  if (!scan) {
    return (
      <main className="mx-auto min-h-dvh max-w-xl px-5 py-8">
        <h1 className="text-3xl font-semibold">Scan not found</h1>
        <Link className="mt-6 inline-flex h-11 items-center rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white" href="/scan">Start a scan</Link>
      </main>
    );
  }

  const trackingScore = buildTrackingScore(scan);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl overflow-hidden px-5 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <ButtonLink href="/scan"><ArrowLeft className="h-4 w-4" />New scan</ButtonLink>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/measurements"><Ruler className="h-4 w-4" />Metrics</ButtonLink>
          <ButtonLink href="/report"><FileText className="h-4 w-4" />Report</ButtonLink>
          <ButtonLink href="/history"><History className="h-4 w-4" />History</ButtonLink>
        </div>
      </div>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">POSTURE ANALYSIS</h1>
      <p className="mt-2 text-sm text-[#516156]">{new Date(scan.createdAt).toLocaleString()}</p>
      <Card className="mt-5">
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Tracking score</p>
              <h2 className="mt-1 text-4xl font-semibold">{trackingScore.total}<span className="text-lg text-[#516156]">/100</span></h2>
              <p className="mt-2 text-sm leading-6 text-[#516156]">{trackingScore.summary}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {trackingScore.parts.map((part) => (
                <div key={part.label} className="rounded-md border border-[#eef0ed] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{part.label}</h3>
                    <span className="font-semibold text-[#237a57]">{part.score}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#516156]">{part.note}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <MetricGuide />
      <BodyFindings scan={scan} />
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <AnnotatedView title="Front" image={scan.frontImage} pose={scan.front} measurements={scan.measurements.filter((m) => m.view === "front")} />
        <AnnotatedView title="Left side" image={scan.leftSideImage} pose={scan.leftSide} measurements={scan.measurements.filter((m) => m.view === "leftSide")} />
        <AnnotatedView title="Right side" image={scan.rightSideImage} pose={scan.rightSide} measurements={scan.measurements.filter((m) => m.view === "rightSide")} />
        <AnnotatedView title="Back" image={scan.backImage} pose={scan.back} measurements={scan.measurements.filter((m) => m.view === "back")} />
      </section>
      <QualityPanel quality={scan.quality} />
      <details className="mt-4 rounded-md border border-[#d8ded7] bg-white p-4">
        <summary className="cursor-pointer font-semibold">All upper-body measurements</summary>
        <section className="mt-4 grid gap-3 md:grid-cols-2">
          {scan.measurements.map((measurement) => <MeasurementCard key={measurement.id} measurement={measurement} />)}
        </section>
      </details>
      <EvidencePanel />
    </main>
  );
}

function BodyFindings({ scan }: { scan: ScanAnalysis }) {
  const findings = [...buildBodyFindings(scan)].sort((a, b) => b.score - a.score);

  return (
    <Card className="mt-5">
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Body findings</p>
            <h2 className="mt-1 text-2xl font-semibold">What needs work</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#516156]">
              These combine the raw left-view and right-view measurements into body-level posture patterns.
            </p>
          </div>
          <ButtonLink href="/plan" variant="secondary"><Dumbbell className="h-4 w-4" />Open plan</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {findings.map((finding) => (
            <article key={finding.id} className={`rounded-md border p-4 ${findingBorderClass(finding.severity)}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{finding.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#516156]">{finding.metricSummary}</p>
                </div>
                <Badge tone={findingTone(finding.severity)}>{severityLabel(finding.severity)}</Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-[#35453a]">
                <LabeledLine label="Readout" value={finding.readout} />
                <LabeledLine label="How fixable" value={finding.fixability} />
                <LabeledLine label="Goal" value={finding.goal} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {finding.exercises.map((exercise) => <Badge key={exercise} tone="default">{exercise}</Badge>)}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EvidencePanel() {
  return (
    <Card className="mt-6">
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Evidence-backed training</p>
            <h2 className="mt-1 text-2xl font-semibold">Why this can improve</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#516156]">
              The most defensible plan is not posture forcing. It is repeated mobility, deep-neck-flexor control, upper-back strengthening, and pec mobility matched to the findings above.
            </p>
          </div>
          <ButtonLink href="/plan" variant="primary"><Dumbbell className="h-4 w-4" />Start exercises</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {evidenceTakeaways.map((item) => (
            <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="rounded-md border border-[#eef0ed] p-3 transition-colors hover:border-[#cfd8d1] hover:bg-[#fbfcfa]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#667568]" />
              </div>
              <p className="mt-2 text-xs leading-5 text-[#516156]">{item.summary}</p>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnotatedView({ title, image, pose, measurements }: { title: string; image?: string; pose: ScanAnalysis["front"]; measurements: ScanAnalysis["measurements"] }) {
  const keyMeasurements = primaryMeasurements(measurements);

  return (
    <Card className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <Badge tone="muted"><Camera className="mr-1 h-3 w-3" />{keyMeasurements.length} key readouts</Badge>
      </div>
      <PoseOverlay image={image} pose={pose} measurements={measurements} />
      <div className="mt-3 grid gap-2">
        {keyMeasurements.map((measurement) => (
          <MeasurementCard key={measurement.id} measurement={measurement} compact />
        ))}
      </div>
    </Card>
  );
}

function MetricGuide() {
  return (
    <Card className="mt-5">
      <CardContent>
        <div className="flex items-start gap-3">
          <Info className="mt-1 h-5 w-5 shrink-0 text-[#237a57]" />
          <div>
            <h2 className="text-lg font-semibold">How to read these metrics</h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-[#516156] md:grid-cols-3">
              <p><span className="font-semibold text-[#17211b]">Priority</span> means the app sees a larger deviation from its photo reference and a clearer training target.</p>
              <p><span className="font-semibold text-[#17211b]">Reliability</span> means the landmarks were visible enough to trust the measurement more.</p>
              <p><span className="font-semibold text-[#17211b]">Left/right side</span> means camera view, not two separate necks. Differences help spot rotation or asymmetry.</p>
            </div>
            <div className="mt-4 grid gap-2 border-t border-[#eef0ed] pt-3 text-xs leading-5 text-[#667568] sm:grid-cols-2">
              <p><span className="font-semibold text-[#237a57]">Green:</span> detected upper-body landmarks.</p>
              <p><span className="font-semibold text-[#6f58c9]">Purple:</span> shoulder-to-hip trunk line.</p>
              <p><span className="font-semibold text-[#b47b1f]">Gold:</span> head offset from shoulder center.</p>
              <p><span className="font-semibold text-[#17211b]">Boundary:</span> this can estimate posture patterns, but true kyphosis angle needs clinical measurement.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LabeledLine({ label, value }: { label: string; value: string }) {
  return (
    <p><span className="font-semibold text-[#17211b]">{label}:</span> {value}</p>
  );
}

function findingTone(severity: BodyFindingSeverity) {
  if (severity === "high") return "danger";
  if (severity === "moderate") return "warning";
  return "success";
}

function findingBorderClass(severity: BodyFindingSeverity) {
  if (severity === "high") return "border-[#e8b2a4] bg-[#fffafa]";
  if (severity === "moderate") return "border-[#ead58e] bg-[#fffdf5]";
  return "border-[#eef0ed] bg-white";
}

function primaryMeasurements(measurements: ScanAnalysis["measurements"]) {
  const primaryIds = new Set([
    "front_shoulder_tilt",
    "front_trunk_lean",
    "front_shoulder_hip_tilt_difference",
    "leftSide_ear_over_shoulder_offset",
    "leftSide_craniovertebral_angle_proxy",
    "leftSide_shoulder_over_hip_offset",
    "rightSide_ear_over_shoulder_offset",
    "rightSide_craniovertebral_angle_proxy",
    "rightSide_shoulder_over_hip_offset",
    "back_shoulder_tilt",
    "back_trunk_lean",
    "back_shoulder_hip_tilt_difference",
  ]);
  return measurements.filter((measurement) => primaryIds.has(measurement.id));
}
