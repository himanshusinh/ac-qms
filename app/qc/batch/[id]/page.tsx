"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS, SEED_SPEC_TEMPLATES } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { FileText, Lock, Unlock, ChevronRight, CheckCircle2, ArrowLeft } from "lucide-react";
import type { DocType, DocStatus, BatchDocument } from "@/types";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const DOC_ORDER: DocType[] = ["SPEC", "MOA", "AWS", "COA"];
const DOC_LABELS: Record<DocType, string> = { SPEC: "Specification", MOA: "Method of Analysis", AWS: "Analytical Work Sheet", COA: "Certificate of Analysis" };
const DOC_COLORS: Record<DocType, string> = { SPEC: "#6366F1", MOA: "#0891B2", AWS: "#2E7D32", COA: "#E8732C" };

function isUnlocked(docType: DocType, currentPhase: DocType, doc: BatchDocument | undefined): boolean {
  const phaseIdx = DOC_ORDER.indexOf(currentPhase);
  const docIdx = DOC_ORDER.indexOf(docType);
  if (docIdx < phaseIdx) return true;
  if (docIdx === phaseIdx) return true;
  if (doc && doc.status !== "PENDING") return true;
  return false;
}

export default function BatchWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const currentUser = useAppStore((s) => s.currentUser);
  const batches = useAppStore((s) => s.batches);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const fetchSpecTemplate = useAppStore((s) => s.fetchSpecTemplate);
  const fetchMoaTemplate = useAppStore((s) => s.fetchMoaTemplate);
  const startAws = useAppStore((s) => s.startAws);
  const dispatchTransition = useAppStore((s) => s.dispatchTransition);

  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);
  const [optionalTests, setOptionalTests] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QC_EXEC") router.push("/login");
  }, [currentUser, router]);

  const batch = useMemo(() => batches.find((b) => b.id === batchId), [batches, batchId]);
  const docs = useMemo(() => batchDocuments.filter((d) => d.batchId === batchId), [batchDocuments, batchId]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const specTemplate = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);

  const getDoc = (dt: DocType) => docs.find((d) => d.docType === dt);

  if (!currentUser || !batch || !product) {
    return <div className="p-6 flex items-center justify-center h-96"><p className="text-muted-foreground">Loading batch...</p></div>;
  }

  const handleFetchSpec = () => {
    const result = fetchSpecTemplate(batchId, optionalTests);
    if (result) {
      toast.success("SPEC template fetched from product library");
      setShowSpecModal(false);
    } else toast.error("Failed to fetch SPEC template");
  };

  const handleFetchMoa = () => {
    const result = fetchMoaTemplate(batchId);
    if (result) toast.success("MOA template fetched");
    else toast.error("Failed to fetch MOA — ensure SPEC is QA-signed");
  };

  const handleStartAws = () => {
    const result = startAws(batchId);
    if (result) toast.success("AWS created with test sections");
    else toast.error("Failed to start AWS — ensure MOA is QA-signed");
  };

  const handleSubmitDoc = (docId: string) => {
    const ok = dispatchTransition(docId, "SUBMITTED");
    if (ok) toast.success("Document submitted to QC Manager");
    else toast.error("Cannot submit this document");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/qc/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
        </Button>
      </div>

      {/* Batch Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Batch {batch.batchNo}
                {batch.released && <Badge className="bg-brand-success text-white">Released</Badge>}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-sm">
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product.name}</span></div>
                <div><span className="text-muted-foreground">A.R. No:</span> <span className="font-medium">{batch.arNo}</span></div>
                <div><span className="text-muted-foreground">Mfg Date:</span> <span className="font-medium">{fmtDate(batch.mfgDate)}</span></div>
                <div><span className="text-muted-foreground">Exp Date:</span> <span className="font-medium">{fmtDate(batch.expDate)}</span></div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">Phase: {batch.currentDocPhase}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4-Tile Sequential Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {DOC_ORDER.map((dt, idx) => {
          const doc = getDoc(dt);
          const unlocked = isUnlocked(dt, batch.currentDocPhase, doc);
          const isCurrent = dt === batch.currentDocPhase;
          const isDone = doc && (doc.status === "QA_SIGNED" || doc.status === "ISSUED");
          const borderColor = isDone ? "#16A34A" : isCurrent ? DOC_COLORS[dt] : "#e5e7eb";

          return (
            <Card
              key={dt}
              className={`transition-all relative overflow-hidden ${unlocked ? "cursor-pointer hover:shadow-md" : "opacity-50 cursor-not-allowed"} ${isCurrent ? "ring-2" : ""}`}
              style={{ borderColor, ...(isCurrent ? { "--tw-ring-color": `${DOC_COLORS[dt]}30` } as React.CSSProperties : {}) }}
              onClick={() => {
                if (!unlocked || !doc) return;
                if (dt === "AWS" && doc.status !== "PENDING") router.push(`/qc/aws/${doc.id}`);
              }}
            >
              {/* Progress strip */}
              <div className="h-1 w-full" style={{ backgroundColor: isDone ? "#16A34A" : isCurrent ? DOC_COLORS[dt] : "#e5e7eb" }} />
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : unlocked ? <Unlock className="w-4 h-4 text-brand-accent" /> : <Lock className="w-4 h-4 text-gray-400" />}
                    <span className="font-bold text-sm" style={{ color: DOC_COLORS[dt] }}>{dt}</span>
                    {idx < 3 && <ChevronRight className="w-3 h-3 text-gray-300 hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10" />}
                  </div>
                  {doc && doc.status !== "PENDING" && <StatusBadge status={doc.status} />}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{DOC_LABELS[dt]}</p>
                {doc && doc.docNo && <p className="text-xs font-mono text-muted-foreground mb-3">{doc.docNo}</p>}

                {/* Action buttons per tile */}
                {unlocked && doc && (
                  <div className="space-y-2">
                    {/* SPEC */}
                    {dt === "SPEC" && doc.status === "PENDING" && (
                      <Button size="sm" className="w-full text-xs bg-brand-primary hover:bg-brand-primary/90" onClick={(e) => { e.stopPropagation(); setShowSpecModal(true); }}>Fetch Template</Button>
                    )}
                    {dt === "SPEC" && doc.status === "DRAFT" && (
                      <Button size="sm" className="w-full text-xs bg-brand-highlight hover:bg-brand-highlight/90" onClick={(e) => { e.stopPropagation(); setShowSubmitModal(doc.id); }}>Submit to QC Mgr</Button>
                    )}
                    {/* MOA */}
                    {dt === "MOA" && doc.status === "PENDING" && (
                      <Button size="sm" className="w-full text-xs bg-brand-primary hover:bg-brand-primary/90" onClick={(e) => { e.stopPropagation(); handleFetchMoa(); }}>Fetch Template</Button>
                    )}
                    {dt === "MOA" && doc.status === "DRAFT" && (
                      <Button size="sm" className="w-full text-xs bg-brand-highlight hover:bg-brand-highlight/90" onClick={(e) => { e.stopPropagation(); setShowSubmitModal(doc.id); }}>Submit to QC Mgr</Button>
                    )}
                    {/* AWS */}
                    {dt === "AWS" && doc.status === "PENDING" && (
                      <Button size="sm" className="w-full text-xs bg-brand-primary hover:bg-brand-primary/90" onClick={(e) => { e.stopPropagation(); handleStartAws(); }}>Start AWS</Button>
                    )}
                    {dt === "AWS" && doc.status === "DRAFT" && (
                      <Button size="sm" className="w-full text-xs bg-brand-highlight hover:bg-brand-highlight/90" onClick={(e) => { e.stopPropagation(); router.push(`/qc/aws/${doc.id}`); }}>Open Sections →</Button>
                    )}
                    {/* COA */}
                    {dt === "COA" && (doc.status === "AUTO_GENERATED" || doc.status === "ISSUED") && (
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/qc/coas/${doc.id}`); }}>View COA</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workflow History */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold mb-3">Batch Workflow Timeline</h3>
          <div className="space-y-2">
            {docs.flatMap((d) => d.workflowHistory.map((h) => ({ ...h, docType: d.docType, docNo: d.docNo }))).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()).map((entry, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" /><div className="w-px flex-1 bg-gray-200 mt-1" /></div>
                <div className="pb-2">
                  <span className="font-mono text-brand-primary">[{entry.docType}]</span>{" "}
                  <span className="font-medium">{entry.toStatus.replace("_", " ")}</span> — {entry.byUserName}
                  <span className="text-muted-foreground ml-2">{fmtDateTime(entry.at)}</span>
                  {entry.comment && <p className="text-muted-foreground italic">"{entry.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SPEC Fetch Modal with optional tests */}
      <Dialog open={showSpecModal} onOpenChange={setShowSpecModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fetch SPEC Template</DialogTitle>
            <DialogDescription>Select optional tests to include alongside the {specTemplate?.testParameters.filter((t) => t.mandatory).length || 0} mandatory tests.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {specTemplate?.testParameters.filter((t) => !t.mandatory).map((tp) => (
              <div key={tp.id} className="flex items-center gap-2">
                <Checkbox id={tp.id} checked={optionalTests.includes(tp.id)} onCheckedChange={(v) => setOptionalTests((prev) => v ? [...prev, tp.id] : prev.filter((x) => x !== tp.id))} />
                <Label htmlFor={tp.id} className="text-sm cursor-pointer">{tp.name} <span className="text-xs text-muted-foreground">({tp.resultType})</span></Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSpecModal(false)}>Cancel</Button>
            <Button className="bg-brand-primary hover:bg-brand-primary/90" onClick={handleFetchSpec}>Fetch Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Document Confirm */}
      {showSubmitModal && (
        <PasswordConfirmModal
          open={!!showSubmitModal}
          onOpenChange={() => setShowSubmitModal(null)}
          title="Submit Document"
          description="Submit this document to QC Manager for review."
          confirmLabel="Submit"
          onConfirm={() => { handleSubmitDoc(showSubmitModal); setShowSubmitModal(null); }}
        />
      )}
    </div>
  );
}
