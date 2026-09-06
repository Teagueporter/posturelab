import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

const marketingRoutes = ["/", "/scan", "/plan", "/report", "/measurements", "/pricing", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl();
  const lastModified = new Date("2026-09-06T00:00:00.000Z");

  return marketingRoutes.map((route) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/scan" ? 0.9 : 0.7,
  }));
}
