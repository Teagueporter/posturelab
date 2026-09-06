import Link from "next/link";
import { Activity, ArrowLeft, Mail } from "lucide-react";
import { signInWithEmail } from "@/app/login/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { safeNextPath } from "@/lib/auth/redirects";
import { hasSupabaseBrowserEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext);
  const authReady = hasSupabaseBrowserEnv();

  return (
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-[#17211b]">
      <div className="mx-auto w-full max-w-md space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#476153]">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#237a57]">
              <Activity className="h-5 w-5" />
              PostureLab
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Sign in</h1>
              <p className="mt-2 text-sm leading-6 text-[#5e6f64]">
                Use a magic link to save scans, sync progress, and manage your subscription.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {authReady ? (
              <form action={signInWithEmail} className="space-y-4">
                <input type="hidden" name="next" value={next} />
                <label className="block text-sm font-semibold">
                  Email
                  <input
                    className="mt-2 h-12 w-full rounded-md border border-[#cfd8d1] bg-white px-3 text-base outline-none transition focus:border-[#237a57]"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
                <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white transition hover:bg-[#24342b]">
                  <Mail className="h-4 w-4" />
                  Send sign-in link
                </button>
              </form>
            ) : (
              <div className="rounded-md border border-[#e7d3a3] bg-[#fff8e8] p-4 text-sm leading-6 text-[#6d5524]">
                Sign-in is not live yet. Supabase auth needs to be configured before cloud sync, exports, billing, and saved account data turn on.
              </div>
            )}
            {message ? (
              <p className="mt-4 rounded-md border border-[#d8ded7] bg-[#fbfcfa] p-3 text-sm leading-6 text-[#516156]">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
