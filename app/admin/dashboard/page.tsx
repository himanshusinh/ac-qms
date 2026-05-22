"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Users, ShieldAlert, LockKeyhole, Power, Clock3, Activity, Building2, BadgeCheck, UserCog } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { KPICard } from "@/components/shared/KPICard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/utils";

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const width = total === 0 ? 0 : Math.max(8, Math.round((value / total) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const batches = useAppStore((state) => state.batches);
  const auditLogs = useAppStore((state) => state.auditLogs);
  const batchDocuments = useAppStore((state) => state.batchDocuments);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);

  const dashboard = useMemo(() => {
    const snapshot = new Date();
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "Active").length;
    const suspendedUsers = users.filter((user) => user.status === "Suspended").length;
    const lockedUsers = users.filter((user) => user.status === "Locked").length;
    const failedAttempts = users.reduce((sum, user) => sum + (user.failedLoginAttempts || 0), 0);
    const recentLogins = auditLogs.filter((log) => log.action === "LOGIN").slice(0, 6);
    const recentActivity = auditLogs.slice(0, 8);
    const newUsers30d = users.filter((user) => {
      if (!user.createdAt) return false;
      return snapshot.getTime() - new Date(user.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const departmentCounts = users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.department] = (accumulator[user.department] || 0) + 1;
      return accumulator;
    }, {});
    const roleCounts = users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] || 0) + 1;
      return accumulator;
    }, {});
    const submittedDocs = batchDocuments.filter((doc) => doc.status === "SUBMITTED" || doc.status === "QC_APPROVED").length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      lockedUsers,
      failedAttempts,
      recentLogins,
      recentActivity,
      newUsers30d,
      departmentCounts,
      roleCounts,
      submittedDocs,
    };
  }, [auditLogs, batchDocuments, users]);

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ShieldAlert className="w-4 h-4 text-brand-primary" />
            Enterprise Admin Command Center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">System Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Monitor account health, failed sign-ins, audit activity, and role distribution across the AC-QMS demo environment.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-white">{batches.length} batches</Badge>
          <Badge variant="outline" className="bg-white">{dashboard.submittedDocs} docs awaiting review</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KPICard title="Total Users" value={dashboard.totalUsers} icon={Users} onClick={() => router.push("/admin/users")} />
        <KPICard title="Active Users" value={dashboard.activeUsers} icon={Power} color="#0F766E" onClick={() => router.push("/admin/users?status=Active")} />
        <KPICard title="Suspended" value={dashboard.suspendedUsers} icon={ShieldAlert} color="#B45309" onClick={() => router.push("/admin/users?status=Suspended")} />
        <KPICard title="Locked" value={dashboard.lockedUsers} icon={LockKeyhole} color="#B91C1C" onClick={() => router.push("/admin/users?status=Locked")} />
        <KPICard title="Failed Attempts" value={dashboard.failedAttempts} icon={Activity} color="#7C3AED" />
        <KPICard title="New Users (30d)" value={dashboard.newUsers30d} icon={BadgeCheck} color="#1D4ED8" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" /> Audit Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit activity yet.</p>
            ) : (
              dashboard.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 rounded-xl border bg-slate-50/70 p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-white">{log.action}</Badge>
                      <span className="text-sm font-medium">{log.userName}</span>
                      <span className="text-xs text-muted-foreground">{log.docRef || log.docType}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.comment || log.reason || log.fieldChanged || "No additional detail"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-brand-primary" /> Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentLogins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No login activity captured.</p>
            ) : (
              dashboard.recentLogins.map((log) => (
                <div key={log.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{log.userName}</p>
                    <Badge variant="outline" className="bg-white">{log.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary" /> Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(dashboard.departmentCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No departments found.</p>
            ) : (
              Object.entries(dashboard.departmentCounts).map(([department, count]) => (
                <Bar key={department} label={department} value={count} total={dashboard.totalUsers} tone="#0D4F5C" />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-4 h-4 text-brand-primary" /> Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(dashboard.roleCounts).map(([role, count]) => (
              <Bar key={role} label={role.replace("_", " ")} value={count} total={dashboard.totalUsers} tone="#E8732C" />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" /> User Lifecycle Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{dashboard.activeUsers}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Suspended</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{dashboard.suspendedUsers}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Locked</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">{dashboard.lockedUsers}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Audit events</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{auditLogs.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
