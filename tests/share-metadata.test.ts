import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import { alt, contentType, size } from "@/app/opengraph-image";

describe("share metadata", () => {
  it("defines canonical app metadata for link previews", () => {
    expect(metadata.metadataBase).toEqual(new URL("http://localhost:3000"));
    expect(metadata.alternates).toMatchObject({ canonical: "/" });
    expect(metadata.openGraph).toMatchObject({
      title: "PostureLab",
      description: "Posture scans, progress tracking, and corrective exercise plans.",
      url: "/",
      siteName: "PostureLab",
      type: "website",
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PostureLab posture scan and corrective exercise tracking",
      },
    ]);
  });

  it("uses the generated social preview image for Twitter-style cards", () => {
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "PostureLab",
      description: "Posture scans, progress tracking, and corrective exercise plans.",
      images: ["/opengraph-image"],
    });
  });

  it("exports a generated Open Graph image contract", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toBe("PostureLab posture scan and corrective exercise tracking");
  });
});
