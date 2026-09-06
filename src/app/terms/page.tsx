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
            <h1 className="mt-2 text-4xl font-semibold">Terms draft</h1>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-[#516156]">
            <p>
              PostureLab is a wellness and self-tracking tool. It estimates posture-photo measurements from detected landmarks and does not diagnose, treat, or prevent medical conditions.
            </p>
            <p>
              Exercise guidance is general education. Stop any exercise that causes concerning symptoms and seek qualified clinical care for pain, neurological symptoms, trauma, or worsening function.
            </p>
            <p>
              Paid subscriptions are managed by Stripe. Users can manage billing from the Account page when Stripe is configured.
            </p>
            <p>
              This draft needs legal review before public launch.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
