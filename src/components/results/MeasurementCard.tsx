import type { Measurement } from "@/lib/measurements/types";
import { glossaryForMeasurement } from "@/lib/measurements/glossary";
import { focusForMeasurement, type FocusLevel } from "@/lib/measurements/focus";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function MeasurementCard({
  measurement,
  compact = false,
}: {
  measurement: Measurement;
  compact?: boolean;
}) {
  const glossary = glossaryForMeasurement(measurement.id);
  const focus = focusForMeasurement(measurement);

  return (
    <Card className={compact ? `p-3 ${focusBorderClass(focus.level)}` : `p-4 ${focusBorderClass(focus.level)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>{measurement.label}</h3>
            <Badge tone={focusTone(focus.level)}>{focus.label}</Badge>
            {measurement.category && <Badge tone="muted" className="uppercase">{measurement.category}</Badge>}
          </div>
          {!compact && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{measurement.explanation}</p>}
        </div>
        <div className="shrink-0 text-right">
          <div className={compact ? "text-xl font-semibold" : "text-2xl font-semibold"}>
            {measurement.value}
            <span className="text-base">{measurement.unit}</span>
          </div>
          {!compact && <div className="mt-1 text-xs font-medium text-[var(--muted)]">Reliability: {measurement.quality}</div>}
        </div>
      </div>
      {!compact && glossary && (
        <div className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--muted)]">
          <p><span className="font-semibold text-[var(--foreground)]">Where it should be:</span> {glossary.reference}</p>
          {!compact && <p><span className="font-semibold text-[var(--foreground)]">Use it for:</span> {glossary.trackFor}</p>}
        </div>
      )}
    </Card>
  );
}

function focusTone(level: FocusLevel) {
  if (level === "high") return "danger";
  if (level === "moderate") return "warning";
  return "success";
}

function focusBorderClass(level: FocusLevel) {
  if (level === "high") return "border-[#e7c1b6]";
  if (level === "moderate") return "border-[#ecdca7]";
  return "";
}
