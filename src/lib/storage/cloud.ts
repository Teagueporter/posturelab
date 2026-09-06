"use client";

import { buildBodyFindings } from "@/lib/interpretation/body-findings";
import { buildTrackingScore } from "@/lib/interpretation/scan-summary";
import type { WeeklyProgressReview } from "@/lib/interpretation/scan-summary";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json } from "@/lib/supabase/database";
import type { CheckIn } from "@/lib/storage/checkins";
import type { WorkoutCompletion } from "@/lib/storage/workouts";

type ScanView = "front" | "leftSide" | "rightSide" | "back";

const scanViews: ScanView[] = ["front", "leftSide", "rightSide", "back"];

export async function syncScanToCloud(scan: ScanAnalysis) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { synced: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { synced: false, reason: "not-signed-in" as const };

  const viewImagePaths: Partial<Record<ScanView, string>> = {};
  for (const view of scanViews) {
    const image = scan[`${view}Image`];
    if (!image) continue;
    const path = await uploadScanImage(user.id, scan.id, view, image);
    if (path) viewImagePaths[view] = path;
  }

  if (!scanImageUploadComplete(scan, viewImagePaths)) {
    return { synced: false, reason: "image-upload-failed" as const };
  }

  const { error } = await supabase.from("scans").upsert(
    {
      id: scan.id,
      user_id: user.id,
      captured_at: scan.createdAt,
      status: "complete",
      quality: scan.quality as unknown as Json,
      summary: buildTrackingScore(scan) as unknown as Json,
      pose_results: {
        front: scan.front,
        leftSide: scan.leftSide,
        rightSide: scan.rightSide,
        back: scan.back,
      } as unknown as Json,
      view_image_paths: viewImagePaths as Json,
      measurements: scan.measurements as unknown as Json,
      body_findings: buildBodyFindings(scan) as unknown as Json,
    },
    { onConflict: "id" },
  );

  return error ? { synced: false, reason: "write-failed" as const } : { synced: true as const };
}

export async function listCloudScans() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];

  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return [];

  const { data, error } = await supabase
    .from("scans")
    .select("id,captured_at,quality,pose_results,view_image_paths,measurements")
    .order("captured_at", { ascending: false });

  if (error || !data) return [];

  const scans = await Promise.all(
    data.map(async (row) => {
      const poseResults = row.pose_results as Partial<Record<ScanView, unknown>>;
      const imagePaths = row.view_image_paths as Partial<Record<ScanView, string>>;
      if (!poseResults.front || !poseResults.leftSide || !poseResults.rightSide || !poseResults.back) return null;

      const images = await getSignedScanImages(imagePaths);
      return {
        id: row.id,
        createdAt: row.captured_at,
        front: poseResults.front,
        leftSide: poseResults.leftSide,
        rightSide: poseResults.rightSide,
        back: poseResults.back,
        frontImage: images.front,
        leftSideImage: images.leftSide,
        rightSideImage: images.rightSide,
        backImage: images.back,
        measurements: row.measurements,
        quality: row.quality,
      } as ScanAnalysis;
    }),
  );

  return scans.filter((scan): scan is ScanAnalysis => Boolean(scan));
}

export async function hydrateLocalScansFromCloud(existingScans: ScanAnalysis[]) {
  const cloudScans = await listCloudScans();
  if (!cloudScans.length) return existingScans;

  const byId = new Map(existingScans.map((scan) => [scan.id, scan]));
  for (const scan of cloudScans) {
    byId.set(scan.id, scan);
  }

  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteScanFromCloud(scanId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { deleted: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { deleted: false, reason: "not-signed-in" as const };

  const folder = `${user.id}/${scanId}`;
  const { data: files, error: listError } = await supabase.storage.from("scan-images").list(folder, { limit: 20 });
  if (listError) return { deleted: false, reason: "image-list-failed" as const };

  const imagePaths = (files ?? []).map((file) => `${folder}/${file.name}`);
  if (imagePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from("scan-images").remove(imagePaths);
    if (removeError) return { deleted: false, reason: "image-delete-failed" as const };
  }

  const { error } = await supabase.from("scans").delete().eq("id", scanId).eq("user_id", user.id);
  return error ? { deleted: false, reason: "delete-failed" as const } : { deleted: true as const };
}

export async function syncCheckInToCloud(checkIn: CheckIn) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { synced: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { synced: false, reason: "not-signed-in" as const };

  const { error } = await supabase.from("check_ins").upsert(
    {
      id: checkIn.id,
      user_id: user.id,
      check_in_date: checkIn.date,
      discomfort: checkIn.discomfort,
      posture_control: checkIn.postureControl,
      energy: checkIn.energy,
      red_flags: checkIn.redFlags,
      notes: checkIn.notes,
      created_at: checkIn.createdAt,
    },
    { onConflict: "user_id,check_in_date" },
  );

  return error ? { synced: false, reason: "write-failed" as const } : { synced: true as const };
}

export async function listCloudCheckIns() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];

  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return [];

  const { data, error } = await supabase
    .from("check_ins")
    .select("id,check_in_date,discomfort,posture_control,energy,red_flags,notes,created_at")
    .order("check_in_date", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    date: row.check_in_date,
    discomfort: row.discomfort,
    postureControl: row.posture_control,
    energy: row.energy,
    redFlags: row.red_flags,
    notes: row.notes,
    createdAt: row.created_at,
  })) satisfies CheckIn[];
}

export async function hydrateLocalCheckInsFromCloud(existingCheckIns: CheckIn[]) {
  const cloudCheckIns = await listCloudCheckIns();
  if (!cloudCheckIns.length) return existingCheckIns;

  const byDate = new Map(existingCheckIns.map((checkIn) => [checkIn.date, checkIn]));
  for (const checkIn of cloudCheckIns) {
    byDate.set(checkIn.date, checkIn);
  }

  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export async function syncWorkoutCompletionToCloud(completion: WorkoutCompletion) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { synced: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { synced: false, reason: "not-signed-in" as const };

  const { error } = await supabase.from("workout_completions").upsert(
    {
      id: completion.id,
      user_id: user.id,
      completion_date: completion.date,
      item_name: completion.itemName,
      completed_at: completion.completedAt,
    },
    { onConflict: "user_id,completion_date,item_name" },
  );

  return error ? { synced: false, reason: "write-failed" as const } : { synced: true as const };
}

export async function listCloudWorkoutCompletions() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];

  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return [];

  const { data, error } = await supabase
    .from("workout_completions")
    .select("id,completion_date,item_name,completed_at")
    .order("completed_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    date: row.completion_date,
    itemName: row.item_name,
    completedAt: row.completed_at,
  })) satisfies WorkoutCompletion[];
}

export async function hydrateLocalWorkoutCompletionsFromCloud(existingCompletions: WorkoutCompletion[]) {
  const cloudCompletions = await listCloudWorkoutCompletions();
  if (!cloudCompletions.length) return existingCompletions;

  const byKey = new Map(existingCompletions.map((completion) => [`${completion.date}:${completion.itemName}`, completion]));
  for (const completion of cloudCompletions) {
    byKey.set(`${completion.date}:${completion.itemName}`, completion);
  }

  return Array.from(byKey.values()).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function deleteWorkoutCompletionFromCloud(itemName: string, date: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { deleted: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { deleted: false, reason: "not-signed-in" as const };

  const { error } = await supabase
    .from("workout_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("completion_date", date)
    .eq("item_name", itemName);

  if (error) return { deleted: false, reason: "delete-failed" as const };

  return { deleted: true as const };
}

export async function syncWeeklyReviewToCloud(weekStart: string, summary: WeeklyProgressReview) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { synced: false, reason: "not-configured" as const };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { synced: false, reason: "not-signed-in" as const };

  const { error } = await supabase.from("weekly_reviews").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      summary: summary as unknown as Json,
    },
    { onConflict: "user_id,week_start" },
  );

  return error ? { synced: false, reason: "write-failed" as const } : { synced: true as const };
}

async function uploadScanImage(userId: string, scanId: string, view: ScanView, image: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase || !image.startsWith("data:image/")) return null;

  try {
    const blob = await fetch(image).then((response) => response.blob());
    const extension = mimeExtension(blob.type);
    const path = `${userId}/${scanId}/${view}.${extension}`;
    const { error } = await supabase.storage.from("scan-images").upload(path, blob, {
      cacheControl: "3600",
      contentType: blob.type,
      upsert: true,
    });

    return error ? null : path;
  } catch {
    return null;
  }
}

export function scanImageUploadComplete(scan: ScanAnalysis, paths: Partial<Record<ScanView, string>>) {
  return scanViews.every((view) => !scan[`${view}Image`] || Boolean(paths[view]));
}

async function getSignedScanImages(paths: Partial<Record<ScanView, string>>) {
  const supabase = createSupabaseBrowserClient();
  const images: Partial<Record<ScanView, string>> = {};
  if (!supabase) return images;

  await Promise.all(
    scanViews.map(async (view) => {
      const path = paths[view];
      if (!path) return;
      const { data } = await supabase.storage.from("scan-images").createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) images[view] = data.signedUrl;
    }),
  );

  return images;
}

function mimeExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
