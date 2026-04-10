import type { Metadata } from "next";

import { StudentLayout } from "@/components/student-layout";

export const metadata: Metadata = {
  title: "PlaceGuard AI | Student Portal",
  description:
    "A personal placement journey dashboard with AI guidance, progress tracking, and action plans.",
};

export default function StudentRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StudentLayout>{children}</StudentLayout>;
}
