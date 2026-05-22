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
  ArrowLeft, FileText, FlaskConical, Send, CheckCircle2, XCircle,
  Clock, ChevronDown, ChevronUp, AlertTriangle, Beaker, Gauge,
} from "lucide-react";
import type { AwsTestSection, TestParameter, MoaSection } from "@/types";

export default function AwsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const awsTestSections = useAppStore((s) => s.awsTestSections);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);
  const users = useAppStore((s) => s.users);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "QC_EXEC" && currentUser.role !== "QC_MGR")) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const awsDoc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (awsDoc ? batches.find((b) => b.id === awsDoc.batchId) : undefined), [awsDoc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const specTemplate = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const moaTemplate = useMemo(() => (batch ? SEED_MOA_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const sections = useMemo(() => awsTestSections.filter((s) => s.batchDocumentId === docId), [awsTestSections, docId]);

  const isExec = currentUser?.role === "QC_EXEC";
  const isMgr = currentUser?.role === "QC_MGR";

  const allCompleted = sections.length > 0 && sections.every((s) => s.status === "Completed");
  const completedCount = sections.filter((s) => s.status === "Completed").length;

  const getTestParam = (tpId: string): TestParameter | undefined =>
    specTemplate?.testParameters.find((tp) => tp.id === tpId);
  const getMoaSection = (tpId: string): MoaSection | undefined =>
    moaTemplate?.sections.find((ms) => ms.testParameterId === tpId);

  const getLimitsText = (tp: TestParameter): string => {
    if (tp.resultType === "Qualitative") return tp.acceptanceCriteria || "—";
    if (tp.operator === "NMT") return `NMT ${tp.maxValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "NLT") return `NLT ${tp.minValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "Between") return `${tp.minValue} – ${tp.maxValue} ${tp.uom || ""}`.trim();
    return "—";
  };

  const toggleExpand = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!awsDoc) return;
    const ok = dispatchTransition(awsDoc.id, "SUBMITTED");
    if (ok) {
      toast.success("AWS submitted to QC Manager for review");
      router.push(`/qc/batch/${awsDoc.batchId}`);
    } else {
      toast.error("Failed to submit AWS");
    }
  };

  const handleApprove = () => {
    if (!awsDoc) return;
    const ok = dispatchTransition(awsDoc.id, "QC_APPROVED");
    if (ok) {
      toast.success("AWS approved — sent to QA Manager for signature");
      router.push("/qc/dashboard");
    } else {
      toast.error("Failed to approve AWS");
    }
  };

  const handleReject = (comment: string) => {
    if (!awsDoc) return;
    const ok = dispatchTransition(awsDoc.id, "REJECTED", comment);
    if (ok) {
      toast.success("AWS rejected — returned to QC Executive");
      router.push("/qc/dashboard");
    } else {
      toast.error("Failed to reject AWS");
    }
  };

  if (!currentUser || !awsDoc || !batch || !product) {
    return (
      <div className="min-h-screen bg-brand-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading AWS...</p>
      </div>
    );
  }

  const specDoc = batchDocuments.find((d) => d.batchId === batch.id && d.docType === "SPEC");
  const moaDoc = batchDocuments.find((d) => d.batchId === batch.id && d.docType === "MOA");

  return (
    <div className="min-h-screen bg-brand-subtle">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/qc/batch/${batch.id}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Batch Workspace
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <FlaskConical className="w-5 h-5 text-brand-primary" />
            <span className="font-semibold text-brand-primary">AC-QMS</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{currentUser.name}</span>
            <Badge variant="outline" className="text-xs">{currentUser.role.replace("_", " ")}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-foreground">{awsDoc.docNo}</h1>
                  <StatusBadge status={awsDoc.status} size="md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
                  <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{batch.batchNo}</span></div>
                  <div><span className="text-muted-foreground">Mfg Date:</span> <span className="font-medium">{fmtDate(batch.mfgDate)}</span></div>
                  <div><span className="text-muted-foreground">Exp Date:</span> <span className="font-medium">{fmtDate(batch.expDate)}</span></div>
                  <div><span className="text-muted-foreground">A.R. No:</span> <span className="font-medium">{batch.arNo}</span></div>
                  <div><span className="text-muted-foreground">Qty Sampled:</span> <span className="font-medium">{batch.qtySampled} {batch.qtySampledUom}</span></div>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                {specDoc && <div className="flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> SPEC: {specDoc.docNo}</div>}
                {moaDoc && <div className="flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> MOA: {moaDoc.docNo}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejection banner */}
        {awsDoc.rejectionComments.length > 0 && awsDoc.status === "DRAFT" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Document Returned for Correction</p>
                <p className="text-sm text-red-700 mt-1">{awsDoc.rejectionComments[awsDoc.rejectionComments.length - 1]}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary Results Table */}
            {(isMgr || sections.some((s) => s.status === "Completed")) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-medium">Sr.</th>
                          <th className="text-left py-2 px-3 font-medium">Test</th>
                          <th className="text-left py-2 px-3 font-medium">Result</th>
                          <th className="text-left py-2 px-3 font-medium">Limits</th>
                          <th className="text-left py-2 px-3 font-medium">Conclusion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((sec, i) => {
                          const tp = getTestParam(sec.testParameterId);
                          if (!tp) return null;
                          const isOOS = sec.oosAcknowledged;
                          return (
                            <tr key={sec.id} className={`border-b last:border-0 ${isOOS ? "bg-orange-50" : ""}`}>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-sm font-medium text-muted-foreground">Section Progress</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-success rounded-full transition-all" style={{ width: `${sections.length > 0 ? (completedCount / sections.length) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-semibold">{completedCount}/{sections.length}</span>
            </div>

            {/* Section Cards */}
            {sections.map((sec, idx) => {
              const tp = getTestParam(sec.testParameterId);
              const moa = getMoaSection(sec.testParameterId);
              if (!tp) return null;
              const expanded = expandedSections.has(sec.id) || (isMgr && awsDoc.status === "SUBMITTED");

              const statusColor = sec.status === "Completed" ? "border-green-300 bg-green-50/50"
                : sec.status === "InProgress" ? "border-blue-300 bg-blue-50/50"
                : "border-gray-200";
              const statusIcon = sec.status === "Completed" ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : sec.status === "InProgress" ? <Clock className="w-5 h-5 text-blue-600" />
                : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;

              return (
                <Card key={sec.id} className={`border ${statusColor} transition-all`}>
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    onClick={() => toggleExpand(sec.id)}
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{idx + 1}. {tp.name}</span>
                          <Badge variant="outline" className="text-[10px]">{tp.resultType}</Badge>
                          {tp.mandatory && <Badge className="text-[10px] bg-brand-primary/10 text-brand-primary border-0">Mandatory</Badge>}
                          {sec.oosAcknowledged && <Badge className="text-[10px] bg-orange-100 text-orange-700 border-0">OOS</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sec.status === "Completed" ? `Completed${sec.completedAt ? ` · ${fmtDateTime(sec.completedAt)}` : ""}` : sec.status === "InProgress" ? "In Progress" : "Not Started"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExec && awsDoc.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant={sec.status === "Completed" ? "outline" : "default"}
                          className={sec.status === "Completed" ? "" : "bg-brand-highlight hover:bg-brand-highlight/90"}
                          onClick={(e) => { e.stopPropagation(); router.push(`/qc/aws/${docId}/section/${sec.id}`); }}
                        >
                          {sec.status === "Completed" ? "View/Edit" : sec.status === "InProgress" ? "Continue" : "Open"}
                        </Button>
                      )}
                      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {expanded && (sec.status !== "NotStarted" || isMgr) && (
                    <div className="px-5 pb-4 border-t pt-4 space-y-3 text-sm">
                      {/* Instrument */}
                      {sec.instrumentId && (
                        <div className="flex items-start gap-2">
                          <Gauge className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium">Instrument: </span>
                            {(() => { const inst = SEED_INSTRUMENTS.find((i) => i.id === sec.instrumentId); return inst ? `${inst.name} (${inst.instrumentId}) — Cal: ${fmtDate(inst.calibrationDate)}` : "—"; })()}
                          </div>
                        </div>
                      )}
                      {/* Reagents */}
                      {sec.reagents.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Beaker className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium">Reagents: </span>
                            {sec.reagents.map((r) => { const rgt = SEED_REAGENTS.find((rr) => rr.id === r.reagentId); return rgt ? rgt.name : r.reagentId; }).join(", ")}
                          </div>
                        </div>
                      )}
                      {/* Observations */}
                      {sec.observations && <div><span className="font-medium">Observations: </span>{sec.observations}</div>}
                      {/* Calculated Result */}
                      {sec.calculatedResult && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Result: </span>
                          <span className={`font-semibold ${sec.oosAcknowledged ? "text-orange-600" : "text-green-700"}`}>
                            {sec.calculatedResult} {tp.uom || ""}
                          </span>
                          <span className="text-xs text-muted-foreground">(Limits: {getLimitsText(tp)})</span>
                        </div>
                      )}
                      {/* Conclusion */}
                      {sec.conclusion && (
                        <div>
                          <span className="font-medium">Conclusion: </span>
                          <span className={sec.conclusion === "Satisfactory" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{sec.conclusion}</span>
                        </div>
                      )}
                      {/* OOS Warning */}
                      {sec.oosAcknowledged && (
                        <div className="rounded-md bg-orange-100 border border-orange-300 px-3 py-2 text-orange-800 text-xs font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Out of Specification — acknowledged by analyst
                        </div>
                      )}
                      {/* MOA Reference (for manager review) */}
                      {isMgr && moa && (
                        <details className="mt-2">
                          <summary className="text-xs font-medium text-brand-accent cursor-pointer">View MOA Procedure Reference</summary>
                          <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs space-y-1 border border-blue-100">
                            <p><span className="font-medium">Pharmacopoeia:</span> {moa.pharmacopoeia}</p>
                            <p><span className="font-medium">Sample Prep:</span> {moa.samplePrep}</p>
                            {moa.formula && <p><span className="font-medium">Formula:</span> {moa.formula}</p>}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Right Rail — Workflow History */}
          <div className="space-y-4">
            {/* Action Buttons */}
            {isExec && awsDoc.status === "DRAFT" && (
              <Card className="border-brand-highlight/30">
                <CardContent className="pt-5">
                  <Button
                    className="w-full bg-brand-highlight hover:bg-brand-highlight/90"
                    disabled={!allCompleted}
                    onClick={() => setShowSubmitModal(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit AWS to QC Manager
                  </Button>
                  {!allCompleted && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Complete all {sections.length} test sections before submitting
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {isMgr && awsDoc.status === "SUBMITTED" && (
              <Card className="border-qc/30">
                <CardContent className="pt-5 space-y-2">
                  <Button className="w-full bg-brand-success hover:bg-brand-success/90" onClick={() => setShowApproveModal(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setShowRejectModal(true)}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject with Comments
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Workflow History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Workflow History</CardTitle>
              </CardHeader>
              <CardContent>
                {awsDoc.workflowHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No history yet</p>
                ) : (
                  <div className="space-y-3">
                    {awsDoc.workflowHistory.map((entry, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" />
                          {i < awsDoc.workflowHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-3">
                          <p className="font-medium">{entry.toStatus.replace("_", " ")}</p>
                          <p className="text-muted-foreground">{entry.byUserName} · {fmtDateTime(entry.at)}</p>
                          {entry.comment && <p className="text-muted-foreground italic mt-0.5">"{entry.comment}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasswordConfirmModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        title="Submit AWS"
        description={`Submit ${awsDoc.docNo} to QC Manager for review. All ${sections.length} test sections are completed.`}
        confirmLabel="Submit"
        onConfirm={handleSubmit}
      />
      <PasswordConfirmModal
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        title="Approve AWS"
        description={`Approve ${awsDoc.docNo}. It will be sent to QA Manager for final signature.`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />
      <RejectModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        title="Reject AWS"
        description={`Reject ${awsDoc.docNo} and return it to QC Executive for correction.`}
        onConfirm={handleReject}
      />
    </div>
  );
}
