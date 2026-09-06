import Link from "next/link";
import { Activity, ArrowRight, Camera, CheckCircle2, CreditCard, Dumbbell, FileText, FlaskConical, History, Ruler, ShieldCheck, User } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const links = [
  { href: "/scan", label: "Start posture scan", icon: Camera },
  { href: "/plan", label: "Workout plan", icon: Dumbbell },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/history", label: "History", icon: History },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/lab", label: "Research mode", icon: FlaskConical },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between px-5 py-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--primary)] text-white">
              <Activity className="h-4 w-4" />
            </span>
            PostureLab
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-[var(--muted-strong)]">
            <Link className="transition hover:text-[var(--primary)]" href="/lab">
              Lab
            </Link>
            <Link className="transition hover:text-[var(--primary)]" href="/pricing">
              Pricing
            </Link>
            <Link className="inline-flex items-center gap-2 transition hover:text-[var(--primary)]" href="/account">
              <User className="h-4 w-4" />
              Account
            </Link>
          </div>
        </nav>
        <div className="grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Posture tracking for repeat scans
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
              Turn posture photos into a clear plan you can repeat.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Capture front, side, and back views, review the measurements that stand out, and follow a corrective routine that updates as your scans improve.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/scan" variant="primary" className="h-11 px-4">
                <Camera className="h-4 w-4" />
                Start scan
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/plan" variant="secondary" className="h-11 px-4">
                <Dumbbell className="h-4 w-4" />
                View plan
              </ButtonLink>
            </div>
            <div className="grid max-w-xl gap-2 pt-2 text-sm text-[var(--muted-strong)] sm:grid-cols-3">
              {["Local-first scans", "Private cloud sync", "Stripe-ready Pro"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>
        <footer className="flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      </section>
    </main>
  );
}

function ProductPreview() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Latest scan</p>
            <h2 className="mt-1 text-2xl font-semibold">What needs work</h2>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-right">
            <p className="text-xs text-[var(--muted)]">Tracking score</p>
            <p className="text-xl font-semibold">82<span className="text-sm text-[var(--muted)]">/100</span></p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Forward head", "High focus", "21.5 deg"],
            ["Rounded shoulder", "Moderate", "Upper-back proxy"],
            ["Trunk stack", "Low focus", "5.3%"],
          ].map(([title, label, value]) => (
            <div key={title} className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--accent)]">{label}</p>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[#111814] p-4 text-white">
          <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-40 rounded-md bg-[#eef2ee]">
              <div className="absolute left-1/2 top-[14%] h-9 w-9 -translate-x-1/2 rounded-full border-2 border-[var(--accent)]" />
              <div className="absolute left-[34%] top-[31%] h-1 w-[34%] rounded-full bg-[var(--accent)]" />
              <div className="absolute left-1/2 top-[34%] h-[36%] w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              <div className="absolute left-[36%] top-[68%] h-1 w-[28%] rounded-full bg-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Photo setup stays simple.</p>
              <p className="mt-2 text-sm leading-6 text-[#d6ddd6]">
                Five-second captures, four upper-body views, and concise overlays that show the lines used for each result.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {links.slice(2).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
        <div className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
          Wellness tracking only. Measurements are geometric estimates from detected landmarks, not diagnosis.
        </div>
      </CardContent>
    </Card>
  );
}
