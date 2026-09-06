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
            <h1 className="mt-2 text-4xl font-semibold">Privacy policy draft</h1>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-[#516156]">
            <p>
              PostureLab uses posture photos, pose landmarks, measurements, check-ins, and workout completions to provide self-tracking and exercise-plan features.
            </p>
            <p>
              When cloud sync is configured, scan photos are stored in a private Supabase Storage bucket and user data is stored in user-owned Supabase rows protected by row-level security.
            </p>
            <p>
              If you are not signed in, scans are kept in this browser&apos;s local storage. Clearing browser data can remove local scan history.
            </p>
            <p>
              Authenticated exports include database records and short-lived signed links for stored scan photos so users can retrieve their own data.
            </p>
            <p>
              Payment details are handled by Stripe. PostureLab should not store raw card numbers or payment credentials.
            </p>
            <p>
              PostureLab uses Vercel Web Analytics and Speed Insights to understand page traffic, browser performance, and launch reliability.
              These tools should not receive posture photos, pose landmarks, scan measurements, exported report content, raw payment details, or
              account deletion confirmations.
            </p>
            <p>
              Browser privacy tools, content blockers, and disabling JavaScript can limit analytics collection. Product analytics are for improving
              the app and are not used to generate posture findings.
            </p>
            <p>
              Users should be able to delete their cloud account and stored scan photos from the Account page. This draft needs legal review before public launch.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
