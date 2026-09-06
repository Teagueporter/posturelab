import Link from "next/link";
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, Sparkles, X } from "lucide-react";
import { plans } from "@/lib/billing/plans";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { startProCheckout } from "@/app/pricing/actions";
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
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-[#17211b]">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#476153]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link href="/account" className="text-sm font-semibold text-[#237a57]">
            Account
          </Link>
        </nav>

        <section className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#237a57]">Pricing</p>
          <h1 className="text-4xl font-semibold md:text-6xl">Start with one scan. Upgrade when tracking matters.</h1>
          <p className="text-lg leading-7 text-[#516156]">
            The free tier validates your photo setup and main posture findings. Pro is for repeat scans, weekly reviews, plan progression,
            and exportable reports.
          </p>
        </section>

        {!billingReady ? (
          <p className="rounded-md border border-[#e7d3a3] bg-[#fff8e8] p-3 text-sm font-medium text-[#6d5524]">
            Billing is not live yet. The app can still run local scans, and Pro checkout buttons turn on after Supabase and Stripe
            environment variables are configured.
          </p>
        ) : null}

        {message || checkout ? (
          <p className="rounded-md border border-[#d8ded7] bg-white p-3 text-sm font-medium text-[#516156]">
            {message ?? (checkout === "cancelled" ? "Checkout cancelled." : "Checkout updated.")}
          </p>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[#d8ded7] bg-white p-4">
            <ShieldCheck className="h-5 w-5 text-[#237a57]" />
            <h2 className="mt-3 font-semibold">Privacy-first storage</h2>
            <p className="mt-2 text-sm leading-6 text-[#5e6f64]">Scans stay local unless a signed-in user enables cloud sync.</p>
          </div>
          <div className="rounded-md border border-[#d8ded7] bg-white p-4">
            <Sparkles className="h-5 w-5 text-[#237a57]" />
            <h2 className="mt-3 font-semibold">Plan changes with progress</h2>
            <p className="mt-2 text-sm leading-6 text-[#5e6f64]">Weekly reviews combine scans, check-ins, and workout adherence.</p>
          </div>
          <div className="rounded-md border border-[#d8ded7] bg-white p-4">
            <Lock className="h-5 w-5 text-[#237a57]" />
            <h2 className="mt-3 font-semibold">Cancel self-service</h2>
            <p className="mt-2 text-sm leading-6 text-[#5e6f64]">Stripe Checkout and the billing portal handle payment and cancellation.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={`${plan.name}-${plan.interval ?? "none"}`} className={plan.interval === "yearly" ? "border-[#237a57]" : ""}>
              <CardHeader className="space-y-4">
                <div className="flex min-h-24 items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#5e6f64]">{plan.description}</p>
                  </div>
                  {plan.interval === "yearly" ? (
                    <span className="rounded-md bg-[#e7f2eb] px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#237a57]">
                      Best value
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-[#516156]">{plan.audience}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  {plan.interval ? <span className="text-sm text-[#5e6f64]">/{plan.interval === "monthly" ? "mo" : "yr"}</span> : null}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6 text-[#516156]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#237a57]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#e5e9e4] pt-4">
                  <h3 className="text-sm font-semibold text-[#17211b]">{plan.id === "free" ? "What is not included" : "Plain terms"}</h3>
                  <ul className="mt-3 space-y-2">
                    {plan.limits.map((limit) => (
                      <li key={limit} className="flex gap-2 text-sm leading-6 text-[#5e6f64]">
                        {plan.id === "free" ? (
                          <X className="mt-1 h-4 w-4 shrink-0 text-[#b85a43]" />
                        ) : (
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[#237a57]" />
                        )}
                        {limit}
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.id === "free" ? (
                  <Link className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-sm font-semibold" href="/scan">
                    Start free scan
                  </Link>
                ) : subscription.isPro ? (
                  <Link className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#17211b] text-sm font-semibold text-white" href="/account">
                    Manage Pro
                  </Link>
                ) : !billingReady ? (
                  <button
                    className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#d8ded7] bg-[#f1f3ef] text-sm font-semibold text-[#6b766d]"
                    disabled
                    type="button"
                  >
                    <Lock className="h-4 w-4" />
                    Checkout not live yet
                  </button>
                ) : (
                  <form action={startProCheckout}>
                    <input type="hidden" name="interval" value={plan.interval} />
                    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#17211b] text-sm font-semibold text-white transition hover:bg-[#24342b]">
                      <CreditCard className="h-4 w-4" />
                      Upgrade
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <p className="text-sm leading-6 text-[#5e6f64]">
          Tax is not enabled in code yet. Before live launch, configure Stripe Tax registrations for the jurisdictions where you need to collect tax.
        </p>
      </div>
    </main>
  );
}
