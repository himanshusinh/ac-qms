"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS, SEED_SPEC_TEMPLATES } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { RejectModal } from "@/components/shared/RejectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle, FlaskConical } from "lucide-react";

export default function SpecReviewPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "QC_MGR" && currentUser.role !== "QC_EXEC")) router.push("/login");
  }, [currentUser, router]);

  const doc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (doc ? batches.find((b) => b.id === doc.batchId) : undefined), [doc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const template = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const isMgr = currentUser?.role === "QC_MGR";

  if (!currentUser || !doc || !batch || !product || !template) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;

  const activeTests = template.testParameters.filter((tp) => tp.mandatory || batch.optionalTestsActivated.includes(tp.id));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push(isMgr ? "/qc/dashboard" : `/qc/batch/${batch.id}`)}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2"><h1 className="text-xl font-bold">{doc.docNo}</h1><StatusBadge status={doc.status} size="md" /></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
                <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{batch.batchNo}</span></div>
                <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">{template.version}</span></div>
                <div><span className="text-muted-foreground">Tests:</span> <span className="font-medium">{activeTests.length}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Test Parameters</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">Sr.</th>
              <th className="text-left py-2 px-3 font-medium">Test</th>
              <th className="text-left py-2 px-3 font-medium">Type</th>
              <th className="text-left py-2 px-3 font-medium">Acceptance Criteria / Limits</th>
              <th className="text-left py-2 px-3 font-medium">UoM</th>
              <th className="text-left py-2 px-3 font-medium">Category</th>
            </tr></thead>
            <tbody>
              {activeTests.map((tp, i) => (
                <tr key={tp.id} className="border-b last:border-0">
                  <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{tp.name}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]">{tp.resultType}</Badge></td>
                  <td className="py-2 px-3">
                    {tp.resultType === "Qualitative" ? tp.acceptanceCriteria : tp.operator === "Between" ? `${tp.minValue} – ${tp.maxValue}` : tp.operator === "NMT" ? `NMT ${tp.maxValue}` : `NLT ${tp.minValue}`}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{tp.uom || "—"}</td>
                  <td className="py-2 px-3">{tp.mandatory ? <Badge className="bg-brand-primary/10 text-brand-primary text-[10px] border-0">Mandatory</Badge> : <Badge variant="outline" className="text-[10px]">Optional</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {isMgr && doc.status === "SUBMITTED" && (
        <div className="flex gap-3">
          <Button className="bg-brand-success hover:bg-brand-success/90" onClick={() => setShowApprove(true)}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve SPEC</Button>
          <Button variant="destructive" onClick={() => setShowReject(true)}><XCircle className="w-4 h-4 mr-2" /> Reject</Button>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {doc.workflowHistory.map((e, i) => (
              <div key={i} className="flex gap-3 text-xs"><div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
                <div className="pb-2"><span className="font-medium">{e.toStatus.replace("_", " ")}</span> — {e.byUserName}<span className="text-muted-foreground ml-2">{fmtDateTime(e.at)}</span>{e.comment && <p className="text-muted-foreground italic">"{e.comment}"</p>}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PasswordConfirmModal open={showApprove} onOpenChange={setShowApprove} title="Approve SPEC" description={`Approve ${doc.docNo}. It will be sent to QA Manager.`} confirmLabel="Approve" onConfirm={() => { dispatchTransition(doc.id, "QC_APPROVED"); toast.success("SPEC approved"); router.push("/qc/dashboard"); }} />
      <RejectModal open={showReject} onOpenChange={setShowReject} title="Reject SPEC" description={`Reject ${doc.docNo} and return to QC Executive.`} onConfirm={(c) => { dispatchTransition(doc.id, "REJECTED", c); toast.success("SPEC rejected"); router.push("/qc/dashboard"); }} />
    </div>
  );
}
