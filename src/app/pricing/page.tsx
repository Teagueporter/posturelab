import Link from "next/link";
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, Sparkles, X } from "lucide-react";
import { plans } from "@/lib/billing/plans";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { startProCheckout } from "@/app/pricing/actions";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { hasStripeEnv, hasSupabaseServerEnv } from "@/lib/env";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; checkout?: string }>;
}) {
  const subscription = await getCurrentSubscription();
  const { message, checkout } = await searchParams;
  const billingReady = hasSupabaseServerEnv() && hasStripeEnv();

  return (
    <main className="min-h-dvh bg-[var(--background)] px-5 py-8 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--primary)]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link href="/account" className="text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--primary)]">
            Account
          </Link>
        </nav>

        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Pricing</p>
          <h1 className="text-4xl font-semibold md:text-6xl">Start with one scan. Upgrade when tracking matters.</h1>
          <p className="text-lg leading-7 text-[var(--muted)]">
            The free tier validates your photo setup and main posture findings. Pro is for repeat scans, weekly reviews, plan progression,
            and exportable reports.
          </p>
        </section>

        {!billingReady ? (
          <p className="rounded-md border border-[#ecdca7] bg-[var(--warning-soft)] p-3 text-sm font-medium text-[var(--warning)]">
            Billing is not live yet. The app can still run local scans, and Pro checkout buttons turn on after Supabase and Stripe
            environment variables are configured.
          </p>
        ) : null}

        {message || checkout ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-medium text-[var(--muted)]">
            {message ?? (checkout === "cancelled" ? "Checkout cancelled." : "Checkout updated.")}
          </p>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 font-semibold">Privacy-first storage</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Scans stay local unless a signed-in user enables cloud sync.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 font-semibold">Plan changes with progress</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Weekly reviews combine scans, check-ins, and workout adherence.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 font-semibold">Cancel self-service</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Stripe Checkout and the billing portal handle payment and cancellation.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={`${plan.name}-${plan.interval ?? "none"}`} className={plan.interval === "yearly" ? "border-[var(--accent)]" : ""}>
              <CardHeader className="space-y-4">
                <div className="flex min-h-24 items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>
                  </div>
                  {plan.interval === "yearly" ? (
                    <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                      Best value
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-[var(--muted)]">{plan.audience}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  {plan.interval ? <span className="text-sm text-[var(--muted)]">/{plan.interval === "monthly" ? "mo" : "yr"}</span> : null}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6 text-[var(--muted)]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{plan.id === "free" ? "What is not included" : "Plain terms"}</h3>
                  <ul className="mt-3 space-y-2">
                    {plan.limits.map((limit) => (
                      <li key={limit} className="flex gap-2 text-sm leading-6 text-[var(--muted)]">
                        {plan.id === "free" ? (
                          <X className="mt-1 h-4 w-4 shrink-0 text-[var(--danger)]" />
                        ) : (
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                        )}
                        {limit}
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.id === "free" ? (
                  <ButtonLink className="h-11 w-full" href="/scan" variant="secondary">
                    Start free scan
                  </ButtonLink>
                ) : subscription.isPro ? (
                  <ButtonLink className="h-11 w-full" href="/account" variant="primary">
                    Manage Pro
                  </ButtonLink>
                ) : !billingReady ? (
                  <button
                    className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] text-sm font-semibold text-[var(--muted)]"
                    disabled
                    type="button"
                  >
                    <Lock className="h-4 w-4" />
                    Checkout not live yet
                  </button>
                ) : (
                  <form action={startProCheckout}>
                    <input type="hidden" name="interval" value={plan.interval} />
                    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--primary)] text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]">
                      <CreditCard className="h-4 w-4" />
                      Upgrade
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <p className="text-sm leading-6 text-[var(--muted)]">
          Tax is not enabled in code yet. Before live launch, configure Stripe Tax registrations for the jurisdictions where you need to collect tax.
        </p>
      </div>
    </main>
  );
}
