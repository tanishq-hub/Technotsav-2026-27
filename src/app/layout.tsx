import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CustomCursor } from "@/components/shared/CustomCursor";
import "./globals.css";
import "@/components/shared/site-chrome.css";

export const metadata: Metadata = {
  title: "Technotsav 2026–27 | Space × AI",
  description: "Technotsav 2026–27: Decoding Infinity. Defining Tomorrow.",
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
