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
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function QaSpecSignPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);
  const [showSign, setShowSign] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QA_MGR") router.push("/login");
  }, [currentUser, router]);

  const doc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (doc ? batches.find((b) => b.id === doc.batchId) : undefined), [doc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const template = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);

  if (!currentUser || !doc || !batch || !product || !template) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;
  const activeTests = template.testParameters.filter((tp) => tp.mandatory || batch.optionalTestsActivated.includes(tp.id));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/qa/dashboard")}><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
      <Card className="mb-6"><CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2"><h1 className="text-xl font-bold">{doc.docNo}</h1><StatusBadge status={doc.status} size="md" /><Badge className="bg-qa-light text-qa border-qa-border text-xs">QA Review</Badge></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
          <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
          <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{batch.batchNo}</span></div>
          <div><span className="text-muted-foreground">QC Approved By:</span> <span className="font-medium">{doc.workflowHistory.find((h) => h.toStatus === "QC_APPROVED")?.byUserName || "—"}</span></div>
        </div>
      </CardContent></Card>

      <Card className="mb-6"><CardHeader><CardTitle className="text-base">Test Parameters</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><thead><tr className="border-b bg-muted/50">
          <th className="text-left py-2 px-3 font-medium">Sr.</th><th className="text-left py-2 px-3 font-medium">Test</th><th className="text-left py-2 px-3 font-medium">Type</th><th className="text-left py-2 px-3 font-medium">Limits</th>
        </tr></thead><tbody>{activeTests.map((tp, i) => (
          <tr key={tp.id} className="border-b last:border-0"><td className="py-2 px-3 text-muted-foreground">{i + 1}</td><td className="py-2 px-3 font-medium">{tp.name}</td><td className="py-2 px-3 text-xs">{tp.resultType}</td>
            <td className="py-2 px-3 text-sm">{tp.resultType === "Qualitative" ? tp.acceptanceCriteria : tp.operator === "Between" ? `${tp.minValue} – ${tp.maxValue} ${tp.uom || ""}` : `${tp.operator} ${tp.maxValue || tp.minValue} ${tp.uom || ""}`}</td>
          </tr>
        ))}</tbody></table>
      </CardContent></Card>

      {doc.status === "QC_APPROVED" && (
        <div className="flex gap-3">
          <Button className="bg-qa hover:bg-qa/90 text-white" onClick={() => setShowSign(true)}><CheckCircle2 className="w-4 h-4 mr-2" /> Sign SPEC</Button>
          <Button variant="destructive" onClick={() => setShowReject(true)}><XCircle className="w-4 h-4 mr-2" /> Reject</Button>
        </div>
      )}

      <Card className="mt-6"><CardHeader><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">{doc.workflowHistory.map((e, i) => (
          <div key={i} className="flex gap-3 text-xs"><div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-qa mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
            <div className="pb-2"><span className="font-medium">{e.toStatus.replace("_"," ")}</span> — {e.byUserName} <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>{e.comment && <p className="text-muted-foreground italic">"{e.comment}"</p>}</div>
          </div>
        ))}</div>
      </CardContent></Card>

      <PasswordConfirmModal open={showSign} onOpenChange={setShowSign} title="Sign SPEC" description={`QA-sign ${doc.docNo}. This will unlock the MOA phase.`} confirmLabel="Sign" onConfirm={() => { dispatchTransition(doc.id, "QA_SIGNED"); toast.success("SPEC QA-signed — MOA phase unlocked"); router.push("/qa/dashboard"); }} />
      <RejectModal open={showReject} onOpenChange={setShowReject} title="Reject SPEC" description={`Reject ${doc.docNo} and return to QC.`} onConfirm={(c) => { dispatchTransition(doc.id, "REJECTED", c); toast.success("SPEC rejected"); router.push("/qa/dashboard"); }} />
    </div>
  );
}
