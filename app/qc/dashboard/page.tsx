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
import { fmtDate } from "@/lib/utils";
import { FileEdit, Clock, AlertTriangle, CheckCircle, Plus, Package } from "lucide-react";

export default function QcDashboard() {
  const currentUser = useAppStore((s) => s.currentUser);
  const batches = useAppStore((s) => s.batches);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "QC_EXEC" && currentUser.role !== "QC_MGR")) router.push("/login");
  }, [currentUser, router]);
  if (!currentUser) return null;

  const isExec = currentUser.role === "QC_EXEC";

  if (isExec) {
    const myBatches = batches.filter((b) => b.createdBy === currentUser.id);
    const drafts = batchDocuments.filter((d) => d.status === "DRAFT" && d.createdBy === currentUser.id).length;
    const awaitingApproval = batchDocuments.filter((d) => d.status === "SUBMITTED" && d.createdBy === currentUser.id).length;
    const returned = batchDocuments.filter((d) => d.rejectionComments.length > 0 && d.status === "DRAFT" && d.createdBy === currentUser.id).length;
    const completed = batches.filter((b) => b.released && b.createdBy === currentUser.id).length;

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">QC Executive Dashboard</h1>
          <Button className="bg-brand-highlight hover:bg-brand-highlight/90" onClick={() => router.push("/qc/batch/new")}>
            <Plus className="w-4 h-4 mr-2" /> New Batch
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KPICard title="My Drafts" value={drafts} icon={FileEdit} color="#0D4F5C" />
          <KPICard title="Awaiting QC Mgr" value={awaitingApproval} icon={Clock} color="#1A8FA3" />
          <KPICard title="Returned" value={returned} icon={AlertTriangle} color="#DC2626" highlight={returned > 0} />
          <KPICard title="Completed" value={completed} icon={CheckCircle} color="#16A34A" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">My Active Batches</CardTitle></CardHeader>
          <CardContent>
            {myBatches.length === 0 ? (
              <EmptyState title="No batches yet" description="Start a new batch to begin the quality release process" action={{ label: "+ New Batch", onClick: () => router.push("/qc/batch/new") }} />
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium">Batch No.</th>
                  <th className="text-left py-2 px-3 font-medium">Product</th>
                  <th className="text-left py-2 px-3 font-medium">Current Phase</th>
                  <th className="text-left py-2 px-3 font-medium">Started</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium"></th>
                </tr></thead>
                <tbody>
                  {myBatches.map((b) => {
                    const product = SEED_PRODUCTS.find((p) => p.id === b.productId);
                    const currentDoc = batchDocuments.find((d) => d.batchId === b.id && d.docType === b.currentDocPhase);
                    return (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/qc/batch/${b.id}`)}>
                        <td className="py-2.5 px-3 font-medium">{b.batchNo}</td>
                        <td className="py-2.5 px-3">{product?.name || "—"}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">{b.currentDocPhase}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{fmtDate(b.createdAt)}</td>
                        <td className="py-2.5 px-3">{currentDoc && <StatusBadge status={currentDoc.status} />}</td>
                        <td className="py-2.5 px-3"><Button variant="ghost" size="sm">Open →</Button></td>
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

  // QC_MGR view
  const pendingDocs = batchDocuments.filter((d) => d.status === "SUBMITTED");
  const approvedDocs = batchDocuments.filter((d) => d.status === "QC_APPROVED");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">QC Manager Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard title="Pending My Approval" value={pendingDocs.length} icon={Clock} color="#E8732C" highlight={pendingDocs.length > 0} />
        <KPICard title="Approved (Awaiting QA)" value={approvedDocs.length} icon={CheckCircle} color="#16A34A" />
        <KPICard title="Total Batches" value={batches.length} icon={Package} color="#1A8FA3" />
        <KPICard title="Released" value={batches.filter((b) => b.released).length} icon={CheckCircle} color="#0D4F5C" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Pending My Approval</CardTitle></CardHeader>
        <CardContent>
          {pendingDocs.length === 0 ? (
            <EmptyState title="No documents pending" description="All documents have been reviewed" />
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
                {pendingDocs.map((doc) => {
                  const batch = batches.find((b) => b.id === doc.batchId);
                  const routePrefix = doc.docType === "SPEC" ? "/qc/specs" : doc.docType === "MOA" ? "/qc/moas" : "/qc/aws";
                  return (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`${routePrefix}/${doc.id}`)}>
                      <td className="py-2.5 px-3 font-medium font-mono text-xs">{doc.docNo}</td>
                      <td className="py-2.5 px-3">{doc.docType}</td>
                      <td className="py-2.5 px-3">{batch?.batchNo || "—"}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={doc.status} /></td>
                      <td className="py-2.5 px-3"><Button variant="ghost" size="sm">Review →</Button></td>
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
