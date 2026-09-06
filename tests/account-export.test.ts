import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { accountExportHeaders, createScanPhotoUrls, scanImagePathsFromRows, type ScanPhotoSigner } from "@/app/api/account/export/route";

const routeSource = readFileSync(path.join(process.cwd(), "src/app/api/account/export/route.ts"), "utf8");

describe("account export route", () => {
  it("marks exported account data as a download that should not be cached", () => {
    expect(accountExportHeaders(new Date("2026-09-06T12:00:00.000Z"))).toEqual({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="posturelab-data-2026-09-06.json"',
      Expires: "0",
      Pragma: "no-cache",
    });
  });

  it("keeps each user-owned table explicitly scoped to the signed-in user", () => {
    for (const table of ["scans", "check_ins", "workout_completions", "weekly_reviews", "subscriptions"]) {
      expect(routeSource).toContain(`from("${table}")`);
    }

    expect(routeSource.match(/\.eq\("user_id", user\.id\)/g)).toHaveLength(5);
  });

  it("exports signed scan photo URLs from user-scoped scan rows", () => {
    expect(routeSource).toContain("createSignedUrl(path, 60 * 60)");
    expect(routeSource).toContain("scanPhotoUrls");
  });

  it("creates signed scan photo URL maps for export payloads", async () => {
    const calls: string[] = [];
    const signer = fakeSigner(async (path, expiresIn) => {
      calls.push(`${path}:${expiresIn}`);
      return { data: { signedUrl: `https://signed.example/${path}` }, error: null };
    });

    await expect(
      createScanPhotoUrls(signer, [
        {
          view_image_paths: {
            front: "user-a/scan-1/front.jpg",
            leftSide: "user-a/scan-1/leftSide.jpg",
          },
        },
      ]),
    ).resolves.toEqual({
      "user-a/scan-1/front.jpg": "https://signed.example/user-a/scan-1/front.jpg",
      "user-a/scan-1/leftSide.jpg": "https://signed.example/user-a/scan-1/leftSide.jpg",
    });
    expect(calls).toEqual(["user-a/scan-1/front.jpg:3600", "user-a/scan-1/leftSide.jpg:3600"]);
  });

  it("fails the export when signed scan photo URLs cannot be created", () => {
    expect(routeSource).toContain("error || !data?.signedUrl");
    expect(routeSource).toContain('throw new Error("Unable to create signed scan photo export URL")');
    expect(routeSource).not.toContain("signedUrls.filter");
  });

  it("throws when Supabase cannot create a signed scan photo URL", async () => {
    const signer = fakeSigner(async () => ({ data: null, error: { message: "missing object" } }));

    await expect(
      createScanPhotoUrls(signer, [
        {
          view_image_paths: {
            front: "user-a/scan-1/front.jpg",
          },
        },
      ]),
    ).rejects.toThrow("Unable to create signed scan photo export URL");
  });

  it("collects unique scan image paths without trusting malformed row data", () => {
    expect(
      scanImagePathsFromRows([
        {
          view_image_paths: {
            front: "user-a/scan-1/front.jpg",
            leftSide: "user-a/scan-1/leftSide.jpg",
          },
        },
        {
          view_image_paths: {
            front: "user-a/scan-1/front.jpg",
            rightSide: "",
            back: null,
          },
        },
        {
          view_image_paths: ["not", "the", "stored", "shape"],
        },
      ]),
    ).toEqual(["user-a/scan-1/front.jpg", "user-a/scan-1/leftSide.jpg"]);
  });
});

function fakeSigner(
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>,
): ScanPhotoSigner {
  return {
    storage: {
      from(bucket) {
        expect(bucket).toBe("scan-images");
        return {
          createSignedUrl,
        };
      },
    },
  };
}
