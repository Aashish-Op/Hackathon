import { TPCLayout } from "@/components/tpc-layout";

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TPCLayout>{children}</TPCLayout>;
}
