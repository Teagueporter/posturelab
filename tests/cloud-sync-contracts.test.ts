import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { scanImageUploadComplete } from "@/lib/storage/cloud";
import type { ScanAnalysis } from "@/lib/measurements/types";

describe("cloud sync contracts", () => {
  it("requires every captured scan photo to have an uploaded storage path before reporting sync success", () => {
    const scan = {
      frontImage: "data:image/jpeg;base64,front",
      leftSideImage: "data:image/jpeg;base64,left",
      rightSideImage: "data:image/jpeg;base64,right",
      backImage: "data:image/jpeg;base64,back",
    } as ScanAnalysis;

    expect(
      scanImageUploadComplete(scan, {
        front: "user/scan/front.jpg",
        leftSide: "user/scan/leftSide.jpg",
        rightSide: "user/scan/rightSide.jpg",
        back: "user/scan/back.jpg",
      }),
    ).toBe(true);
    expect(
      scanImageUploadComplete(scan, {
        front: "user/scan/front.jpg",
        leftSide: "user/scan/leftSide.jpg",
        back: "user/scan/back.jpg",
      }),
    ).toBe(false);
  });

  it("keeps image upload failures ahead of database scan upserts", () => {
    const cloudSource = readFileSync(path.join(process.cwd(), "src/lib/storage/cloud.ts"), "utf8");

    expect(cloudSource.indexOf("image-upload-failed")).toBeGreaterThan(-1);
    expect(cloudSource.indexOf("image-upload-failed")).toBeLessThan(cloudSource.indexOf('supabase.from("scans").upsert'));
  });

  it("keeps scan image deletion failures ahead of database scan deletes", () => {
    const cloudSource = readFileSync(path.join(process.cwd(), "src/lib/storage/cloud.ts"), "utf8");
    const listFailureIndex = cloudSource.indexOf('"image-list-failed"');
    const deleteFailureIndex = cloudSource.indexOf('"image-delete-failed"');
    const scanDeleteIndex = cloudSource.indexOf('supabase.from("scans").delete()');

    expect(listFailureIndex).toBeGreaterThan(-1);
    expect(deleteFailureIndex).toBeGreaterThan(listFailureIndex);
    expect(scanDeleteIndex).toBeGreaterThan(deleteFailureIndex);
  });
});
