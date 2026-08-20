import type { ScanQualityReport } from "@/lib/measurements/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function QualityPanel({ quality }: { quality: ScanQualityReport }) {
  return (
    <Card className="mt-6 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Scan quality</p>
          <h2 className="mt-1 text-2xl font-semibold">Trend readiness: {quality.trendReady ? "Ready" : "Needs better capture"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#516156]">
            Reliability describes landmark visibility and repeatability. It is not a severity score.
          </p>
        </div>
        <Badge tone="muted">Reliability: {quality.overall}</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {Object.values(quality.views).map((view) => (
          <article key={view.view} className="rounded-md border border-[#eef0ed] p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{viewLabel(view.view)}</h3>
              <Badge tone={qualityTone(view.quality)}>{view.quality}</Badge>
            </div>
            <p className="mt-2 text-sm text-[#516156]">{view.requiredVisible ? "Head, shoulders, and hips visible" : "Upper-body landmarks not reliable"}</p>
            {view.notes.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs leading-5 text-[#667568]">
                {view.notes.slice(0, 3).map((note) => <li key={note}>{note}</li>)}
              </ul>
            )}
          </article>
        ))}
      </div>
    </Card>
  );
}

function qualityTone(quality: string) {
  if (quality === "High") return "success";
  if (quality === "Medium") return "warning";
  return "danger";
}

function viewLabel(view: string) {
  if (view === "leftSide") return "Left side";
  if (view === "rightSide") return "Right side";
  return view[0].toUpperCase() + view.slice(1);
}
