"use client";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
export default function QcLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
