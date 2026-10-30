import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CustomCursor } from "@/components/shared/CustomCursor";
import "./globals.css";
import "@/components/shared/site-chrome.css";

export const viewport: Viewport = {
  themeColor: "#05060b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Technotsav 2026–27 | Space × AI",
    template: "%s | Technotsav 2026–27",
  },
  description: "Technotsav 2026–27: Decoding Infinity. Defining Tomorrow. Annual Intercollegiate IT Festival featuring robotics, web development, coding, gaming, and design.",
  metadataBase: new URL("https://technotsav26-27.vercel.app"),
  openGraph: {
    title: "Technotsav 2026–27 | Space × AI",
    description: "Technotsav 2026–27: Decoding Infinity. Defining Tomorrow. Annual Intercollegiate IT Festival.",
    url: "https://technotsav26-27.vercel.app",
    siteName: "Technotsav 2026–27",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Technotsav 2026–27 | Space × AI",
    description: "Technotsav 2026–27: Decoding Infinity. Defining Tomorrow.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
