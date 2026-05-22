"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS } from "@/lib/mockData";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Package, AlertTriangle } from "lucide-react";

export default function QaDashboard() {
  const currentUser = useAppStore((s) => s.currentUser);
  const batches = useAppStore((s) => s.batches);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "QA_EXEC" && currentUser.role !== "QA_MGR")) router.push("/login");
  }, [currentUser, router]);
  if (!currentUser) return null;

  const pendingSign = batchDocuments.filter((d) => d.status === "QC_APPROVED" || d.status === "AUTO_GENERATED");
  const signed = batchDocuments.filter((d) => d.status === "QA_SIGNED" || d.status === "ISSUED");
  const released = batches.filter((b) => b.released).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">QA {currentUser.role === "QA_MGR" ? "Manager" : "Executive"} Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard title="Pending My Signature" value={pendingSign.length} icon={Clock} color="#E8732C" highlight={pendingSign.length > 0} />
        <KPICard title="Signed" value={signed.length} icon={CheckCircle} color="#16A34A" />
        <KPICard title="Total Batches" value={batches.length} icon={Package} color="#1A8FA3" />
        <KPICard title="Released" value={released} icon={CheckCircle} color="#0D4F5C" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Pending My Signature</CardTitle></CardHeader>
        <CardContent>
          {pendingSign.length === 0 ? (
            <EmptyState title="No documents pending" description="All QC-approved documents have been signed" />
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium">Doc No.</th>
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Batch</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {pendingSign.map((doc) => {
                  const batch = batches.find((b) => b.id === doc.batchId);
                  const route = doc.docType === "SPEC" ? `/qa/specs/${doc.id}` : doc.docType === "MOA" ? `/qa/moas/${doc.id}` : doc.docType === "AWS" ? `/qa/aws/${doc.id}` : `/qa/coas/${doc.id}`;
                  return (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => router.push(route)}>
                      <td className="py-2.5 px-3 font-medium font-mono text-xs">{doc.docNo}</td>
                      <td className="py-2.5 px-3">{doc.docType}</td>
                      <td className="py-2.5 px-3">{batch?.batchNo || "—"}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={doc.status} /></td>
                      <td className="py-2.5 px-3"><Button variant="ghost" size="sm">Sign →</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
