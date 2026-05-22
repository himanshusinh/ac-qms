"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS, SEED_MOA_TEMPLATES, SEED_SPEC_TEMPLATES } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { RejectModal } from "@/components/shared/RejectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function MoaReviewPage() {
  const params = useParams(); const router = useRouter(); const docId = params.id as string;
  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => { if (!currentUser || (currentUser.role !== "QC_MGR" && currentUser.role !== "QC_EXEC")) router.push("/login"); }, [currentUser, router]);

  const doc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (doc ? batches.find((b) => b.id === doc.batchId) : undefined), [doc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const moaTemplate = useMemo(() => (batch ? SEED_MOA_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const specTemplate = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const isMgr = currentUser?.role === "QC_MGR";

  if (!currentUser || !doc || !batch || !product || !moaTemplate) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;

  const activeSections = moaTemplate.sections.filter((s) => {
    const tp = specTemplate?.testParameters.find((t) => t.id === s.testParameterId);
    return tp && (tp.mandatory || batch.optionalTestsActivated.includes(tp.id));
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push(isMgr ? "/qc/dashboard" : `/qc/batch/${batch.id}`)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card className="mb-6"><CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2"><h1 className="text-xl font-bold">{doc.docNo}</h1><StatusBadge status={doc.status} size="md" /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm">
          <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
          <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{batch.batchNo}</span></div>
          <div><span className="text-muted-foreground">Procedures:</span> <span className="font-medium">{activeSections.length}</span></div>
        </div>
      </CardContent></Card>

      {activeSections.map((sec, idx) => {
        const tp = specTemplate?.testParameters.find((t) => t.id === sec.testParameterId);
        return (
          <Card key={sec.testParameterId} className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">{idx + 1}. {tp?.name || "—"}<Badge variant="outline" className="text-[10px]">{sec.pharmacopoeia}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Sample Prep:</span><p className="mt-0.5">{sec.samplePrep}</p></div>
              <div><span className="font-medium text-muted-foreground">Standard Prep:</span><p className="mt-0.5">{sec.standardPrep}</p></div>
              {sec.blankPrep && <div><span className="font-medium text-muted-foreground">Blank Prep:</span><p className="mt-0.5">{sec.blankPrep}</p></div>}
              {sec.formula && <div><span className="font-medium text-muted-foreground">Formula:</span><p className="mt-0.5 font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{sec.formula}</p></div>}
            </CardContent>
          </Card>
        );
      })}

      {isMgr && doc.status === "SUBMITTED" && (
        <div className="flex gap-3 mt-4">
          <Button className="bg-brand-success hover:bg-brand-success/90" onClick={() => setShowApprove(true)}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve MOA</Button>
          <Button variant="destructive" onClick={() => setShowReject(true)}><XCircle className="w-4 h-4 mr-2" /> Reject</Button>
        </div>
      )}

      <Card className="mt-6"><CardHeader><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">{doc.workflowHistory.map((e, i) => (
          <div key={i} className="flex gap-3 text-xs"><div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
            <div className="pb-2"><span className="font-medium">{e.toStatus.replace("_"," ")}</span> — {e.byUserName} <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>{e.comment && <p className="text-muted-foreground italic">"{e.comment}"</p>}</div>
          </div>))}</div>
      </CardContent></Card>

      <PasswordConfirmModal open={showApprove} onOpenChange={setShowApprove} title="Approve MOA" description={`Approve ${doc.docNo}. It will be sent to QA Manager.`} confirmLabel="Approve" onConfirm={() => { dispatchTransition(doc.id, "QC_APPROVED"); toast.success("MOA approved"); router.push("/qc/dashboard"); }} />
      <RejectModal open={showReject} onOpenChange={setShowReject} title="Reject MOA" description={`Reject ${doc.docNo}.`} onConfirm={(c) => { dispatchTransition(doc.id, "REJECTED", c); toast.success("MOA rejected"); router.push("/qc/dashboard"); }} />
    </div>
  );
}
