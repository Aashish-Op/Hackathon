import { TPCLayout } from "@/components/tpc-layout";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TPCLayout>{children}</TPCLayout>;
}
