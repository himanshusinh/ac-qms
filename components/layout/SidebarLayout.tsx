"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  FlaskConical, LayoutDashboard, Users, ScrollText, Plus, FileText,
  ClipboardCheck, Shield, LogOut, RotateCcw, Beaker, FileCheck,
} from "lucide-react";
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
      <aside className="w-60 bg-[#0D2B33] text-white flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">AC-QMS</p>
            <p className="text-[10px] text-white/50">Aditya Chemicals</p>
          </div>
        </div>
        <Separator className="bg-white/10" />

        {/* FY Badge */}
        <div className="px-5 py-3">
          <Badge className="bg-brand-highlight/20 text-brand-highlight border-brand-highlight/30 text-[10px]">
            FY 2026–27
          </Badge>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white/90"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1">
          {currentUser.role === "SADMIN" && (
            <button
              onClick={() => { resetDemoData(); router.push("/login"); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
            </button>
          )}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: roleColor }}>
              {currentUser.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-white/50">{currentUser.role.replace("_", " ")} · {currentUser.department}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-brand-subtle min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
