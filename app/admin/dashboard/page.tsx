"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/utils";
import { Users, Package, Clock, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const batches = useAppStore((s) => s.batches);
  const auditLogs = useAppStore((s) => s.auditLogs);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);

  if (!currentUser) return null;

  const activeUsers = users.filter((u) => u.status === "Active").length;
  const pendingApprovals = batchDocuments.filter((d) => d.status === "SUBMITTED" || d.status === "QC_APPROVED").length;
  const recentLogs = auditLogs.slice(0, 12);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">System Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard title="Active Users" value={activeUsers} icon={Users} onClick={() => router.push("/admin/users")} />
        <KPICard title="Total Batches" value={batches.length} icon={Package} color="#1A8FA3" />
        <KPICard title="Pending Approvals" value={pendingApprovals} icon={Clock} color="#E8732C" highlight={pendingApprovals > 0} />
        <KPICard title="OOS Incidents" value={0} icon={AlertTriangle} color="#DC2626" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Audit Events</CardTitle></CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? <p className="text-sm text-muted-foreground">No events yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium">Time</th>
                  <th className="text-left py-2 px-3 font-medium">User</th>
                  <th className="text-left py-2 px-3 font-medium">Action</th>
                  <th className="text-left py-2 px-3 font-medium">Document</th>
                  <th className="text-left py-2 px-3 font-medium">Detail</th>
                </tr></thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-muted-foreground text-xs">{fmtDateTime(log.timestamp)}</td>
                      <td className="py-2 px-3">{log.userName}</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-muted">{log.action}</span></td>
                      <td className="py-2 px-3 text-xs">{log.docRef || log.docType}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{log.fieldChanged ? `${log.prevValue} → ${log.newValue}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
