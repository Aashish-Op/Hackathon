import type { Metadata } from "next";
import { DM_Serif_Display, Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Vigilo | Placement Intelligence for TPCs",
  description:
    "Vigilo helps Training & Placement Cells detect student placement risk early, automate interventions, and improve outcomes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${geist.variable} ${dmSerifDisplay.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)] font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
