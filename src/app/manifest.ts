import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PostureLab",
    short_name: "PostureLab",
    description: "Posture scans, progress tracking, and corrective exercise plans.",
    start_url: "/scan",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f4",
    theme_color: "#17211b",
    categories: ["health", "fitness", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
