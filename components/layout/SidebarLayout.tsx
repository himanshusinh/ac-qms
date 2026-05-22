"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FlaskConical, LayoutDashboard, Users, ScrollText, Plus, LogOut, RotateCcw } from "lucide-react";
import type { Role } from "@/types";

interface NavItem { label: string; href: string; icon: React.ReactNode; }

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case "SADMIN":
      return [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
        { label: "Audit Log", href: "/admin/audit-log", icon: <ScrollText className="w-4 h-4" /> },
      ];
    case "QC_EXEC":
      return [
        { label: "Dashboard", href: "/qc/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "New Batch", href: "/qc/batch/new", icon: <Plus className="w-4 h-4" /> },
      ];
    case "QC_MGR":
      return [
        { label: "Dashboard", href: "/qc/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      ];
    case "QA_EXEC":
    case "QA_MGR":
      return [
        { label: "Dashboard", href: "/qa/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      ];
    default:
      return [];
  }
}

function getRoleColor(role: Role): string {
  if (role === "SADMIN") return "#6366F1";
  if (role.startsWith("QC")) return "#2E7D32";
  return "#1565C0";
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const resetDemoData = useAppStore((s) => s.resetDemoData);

  if (!currentUser) return <>{children}</>;

  const navItems = getNavItems(currentUser.role);
  const roleColor = getRoleColor(currentUser.role);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className="w-64 text-white flex flex-col shrink-0 sticky top-0 h-screen"
        style={{ backgroundColor: "var(--color-brand-primary)" }}
      >
        {/* Brand */}
        <div className="px-[var(--space-standard)] py-[var(--space-standard)] flex items-center gap-[var(--space-compact)]">
          <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center shadow-sm">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">AC-QMS</p>
            <p className="text-[12px] text-white/70">Aditya Chemicals</p>
          </div>
        </div>
        <Separator className="bg-white/6" />

        {/* FY Badge */}
        <div className="px-[var(--space-standard)] py-[var(--space-compact)]">
          <Badge className="bg-white/6 text-white/90 border-white/10 text-[11px]">
            FY 2026–27
          </Badge>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-[var(--space-standard)] mt-[var(--space-compact)] space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full relative flex items-center gap-[var(--space-standard)] px-[var(--space-control)] py-[8px] rounded-lg text-sm font-medium transition-all text-left",
                  active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex-none text-white/90">
                  {React.isValidElement(item.icon)
                    ? React.cloneElement(item.icon, { className: "w-5 h-5" })
                    : item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1.5 rounded-r-full bg-white/80" aria-hidden />}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-[var(--space-standard)] pb-[var(--space-large)] space-y-2">
          {currentUser.role === "SADMIN" && (
            <button
              onClick={() => { resetDemoData(); router.push("/login"); }}
              className="w-full flex items-center gap-3 px-[var(--space-control)] py-[8px] rounded-lg text-xs text-white/60 hover:text-white/90 hover:bg-white/3 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset Demo Data
            </button>
          )}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-[var(--space-control)] py-[8px] rounded-lg text-xs text-white/70 hover:text-white/95 hover:bg-white/3 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-white/6 px-[var(--space-standard)] py-[var(--space-compact)]">
          <div className="flex items-center gap-[var(--space-compact)]">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: roleColor }}
            >
              {currentUser.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-[12px] text-white/70">{currentUser.role.replace("_", " ")} · {currentUser.department}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[var(--color-brand-subtle)] min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
