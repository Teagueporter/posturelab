import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database";
import { logRouteDone, logRouteError, logRouteStart, routeLogContext } from "@/lib/observability/logging";

export const runtime = "nodejs";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

export function accountExportHeaders(date = new Date()) {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `attachment; filename="posturelab-data-${date.toISOString().slice(0, 10)}.json"`,
    Expires: "0",
    Pragma: "no-cache",
  };
}

export async function GET(request: Request) {
  const context = routeLogContext("/api/account/export", request);
  logRouteStart(context);

  try {
    const user = await getCurrentUser();
    if (!user) {
      logRouteDone(context, 401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      logRouteDone(context, 503);
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const [profile, scans, checkIns, workoutCompletions, weeklyReviews, subscription] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("scans").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }),
      supabase.from("check_ins").select("*").eq("user_id", user.id).order("check_in_date", { ascending: false }),
      supabase.from("workout_completions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
      supabase.from("weekly_reviews").select("*").eq("user_id", user.id).order("week_start", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("status,price_id,current_period_end,cancel_at_period_end,created_at,updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const failed = [profile, scans, checkIns, workoutCompletions, weeklyReviews, subscription].find((result) => result.error);
    if (failed?.error) {
      logRouteError(context, failed.error, 500);
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    const scanPhotoUrls = await createScanPhotoUrls(supabase, scans.data ?? []);
    logRouteDone(context, 200, {
      checkIns: checkIns.data?.length ?? 0,
      scans: scans.data?.length ?? 0,
      weeklyReviews: weeklyReviews.data?.length ?? 0,
      workoutCompletions: workoutCompletions.data?.length ?? 0,
    });

    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profile.data,
        scans: scans.data,
        checkIns: checkIns.data,
        workoutCompletions: workoutCompletions.data,
        weeklyReviews: weeklyReviews.data,
        subscription: subscription.data,
        scanPhotoUrls,
      },
      {
        headers: accountExportHeaders(),
      },
    );
  } catch (error) {
    logRouteError(context, error);
    return NextResponse.json({ error: "Unable to export account data" }, { status: 500 });
  }
}

export function scanImagePathsFromRows(scans: Pick<ScanRow, "view_image_paths">[]) {
  const paths = new Set<string>();

  for (const scan of scans) {
    const imagePaths = scan.view_image_paths;
    if (!imagePaths || typeof imagePaths !== "object" || Array.isArray(imagePaths)) continue;
    for (const value of Object.values(imagePaths)) {
      if (typeof value === "string" && value.trim()) {
        paths.add(value);
      }
    }
  }

  return Array.from(paths).sort();
}

async function createScanPhotoUrls(supabase: SupabaseServerClient, scans: Pick<ScanRow, "view_image_paths">[]) {
  const paths = scanImagePathsFromRows(scans);
  const signedUrls = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from("scan-images").createSignedUrl(path, 60 * 60);
      return data?.signedUrl ? [path, data.signedUrl] : null;
    }),
  );

  return Object.fromEntries(signedUrls.filter((entry): entry is [string, string] => Boolean(entry)));
}
