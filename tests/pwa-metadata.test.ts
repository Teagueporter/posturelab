import { describe, expect, it } from "vitest";
import { metadata, viewport } from "@/app/layout";
import manifest from "@/app/manifest";
import { contentType, size } from "@/app/icon";
import { contentType as appleContentType, size as appleSize } from "@/app/apple-icon";

describe("web app install metadata", () => {
  it("defines standalone manifest settings for the web-first app", () => {
    expect(manifest()).toMatchObject({
      name: "PostureLab",
      short_name: "PostureLab",
      start_url: "/scan",
      scope: "/",
      display: "standalone",
      background_color: "#f6f8f4",
      theme_color: "#17211b",
    });
  });

  it("advertises install icons in the manifest", () => {
    expect(manifest().icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon", sizes: "512x512", type: "image/png" }),
        expect.objectContaining({ src: "/apple-icon", sizes: "180x180", type: "image/png" }),
      ]),
    );
  });

  it("sets app-level metadata and theme color", () => {
    expect(metadata.applicationName).toBe("PostureLab");
    expect(metadata.description).toBe("Posture scans, progress tracking, and corrective exercise plans.");
    expect(metadata.appleWebApp).toMatchObject({
      capable: true,
      title: "PostureLab",
    });
    expect(viewport.themeColor).toBe("#17211b");
  });

  it("generates a large PNG app icon", () => {
    expect(size).toEqual({ width: 512, height: 512 });
    expect(contentType).toBe("image/png");
  });

  it("generates an Apple touch icon at the advertised size", () => {
    expect(appleSize).toEqual({ width: 180, height: 180 });
    expect(appleContentType).toBe("image/png");
  });
});
