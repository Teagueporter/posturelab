import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

const appUrl = getAppUrl();
const appDescription = "Posture scans, progress tracking, and corrective exercise plans.";

export const metadata: Metadata = {
  title: "PostureLab",
  description: appDescription,
  metadataBase: new URL(appUrl),
  applicationName: "PostureLab",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PostureLab",
    description: appDescription,
    url: "/",
    siteName: "PostureLab",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PostureLab posture scan and corrective exercise tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PostureLab",
    description: appDescription,
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PostureLab",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#17211b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
