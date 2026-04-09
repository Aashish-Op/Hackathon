import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlaceGuard AI — No Student Gets Left Behind",
  description:
    "AI-powered Early Warning System that detects at-risk students who are likely to miss campus placements. Predict, segment, intervene — before it's too late.",
  keywords: [
    "placement prediction",
    "AI placement",
    "campus placement",
    "student risk detection",
    "TPC dashboard",
    "PlaceGuard",
  ],
  openGraph: {
    title: "PlaceGuard AI — No Student Gets Left Behind",
    description:
      "AI-powered Early Warning System for campus placements. Detects silent drop-outs before it's too late.",
    type: "website",
    locale: "en_US",
    siteName: "PlaceGuard AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlaceGuard AI — No Student Gets Left Behind",
    description:
      "AI-powered Early Warning System for campus placements.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
