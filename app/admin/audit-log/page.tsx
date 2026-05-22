"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/utils";

export default function AuditLogPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const auditLogs = useAppStore((s) => s.auditLogs);
  const router = useRouter();
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);
  if (!currentUser) return null;

  const filtered = filter ? auditLogs.filter((l) => l.action.includes(filter) || l.docType.includes(filter) || l.userName.toLowerCase().includes(filter.toLowerCase())) : auditLogs;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="flex gap-2">
          <input className="border rounded-md px-3 py-1.5 text-sm w-64" placeholder="Search by user, action, or doc type..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Button variant="outline" size="sm" onClick={() => toast.success("CSV export triggered (mock)")}>Export CSV</Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10"><tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium">Timestamp</th>
                <th className="text-left py-2 px-3 font-medium">User</th>
                <th className="text-left py-2 px-3 font-medium">Role</th>
                <th className="text-left py-2 px-3 font-medium">Action</th>
                <th className="text-left py-2 px-3 font-medium">Doc Type</th>
                <th className="text-left py-2 px-3 font-medium">Reference</th>
                <th className="text-left py-2 px-3 font-medium">Change</th>
              </tr></thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.timestamp)}</td>
                    <td className="py-2 px-3">{log.userName}</td>
                    <td className="py-2 px-3 text-xs">{log.role}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${log.action === "REJECT" ? "bg-red-100 text-red-700" : log.action.includes("APPROVE") || log.action.includes("SIGN") ? "bg-green-100 text-green-700" : "bg-muted"}`}>{log.action}</span></td>
                    <td className="py-2 px-3 text-xs">{log.docType}</td>
                    <td className="py-2 px-3 text-xs font-mono">{log.docRef || "—"}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{log.fieldChanged ? `${log.prevValue} → ${log.newValue}` : log.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { toast } from "sonner";
