import Link from "next/link";
import { Activity, Camera, Dumbbell, FileText, FlaskConical, History, Ruler } from "lucide-react";

const links = [
  { href: "/scan", label: "Start posture scan", icon: Camera },
  { href: "/plan", label: "Workout plan", icon: Dumbbell },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/history", label: "History", icon: History },
  { href: "/lab", label: "Research mode", icon: FlaskConical },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f7f8f5] text-[#17211b]">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-between px-5 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
            <Activity className="h-5 w-5 text-[#237a57]" />
            PostureLab
          </div>
          <Link className="text-sm font-medium text-[#476153]" href="/lab">
            Lab
          </Link>
        </nav>
        <div className="grid gap-8 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#237a57]">
              Measurement-first posture scans
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] md:text-7xl">
              Repeatable posture measurements from front and side photos.
            </h1>
            <p className="max-w-xl text-lg leading-7 text-[#516156]">
              Capture standardized photos, run pose landmark detection, review
              exactly what was measured, and track numeric changes over time.
            </p>
            <div className="flex flex-wrap gap-3">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24342b]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-[#d8ded7] bg-white">
            <div className="absolute inset-x-8 top-8 h-px bg-[#d8ded7]" />
            <div className="absolute inset-y-8 left-1/2 w-px bg-[#d8ded7]" />
            <div className="absolute left-[28%] top-[17%] h-8 w-8 rounded-full border-2 border-[#237a57]" />
            <div className="absolute left-[22%] top-[31%] h-1 w-[38%] origin-left rotate-[-2deg] rounded bg-[#237a57]" />
            <div className="absolute left-[28%] top-[34%] h-[34%] w-1 origin-top rotate-[2deg] rounded bg-[#237a57]" />
            <div className="absolute left-[23%] top-[66%] h-1 w-[32%] origin-left rotate-[1deg] rounded bg-[#237a57]" />
            <div className="absolute right-[23%] top-[16%] h-8 w-8 rounded-full border-2 border-[#c5573d]" />
            <div className="absolute right-[30%] top-[25%] h-[39%] w-1 origin-top rotate-[-6deg] rounded bg-[#c5573d]" />
            <div className="absolute right-[24%] top-[32%] h-1 w-[23%] rounded bg-[#c5573d]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-md border border-[#e4e8e2] bg-[#fbfcfa] p-4 text-sm text-[#516156]">
              Measurements are deterministic geometry from detected landmarks,
              not medical diagnosis or invented precision.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
