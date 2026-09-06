import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TermsPage() {
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
              <FileText className="h-4 w-4" />
              Terms
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Terms of service</h1>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-6 text-[#516156]">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Wellness Scope</h2>
              <p>
                PostureLab is a wellness and self-tracking tool. It estimates posture-photo measurements from detected landmarks and does not
                diagnose, treat, cure, or prevent medical conditions. Results can be affected by lighting, camera angle, clothing, landmark quality,
                device placement, and photo setup consistency.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Exercise Guidance</h2>
              <p>
                Exercise guidance is general education and should be scaled to the user&apos;s ability, symptoms, and training history. Stop any
                exercise that causes concerning symptoms and seek qualified clinical care for pain, neurological symptoms, trauma, dizziness,
                numbness, weakness, or worsening function.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Accounts And Cloud Data</h2>
              <p>
                Local scans can be used without an account. Cloud sync, data export, account deletion, paid entitlements, and subscription state
                require Supabase to be configured and a user to be signed in. Users are responsible for keeping sign-in links and account access
                secure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Subscriptions</h2>
              <p>
                Paid subscriptions are managed by Stripe. Users can manage billing, payment methods, and cancellation from the Account page when
                Stripe is configured. Taxes, invoices, refunds, disputes, and payment failures may be handled through Stripe according to the final
                business and legal policies chosen before launch.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Acceptable Use</h2>
              <p>
                Users should not upload photos they do not have permission to use, attempt to access another user&apos;s data, interfere with service
                security, abuse billing flows, scrape private endpoints, or use PostureLab as emergency, diagnostic, clinical, or regulated medical
                software.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[#17211b]">Launch Note</h2>
              <p>
                These terms are written for the product implementation in this repository and should receive legal review before charging users.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
