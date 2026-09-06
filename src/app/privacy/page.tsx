import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-[#17211b]">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#476153]">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <Card>
          <CardHeader>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">
              <Shield className="h-4 w-4" />
              Privacy
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Privacy policy</h1>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-6 text-[#516156]">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">What PostureLab Uses</h2>
              <p>
                PostureLab uses posture photos, pose landmarks, measurements, scan quality signals, check-ins, workout completions, and subscription
                state to provide self-tracking, progress review, and exercise-plan features.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Local Scans</h2>
              <p>
                If you are not signed in, scans are kept in this browser&apos;s local storage. Clearing browser data can remove local scan history.
                Local-only scans are not sent to Supabase by PostureLab.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Cloud Sync</h2>
              <p>
                When cloud sync is configured and you are signed in, scan photos are stored in a private Supabase Storage bucket and user data is
                stored in user-owned Supabase rows protected by row-level security. Stored rows can include scans, measurements, check-ins, workout
                completions, weekly reviews, profile records, and subscription records.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Exports And Deletion</h2>
              <p>
                Authenticated exports include database records and short-lived signed links for stored scan photos so users can retrieve their own
                data. Users should be able to delete their cloud account and stored scan photos from the Account page. Deleting a cloud account is
                intended to remove scan rows, check-ins, workout completions, weekly reviews, subscription records, and stored scan photos tied to
                that account.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Payments</h2>
              <p>
                Payment details are handled by Stripe. PostureLab should not store raw card numbers, raw payment credentials, or bank details.
                Stripe can process subscription checkout, billing portal sessions, invoices, taxes when configured, fraud controls, and payment
                method updates.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Analytics And Hosting</h2>
              <p>
                PostureLab uses Vercel Web Analytics and Speed Insights to understand page traffic, browser performance, and launch reliability.
                These tools should not receive posture photos, pose landmarks, scan measurements, exported report content, raw payment details, or
                account deletion confirmations. Browser privacy tools, content blockers, and disabling JavaScript can limit analytics collection.
                Product analytics are for improving the app and are not used to generate posture findings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Launch Note</h2>
              <p>
                This policy is written for the product implementation in this repository and should receive legal review before charging users.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
