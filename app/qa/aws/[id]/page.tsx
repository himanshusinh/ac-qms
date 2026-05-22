"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_SPEC_TEMPLATES, SEED_MOA_TEMPLATES, SEED_PRODUCTS, SEED_INSTRUMENTS, SEED_REAGENTS } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { RejectModal } from "@/components/shared/RejectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Gauge, Beaker, FileText,
} from "lucide-react";
import type { TestParameter, MoaSection } from "@/types";

export default function QaAwsSignPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const awsTestSections = useAppStore((s) => s.awsTestSections);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);

  const [showSign, setShowSign] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QA_MGR") router.push("/login");
  }, [currentUser, router]);

  const awsDoc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (awsDoc ? batches.find((b) => b.id === awsDoc.batchId) : undefined), [awsDoc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const specTemplate = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const moaTemplate = useMemo(() => (batch ? SEED_MOA_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const sections = useMemo(() => awsTestSections.filter((s) => s.batchDocumentId === docId), [awsTestSections, docId]);

  const getTestParam = (tpId: string): TestParameter | undefined => specTemplate?.testParameters.find((tp) => tp.id === tpId);
  const getMoaSection = (tpId: string): MoaSection | undefined => moaTemplate?.sections.find((ms) => ms.testParameterId === tpId);

  const getLimitsText = (tp: TestParameter): string => {
    if (tp.resultType === "Qualitative") return tp.acceptanceCriteria || "—";
    if (tp.operator === "NMT") return `NMT ${tp.maxValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "NLT") return `NLT ${tp.minValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "Between") return `${tp.minValue} – ${tp.maxValue} ${tp.uom || ""}`.trim();
    return "—";
  };

  if (!currentUser || !awsDoc || !batch || !product) {
    return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const specDoc = batchDocuments.find((d) => d.batchId === batch.id && d.docType === "SPEC");
  const moaDoc = batchDocuments.find((d) => d.batchId === batch.id && d.docType === "MOA");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/qa/dashboard")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold">{awsDoc.docNo}</h1>
                <StatusBadge status={awsDoc.status} size="md" />
                <Badge className="bg-qa-light text-qa border-qa-border text-xs">QA Review</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
                <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{batch.batchNo}</span></div>
                <div><span className="text-muted-foreground">Mfg Date:</span> <span className="font-medium">{fmtDate(batch.mfgDate)}</span></div>
                <div><span className="text-muted-foreground">Exp Date:</span> <span className="font-medium">{fmtDate(batch.expDate)}</span></div>
                <div><span className="text-muted-foreground">A.R. No:</span> <span className="font-medium">{batch.arNo}</span></div>
                <div><span className="text-muted-foreground">Qty Sampled:</span> <span className="font-medium">{batch.qtySampled} {batch.qtySampledUom}</span></div>
                <div><span className="text-muted-foreground">QC Approved By:</span> <span className="font-medium">{awsDoc.workflowHistory.find((h) => h.toStatus === "QC_APPROVED")?.byUserName || "—"}</span></div>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              {specDoc && <div className="flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> SPEC: {specDoc.docNo}</div>}
              {moaDoc && <div className="flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> MOA: {moaDoc.docNo}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Results Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Summary Results</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">Sr.</th>
              <th className="text-left py-2 px-3 font-medium">Test</th>
              <th className="text-left py-2 px-3 font-medium">Result</th>
              <th className="text-left py-2 px-3 font-medium">Limits</th>
              <th className="text-left py-2 px-3 font-medium">Conclusion</th>
            </tr></thead>
            <tbody>
              {sections.map((sec, i) => {
                const tp = getTestParam(sec.testParameterId);
                if (!tp) return null;
                return (
                  <tr key={sec.id} className={`border-b last:border-0 ${sec.oosAcknowledged ? "bg-orange-50" : ""}`}>
                    <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{tp.name}</td>
                    <td className="py-2 px-3">{sec.calculatedResult || sec.observations || "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground">{getLimitsText(tp)}</td>
                    <td className="py-2 px-3">
                      {sec.conclusion ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sec.conclusion === "Satisfactory" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {sec.conclusion}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Expanded Section Details */}
      <div className="space-y-4 mb-6">
        {sections.map((sec, idx) => {
          const tp = getTestParam(sec.testParameterId);
          const moa = getMoaSection(sec.testParameterId);
          if (!tp) return null;
          return (
            <Card key={sec.id} className="border-green-200">
              <CardContent className="pt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{idx + 1}. {tp.name}</span>
                  <Badge variant="outline" className="text-[10px]">{tp.resultType}</Badge>
                  {sec.oosAcknowledged && <Badge className="text-[10px] bg-orange-100 text-orange-700 border-0">OOS</Badge>}
                </div>
                {sec.instrumentId && (
                  <div className="flex items-start gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div><span className="font-medium">Instrument: </span>
                      {(() => { const inst = SEED_INSTRUMENTS.find((i) => i.id === sec.instrumentId); return inst ? `${inst.name} (${inst.instrumentId}) — Cal: ${fmtDate(inst.calibrationDate)}` : "—"; })()}
                    </div>
                  </div>
                )}
                {sec.reagents.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Beaker className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div><span className="font-medium">Reagents: </span>
                      {sec.reagents.map((r) => { const rgt = SEED_REAGENTS.find((rr) => rr.id === r.reagentId); return rgt ? rgt.name : r.reagentId; }).join(", ")}
                    </div>
                  </div>
                )}
                {sec.observations && <div><span className="font-medium">Observations: </span>{sec.observations}</div>}
                {sec.calculatedResult && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Result: </span>
                    <span className={`font-semibold ${sec.oosAcknowledged ? "text-orange-600" : "text-green-700"}`}>{sec.calculatedResult} {tp.uom || ""}</span>
                    <span className="text-xs text-muted-foreground">(Limits: {getLimitsText(tp)})</span>
                  </div>
                )}
                {sec.conclusion && (
                  <div><span className="font-medium">Conclusion: </span>
                    <span className={sec.conclusion === "Satisfactory" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{sec.conclusion}</span>
                  </div>
                )}
                {sec.oosAcknowledged && (
                  <div className="rounded-md bg-orange-100 border border-orange-300 px-3 py-2 text-orange-800 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Out of Specification — acknowledged by analyst
                  </div>
                )}
                {moa && (
                  <details className="mt-2">
                    <summary className="text-xs font-medium text-qa cursor-pointer">View MOA Procedure Reference</summary>
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs space-y-1 border border-blue-100">
                      <p><span className="font-medium">Pharmacopoeia:</span> {moa.pharmacopoeia}</p>
                      <p><span className="font-medium">Sample Prep:</span> {moa.samplePrep}</p>
                      {moa.formula && <p><span className="font-medium">Formula:</span> {moa.formula}</p>}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      {awsDoc.status === "QC_APPROVED" && (
        <div className="flex gap-3 mb-6">
          <Button className="bg-qa hover:bg-qa/90 text-white" onClick={() => setShowSign(true)}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Sign AWS
          </Button>
          <Button variant="destructive" onClick={() => setShowReject(true)}>
            <XCircle className="w-4 h-4 mr-2" /> Reject to QC
          </Button>
        </div>
      )}

      {/* Workflow History */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {awsDoc.workflowHistory.map((e, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-qa mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
                <div className="pb-2"><span className="font-medium">{e.toStatus.replace("_", " ")}</span> — {e.byUserName} <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>{e.comment && <p className="text-muted-foreground italic">&quot;{e.comment}&quot;</p>}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PasswordConfirmModal open={showSign} onOpenChange={setShowSign} title="Sign AWS" description={`QA-sign ${awsDoc.docNo}. This will trigger COA auto-generation and unlock the COA phase.`} confirmLabel="Sign" onConfirm={() => { dispatchTransition(awsDoc.id, "QA_SIGNED"); toast.success("AWS QA-signed — COA auto-generated"); router.push("/qa/dashboard"); }} />
      <RejectModal open={showReject} onOpenChange={setShowReject} title="Reject AWS" description={`Reject ${awsDoc.docNo} and return to QC.`} onConfirm={(c) => { dispatchTransition(awsDoc.id, "REJECTED", c); toast.success("AWS rejected"); router.push("/qa/dashboard"); }} />
    </div>
  );
}
