import type { Metadata } from "next";

import { TPCLayout } from "@/components/tpc-layout";

export const metadata: Metadata = {
  title: "PlaceGuard AI | TPC Admin Dashboard",
  description:
    "Early warning intelligence for training and placement cells to detect risk, intervene earlier, and improve placement outcomes.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TPCLayout>{children}</TPCLayout>;
}
