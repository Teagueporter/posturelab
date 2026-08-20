import { interpretScan, progressMilestones } from "@/lib/interpretation/rules";
import type { ScanAnalysis } from "@/lib/measurements/types";
import Link from "next/link";

export function InterpretationPanel({ scan }: { scan: ScanAnalysis }) {
  const findings = interpretScan(scan);

  return (
    <section className="mt-6 space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">What this means</p>
        <h2 className="mt-1 text-2xl font-semibold">Signals, not diagnoses</h2>
      </div>
      <div className="grid gap-3">
        {findings.map((finding) => (
          <article key={finding.id} className="rounded-md border border-[#d8ded7] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold">{finding.title}</h3>
              <span className="rounded-sm bg-[#edf4ef] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#237a57]">{finding.priority}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#35453a]">{finding.summary}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <TextBlock title="Can suggest" body={finding.whatItCanMean} />
              <TextBlock title="Cannot prove" body={finding.whatItCannotMean} />
              <TextBlock title="Track" body={finding.target} />
            </div>
          </article>
        ))}
      </div>

      <article className="rounded-md border border-[#d8ded7] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Training focus</h3>
            <p className="mt-1 text-sm leading-6 text-[#516156]">
              Your plan is organized around the measurable signals above, with exercise levels so you can start conservatively and progress only when reps stay controlled.
            </p>
          </div>
          <Link href="/plan" className="inline-flex h-10 items-center rounded-md bg-[#17211b] px-3 text-sm font-semibold text-white">Open plan</Link>
        </div>
      </article>

      <article className="rounded-md border border-[#d8ded7] bg-white p-4">
        <h3 className="text-base font-semibold">Expected progress timeline</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {progressMilestones.map((milestone) => (
            <div key={milestone.week} className="rounded-md border border-[#eef0ed] p-3">
              <h4 className="font-semibold">{milestone.week}</h4>
              <p className="mt-2 text-sm leading-5 text-[#516156]">{milestone.expected}</p>
            </div>
          ))}
        </div>
      </article>

    </section>
  );
}

function TextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-[#eef0ed] p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-sm leading-5 text-[#516156]">{body}</p>
    </div>
  );
}
