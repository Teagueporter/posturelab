import Link from "next/link";
import { ArrowLeft, CreditCard, Download, LogOut, Shield } from "lucide-react";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { getCurrentUser } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { signOut } from "@/app/login/actions";
import { deleteCloudAccount, openCustomerPortal } from "@/app/account/actions";
import { hasSupabaseBrowserEnv } from "@/lib/env";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; checkout?: string }>;
}) {
  const user = await getCurrentUser();
  const subscription = await getCurrentSubscription();
  const { message, checkout } = await searchParams;
  const authReady = hasSupabaseBrowserEnv();

  if (!user) {
    return (
      <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-[#17211b]">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#476153]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Card>
            <CardHeader>
              <h1 className="text-3xl font-semibold">Account</h1>
              <p className="mt-2 text-sm leading-6 text-[#5e6f64]">
                {authReady
                  ? "Sign in to sync scans, workouts, reports, and billing."
                  : "Cloud accounts are not live yet. Local scans still work, and account sync turns on after Supabase is configured."}
              </p>
            </CardHeader>
            <CardContent>
              {authReady ? (
                <Link className="inline-flex h-11 items-center justify-center rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white" href="/login?next=%2Faccount">
                  Sign in
                </Link>
              ) : (
                <Link className="inline-flex h-11 items-center justify-center rounded-md border border-[#cfd8d1] bg-white px-4 text-sm font-semibold" href="/scan">
                  Start local scan
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-[#17211b]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#476153]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <form action={signOut}>
            <button className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#516156] transition hover:bg-[#eef0ed]">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </nav>

        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#237a57]">Account</p>
          <h1 className="text-4xl font-semibold md:text-5xl">Your posture workspace</h1>
        </section>

        {message || checkout ? (
          <p className="rounded-md border border-[#d8ded7] bg-white p-3 text-sm font-medium text-[#516156]">
            {message ?? (checkout === "success" ? "Checkout complete. Your subscription will update after Stripe confirms payment." : "Account updated.")}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Profile</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-[#516156]">
              <p>
                <span className="font-semibold text-[#17211b]">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-semibold text-[#17211b]">User ID:</span> {user.id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Subscription</h2>
                <span className="rounded-md bg-[#e7f2eb] px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#237a57]">
                  {subscription.isPro ? "Pro" : "Free"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-[#516156]">
                Status: <span className="font-semibold text-[#17211b]">{subscription.status}</span>
                {subscription.currentPeriodEnd ? ` through ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : ""}
              </p>
              {subscription.stripeCustomerId ? (
                <form action={openCustomerPortal}>
                  <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white">
                    <CreditCard className="h-4 w-4" />
                    Manage billing
                  </button>
                </form>
              ) : (
                <Link className="inline-flex h-11 items-center justify-center rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white" href="/pricing">
                  View pricing
                </Link>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#237a57]" />
              <h2 className="text-2xl font-semibold">Privacy controls</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[#516156]">
              Scan photos are stored in a private Supabase bucket when cloud sync is configured. Deleting your account removes cloud scan rows,
              check-ins, workout completions, subscription records, and stored scan photos. If Stripe is configured, an active subscription is
              canceled before the account is removed.
            </p>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd8d1] bg-white px-3 text-sm font-semibold"
              href="/api/account/export"
            >
              <Download className="h-4 w-4" />
              Export cloud data
            </a>
            <form action={deleteCloudAccount} className="rounded-md border border-[#ecd3cd] bg-[#fff8f6] p-4">
              <label className="block text-sm font-semibold text-[#7c2d1f]">
                Type DELETE to remove your cloud account
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#e2b8ae] bg-white px-3 text-base outline-none"
                  name="confirm"
                  autoComplete="off"
                />
              </label>
              <button className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[#9d3b2b] px-4 text-sm font-semibold text-white">
                Delete cloud account
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
