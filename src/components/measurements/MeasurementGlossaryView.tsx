import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { evidenceNotes } from "@/lib/interpretation/rules";
import { measurementGlossary } from "@/lib/measurements/glossary";
import { scanSetupProtocol } from "@/lib/pose/setup-protocol";

export function MeasurementGlossaryView() {
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Measurement reference</p>
          <h1 className="mt-2 text-4xl font-semibold">What the numbers mean</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/plan" className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8d1] px-4 text-sm font-semibold"><Dumbbell className="h-4 w-4" />Plan</Link>
          <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" />Home</Link>
        </div>
      </div>

      <section className="mt-6 rounded-md border border-[#d8ded7] bg-white p-4">
        <h2 className="text-lg font-semibold">Ground rules</h2>
        <p className="mt-2 text-sm leading-6 text-[#516156]">
          These are deterministic photo measurements from pose landmarks. They are useful for repeatable trends, not medical diagnosis. Kyphosis-related entries are proxies for side-photo head and trunk position; they do not measure thoracic spinal curve angle.
        </p>
      </section>

      <section className="mt-6 rounded-md border border-[#d8ded7] bg-white p-4">
        <h2 className="text-lg font-semibold">Evidence boundaries</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {evidenceNotes.map((source) => (
            <a key={source.url} href={source.url} className="rounded-md border border-[#eef0ed] p-3">
              <h3 className="font-semibold">{source.label}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#237a57]">{source.type} · {source.strength} certainty</p>
              <p className="mt-2 text-sm leading-5 text-[#516156]">{source.claimBoundary}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-[#d8ded7] bg-white p-4">
        <h2 className="text-lg font-semibold">Repeatable scan setup</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scanSetupProtocol.map((item) => (
            <article key={item.title} className="rounded-md border border-[#eef0ed] p-3">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-5 text-[#516156]">{item.detail}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#237a57]">Prevents: {item.prevents.join(", ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {measurementGlossary.map((entry) => (
          <article key={entry.id} className="rounded-md border border-[#d8ded7] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{entry.label}</h2>
              <span className="rounded-sm bg-[#edf4ef] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#237a57]">{entry.category}</span>
            </div>
            <div className="mt-3 grid gap-3">
              <Block title="Formula" body={entry.formula} />
              <Block title="Can mean" body={entry.means} />
              <Block title="Does not mean" body={entry.doesNotMean} />
              <Block title="Track for" body={entry.trackFor} />
            </div>
            <div className="mt-3 rounded-md border border-[#eef0ed] p-3">
              <h3 className="text-sm font-semibold">Routine links</h3>
              <p className="mt-1 text-sm leading-5 text-[#516156]">{entry.improveWith.join(", ")}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-[#eef0ed] p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-[#516156]">{body}</p>
    </div>
  );
}
