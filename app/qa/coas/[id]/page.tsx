"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { RejectModal } from "@/components/shared/RejectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle, Download, Printer, Shield } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function QaCoaSignPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const users = useAppStore((s) => s.users);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);

  const [showSign, setShowSign] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QA_MGR") router.push("/login");
  }, [currentUser, router]);

  const coaDoc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (coaDoc ? batches.find((b) => b.id === coaDoc.batchId) : undefined), [coaDoc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const specDoc = useMemo(() => (batch ? batchDocuments.find((d) => d.batchId === batch.id && d.docType === "SPEC") : undefined), [batch, batchDocuments]);
  const awsDoc = useMemo(() => (batch ? batchDocuments.find((d) => d.batchId === batch.id && d.docType === "AWS") : undefined), [batch, batchDocuments]);

  const getUser = (id?: string) => users.find((u) => u.id === id);

  if (!currentUser || !coaDoc || !batch || !product) {
    return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const isIssued = coaDoc.status === "ISSUED";
  const isPending = coaDoc.status === "AUTO_GENERATED";

  const handleSign = () => {
    const ok = dispatchTransition(coaDoc.id, "ISSUED");
    if (ok) {
      setShowSign(false);
      setShowSuccess(true);
    } else {
      toast.error("Failed to issue COA");
    }
  };

  // Build signature data
  const awsCreator = getUser(awsDoc?.createdBy);
  const awsQcApprover = getUser(awsDoc?.qcApprovedBy);
  const awsQaSigner = getUser(awsDoc?.qaSignedBy);
  const coaQaSigner = isIssued ? getUser(coaDoc.qaSignedBy) : null;

  const signatures = [
    { label: "AWS CREATED BY", name: awsCreator?.name || "—", role: "QC Executive", dept: "QC", date: awsDoc?.workflowHistory.find((h) => h.toStatus === "DRAFT")?.at, signed: true },
    { label: "AWS QC APPROVED BY", name: awsQcApprover?.name || "—", role: "QC Manager", dept: "QC", date: awsDoc?.workflowHistory.find((h) => h.toStatus === "QC_APPROVED")?.at, signed: true },
    { label: "AWS QA SIGNED BY", name: awsQaSigner?.name || "—", role: "QA Manager", dept: "QA", date: awsDoc?.workflowHistory.find((h) => h.toStatus === "QA_SIGNED")?.at, signed: true },
    { label: "COA QA SIGNED BY", name: coaQaSigner?.name || (isPending ? "Pending" : "—"), role: "QA Manager", dept: "QA", date: isIssued ? coaDoc.issuedAt : undefined, signed: isIssued },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/qa/dashboard")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
      </Button>

      {/* Certificate */}
      <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={`text-[10px] px-3 py-1 ${isIssued ? "bg-teal-100 text-teal-800 border-teal-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
            <Shield className="w-3 h-3 mr-1" />
            {isIssued ? "ISSUED — IMMUTABLE" : "PENDING SIGNATURE"}
          </Badge>
        </div>

        {/* COA Header */}
        <div className="bg-gradient-to-r from-[#0D4F5C] to-[#1A8FA3] text-white px-8 py-6 text-center">
          <p className="text-xs tracking-widest mb-1 opacity-80">ADITYA CHEMICALS PVT. LTD.</p>
          <h1 className="text-2xl font-bold tracking-wide">CERTIFICATE OF ANALYSIS</h1>
          <p className="text-sm mt-2 font-mono opacity-90">{coaDoc.docNo}</p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Section 1: Product Details */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Product Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">Product Name</span><p className="font-semibold">{product.name}</p></div>
              <div><span className="text-muted-foreground text-xs">Batch No.</span><p className="font-semibold">{batch.batchNo}</p></div>
              <div><span className="text-muted-foreground text-xs">Mfg. Date</span><p className="font-medium">{fmtDate(batch.mfgDate)}</p></div>
              <div><span className="text-muted-foreground text-xs">Exp. Date</span><p className="font-medium">{fmtDate(batch.expDate)}</p></div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Reference Documents */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Reference Documents</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">SPEC No.</span><p className="font-mono text-xs">{specDoc?.docNo || "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">A.R. No.</span><p className="font-mono text-xs">{batch.arNo}</p></div>
              <div><span className="text-muted-foreground text-xs">Qty Sampled</span><p className="font-medium">{batch.qtySampled} {batch.qtySampledUom}</p></div>
            </div>
          </div>

          <Separator />

          {/* Section 3: Results Table */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Analytical Results</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2.5 px-4 font-semibold text-xs">Sr.</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-xs">Test Parameter</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-xs">Result</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-xs">Acceptance Limits</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-xs">Conclusion</th>
                </tr>
              </thead>
              <tbody>
                {(coaDoc.coaResults || []).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-4 font-medium">{r.testName}</td>
                    <td className="py-2 px-4">{r.result}</td>
                    <td className="py-2 px-4 text-muted-foreground">{r.limits}</td>
                    <td className="py-2 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.conclusion === "Satisfactory" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.conclusion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Section 4: Compliance Statement */}
          <div className={`rounded-lg border-2 p-5 text-center ${coaDoc.complies ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
            <p className={`text-lg font-bold ${coaDoc.complies ? "text-green-800" : "text-red-800"}`}>
              {coaDoc.complianceStatement}
            </p>
          </div>

          <Separator />

          {/* Section 5: Signature Block */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Authorization</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {signatures.map((sig, i) => (
                <div key={i} className={`border rounded-lg p-3 text-center ${sig.signed ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}`}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{sig.label}</p>
                  <Separator className="mb-2" />
                  <p className="text-sm font-semibold">{sig.name}</p>
                  <p className="text-[10px] text-muted-foreground">{sig.role}</p>
                  <p className="text-[10px] text-muted-foreground">{sig.dept} Department</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{sig.date ? fmtDateTime(sig.date) : "—"}</p>
                  {sig.signed && <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mt-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* Issuance stamp */}
          {isIssued && coaDoc.issuedAt && (
            <div className="text-center text-xs text-muted-foreground border-t pt-4">
              <p>Issued on {fmtDateTime(coaDoc.issuedAt)} — System-generated immutable document</p>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-6 flex items-center gap-3 no-print">
        {isPending && (
          <>
            <Button className="bg-green-700 hover:bg-green-800 text-white" size="lg" onClick={() => setShowSign(true)}>
              <CheckCircle2 className="w-5 h-5 mr-2" /> Sign & Issue COA
            </Button>
            <Button variant="destructive" onClick={() => setShowReject(true)}>
              <XCircle className="w-4 h-4 mr-2" /> Reject to QC
            </Button>
          </>
        )}
        {isIssued && (
          <>
            <Button variant="outline" onClick={() => toast.success("PDF download triggered (mock)")}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </>
        )}
      </div>

      {/* Workflow History */}
      <Card className="mt-6 no-print">
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold mb-3">Workflow History</h3>
          <div className="space-y-2">
            {coaDoc.workflowHistory.map((e, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-qa mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
                <div className="pb-2"><span className="font-medium">{e.toStatus.replace("_", " ")}</span> — {e.byUserName} <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>{e.comment && <p className="text-muted-foreground italic">&quot;{e.comment}&quot;</p>}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <PasswordConfirmModal open={showSign} onOpenChange={setShowSign} title="Sign & Issue COA" description={`This authorises batch ${batch.batchNo} for release. COA ${coaDoc.docNo} will be permanently locked.`} confirmLabel="Sign & Issue" onConfirm={handleSign} />
      <RejectModal open={showReject} onOpenChange={setShowReject} title="Reject COA" description={`Reject ${coaDoc.docNo} and return to QC for correction.`} onConfirm={(c) => { dispatchTransition(coaDoc.id, "REJECTED", c); toast.success("COA rejected"); router.push("/qa/dashboard"); }} />

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-6 h-6" /> COA Issued!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">Batch <strong>{batch.batchNo}</strong> has been <strong>released</strong>.</p>
            <p className="text-sm text-muted-foreground">COA {coaDoc.docNo} is now permanently locked and immutable.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.success("PDF download triggered (mock)")}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button className="bg-brand-primary hover:bg-brand-primary/90" onClick={() => router.push("/qa/dashboard")}>
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
