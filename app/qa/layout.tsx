"use client";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
export default function QaLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
