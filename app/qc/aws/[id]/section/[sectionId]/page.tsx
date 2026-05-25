"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_SPEC_TEMPLATES, SEED_MOA_TEMPLATES, SEED_PRODUCTS, SEED_INSTRUMENTS, SEED_REAGENTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { fmtDate, now as getNow } from "@/lib/utils";
import {
  ArrowLeft, Save, CheckCircle2, AlertTriangle, Gauge, Beaker,
  FlaskConical, Clock, FileText,
} from "lucide-react";
import type { AwsTestSection, TestParameter, MoaSection } from "@/types";

function getRecommendedInstrumentId(testName: string) {
  if (testName === "pH") return "inst-ph001";
  if (testName === "Loss on Drying") return "inst-oven001";
  if (testName === "Assay") return "inst-hplc001";
  if (testName === "Description") return "inst-ftir001";
  return "";
}

function getRecommendedReagentIds(testName: string) {
  if (testName === "pH") return ["rgt-buf-ph4", "rgt-buf-ph7"];
  if (testName === "Solubility") return ["rgt-meoh"];
  if (testName === "Assay") return ["rgt-mpb", "rgt-rs-gly", "rgt-meoh"];
  return [];
}

export default function AwsSectionEntryPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const sectionId = params.sectionId as string;

  const currentUser = useAppStore((s) => s.currentUser);
  const batchDocuments = useAppStore((s) => s.batchDocuments);
  const batches = useAppStore((s) => s.batches);
  const awsTestSections = useAppStore((s) => s.awsTestSections);
  const updateAwsSection = useAppStore((s) => s.updateAwsSection);
  const addAudit = useAppStore((s) => s.addAudit);

  const awsDoc = useMemo(() => batchDocuments.find((d) => d.id === docId), [batchDocuments, docId]);
  const batch = useMemo(() => (awsDoc ? batches.find((b) => b.id === awsDoc.batchId) : undefined), [awsDoc, batches]);
  const product = useMemo(() => (batch ? SEED_PRODUCTS.find((p) => p.id === batch.productId) : undefined), [batch]);
  const specTemplate = useMemo(() => (batch ? SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const moaTemplate = useMemo(() => (batch ? SEED_MOA_TEMPLATES.find((t) => t.productId === batch.productId) : undefined), [batch]);
  const section = useMemo(() => awsTestSections.find((s) => s.id === sectionId), [awsTestSections, sectionId]);

  const tp: TestParameter | undefined = useMemo(() => (section ? specTemplate?.testParameters.find((t) => t.id === section.testParameterId) : undefined), [section, specTemplate]);
  const moa: MoaSection | undefined = useMemo(() => (section ? moaTemplate?.sections.find((s) => s.testParameterId === section.testParameterId) : undefined), [section, moaTemplate]);

  // Local form state
  const [instrumentId, setInstrumentId] = useState(section?.instrumentId || (section?.status === "NotStarted" && tp ? getRecommendedInstrumentId(tp.name) : ""));
  const [reagentIds, setReagentIds] = useState<string[]>(
    section?.reagents?.length
      ? section.reagents.map((r) => r.reagentId)
      : section?.status === "NotStarted" && tp
        ? getRecommendedReagentIds(tp.name)
        : []
  );
  const [observations, setObservations] = useState(section?.observations || "");
  const [inputs, setInputs] = useState<Record<string, string>>(section?.inputs || {});
  const [conclusion, setConclusion] = useState(section?.conclusion || "");
  const [oosAcknowledged, setOosAcknowledged] = useState(section?.oosAcknowledged || false);
  const [expiredInstrAck, setExpiredInstrAck] = useState(section?.expiredInstrumentAcknowledged || false);
  const [expiredReagentAck, setExpiredReagentAck] = useState(section?.expiredReagentAcknowledged || false);
  const [outsideLabRef, setOutsideLabRef] = useState(section?.outsideLabReportRef || "");
  const [outsideLabDate, setOutsideLabDate] = useState(section?.outsideLabDate || "");
  const [lastSaved, setLastSaved] = useState(section?.lastSaved || "");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QC_EXEC") router.push("/login");
  }, [currentUser, router]);

  // Compute result for quantitative tests
  const calculatedResult = useMemo(() => {
    if (!tp || tp.resultType !== "Quantitative") return undefined;
    if (tp.name === "pH") {
      const val = parseFloat(inputs["pH"] || "");
      return isNaN(val) ? undefined : val.toFixed(2);
    }
    if (tp.name === "Loss on Drying") {
      const w1 = parseFloat(inputs["W1"] || "");
      const w2 = parseFloat(inputs["W2"] || "");
      if (isNaN(w1) || isNaN(w2) || w1 === 0) return undefined;
      return (((w1 - w2) / w1) * 100).toFixed(3);
    }
    if (tp.name === "Assay") {
      const aSample = parseFloat(inputs["A_sample"] || "");
      const aStd = parseFloat(inputs["A_standard"] || "");
      const wStd = parseFloat(inputs["W_standard"] || "");
      const wSample = parseFloat(inputs["W_sample"] || "");
      const purity = parseFloat(inputs["Purity"] || "99.5");
      if ([aSample, aStd, wStd, wSample].some(isNaN) || aStd === 0 || wSample === 0) return undefined;
      return ((aSample / aStd) * (wStd / wSample) * (purity / 100) * 100).toFixed(2);
    }
    if (tp.name === "Heavy Metals") {
      const val = parseFloat(inputs["result"] || "");
      return isNaN(val) ? undefined : val.toFixed(1);
    }
    return undefined;
  }, [tp, inputs]);

  // Check if result is out of spec
  const isOOS = useMemo(() => {
    if (!tp || tp.resultType !== "Quantitative" || !calculatedResult) return false;
    const val = parseFloat(calculatedResult);
    if (isNaN(val)) return false;
    if (tp.operator === "NMT" && tp.maxValue !== undefined) return val > tp.maxValue;
    if (tp.operator === "NLT" && tp.minValue !== undefined) return val < tp.minValue;
    if (tp.operator === "Between" && tp.minValue !== undefined && tp.maxValue !== undefined) return val < tp.minValue || val > tp.maxValue;
    return false;
  }, [tp, calculatedResult]);

  // Auto-conclusion
  const autoConclusion = useMemo(() => {
    if (!tp) return "";
    if (tp.resultType === "Qualitative") return conclusion;
    if (!calculatedResult) return "";
    return isOOS ? "Not Satisfactory" : "Satisfactory";
  }, [tp, calculatedResult, isOOS, conclusion]);

  // Check instrument expiry
  const selectedInstrument = SEED_INSTRUMENTS.find((i) => i.id === instrumentId);
  const instrumentExpired = selectedInstrument ? new Date(selectedInstrument.useBeforeDate) < new Date() : false;

  // Check reagent expiry
  const expiredReagents = reagentIds.map((id) => SEED_REAGENTS.find((r) => r.id === id)).filter((r) => r && new Date(r.expiryDate) < new Date());

  const isOutsideLab = tp && !tp.mandatory && tp.name === "Heavy Metals";

  const applyPrototypeResult = useCallback(() => {
    if (!tp) return;

    if (tp.resultType === "Qualitative") {
      setObservations(tp.acceptanceCriteria || moa?.conclusionTemplate || "Complies as per specification");
      setConclusion("Satisfactory");
      return;
    }

    if (tp.name === "pH") {
      setInputs((prev) => ({ ...prev, pH: "6.20" }));
      return;
    }

    if (tp.name === "Loss on Drying") {
      setInputs((prev) => ({ ...prev, W1: "1.000", W2: "0.998" }));
      return;
    }

    if (tp.name === "Assay") {
      setInputs((prev) => ({
        ...prev,
        A_sample: "1000",
        A_standard: "1000",
        W_standard: "0.200",
        W_sample: "0.200",
        Purity: "99.8",
      }));
      return;
    }

    if (tp.name === "Heavy Metals") {
      setInputs((prev) => ({ ...prev, result: "2.0" }));
      setOutsideLabRef((prev) => prev || `OL-${batch?.batchNo || "BATCH"}-HM`);
      setOutsideLabDate((prev) => prev || new Date().toISOString().slice(0, 10));
    }
  }, [tp, moa, batch]);

  const buildSection = useCallback((): AwsTestSection => {
    return {
      ...section!,
      instrumentId: instrumentId || undefined,
      reagents: reagentIds.map((rid) => {
        const r = SEED_REAGENTS.find((rg) => rg.id === rid);
        return { reagentId: rid, lotNo: r?.lotNo || "", prepDate: r?.preparationDate || "", expiryDate: r?.expiryDate || "" };
      }),
      observations,
      inputs,
      calculatedResult: tp?.resultType === "Quantitative" ? calculatedResult || undefined : observations,
      conclusion: tp?.resultType === "Quantitative" ? autoConclusion : conclusion,
      oosAcknowledged: isOOS ? oosAcknowledged : false,
      expiredInstrumentAcknowledged: instrumentExpired ? expiredInstrAck : false,
      expiredReagentAcknowledged: expiredReagents.length > 0 ? expiredReagentAck : false,
      outsideLabReportRef: outsideLabRef || undefined,
      outsideLabDate: outsideLabDate || undefined,
      lastSaved: getNow(),
    };
  }, [section, instrumentId, reagentIds, observations, inputs, calculatedResult, autoConclusion, conclusion, tp, isOOS, oosAcknowledged, instrumentExpired, expiredInstrAck, expiredReagents, expiredReagentAck, outsideLabRef, outsideLabDate]);

  const handleSave = useCallback(() => {
    if (!section) return;
    const updated = buildSection();
    updated.status = "InProgress";
    updateAwsSection(updated);
    setLastSaved(getNow());
    addAudit("SAVE_DRAFT", "AWS", docId, awsDoc?.docNo, "section", undefined, sectionId);
    toast.success("Section saved");
  }, [section, buildSection, updateAwsSection, addAudit, docId, awsDoc, sectionId]);

  const handleMarkComplete = () => {
    if (!section || !tp) return;
    // Validate
    if (tp.resultType === "Quantitative" && !instrumentId) { toast.error("Select the instrument used"); return; }
    if (tp.resultType === "Quantitative" && !calculatedResult) { toast.error("Enter all formula inputs to calculate result"); return; }
    if (tp.resultType === "Qualitative" && !observations) { toast.error("Enter observations"); return; }
    if (tp.resultType === "Qualitative" && !conclusion) { toast.error("Select a conclusion"); return; }
    if (isOOS && !oosAcknowledged) { toast.error("You must acknowledge the OOS result"); return; }
    if (instrumentExpired && !expiredInstrAck) { toast.error("Acknowledge expired instrument"); return; }
    if (expiredReagents.length > 0 && !expiredReagentAck) { toast.error("Acknowledge expired reagent(s)"); return; }
    if (isOutsideLab && (!outsideLabRef || !outsideLabDate)) { toast.error("Enter outside laboratory report details"); return; }

    const updated = buildSection();
    updated.status = "Completed";
    updated.completedAt = getNow();
    updated.conclusion = tp.resultType === "Quantitative" ? autoConclusion : conclusion;
    updateAwsSection(updated);
    addAudit("MARK_COMPLETE", "AWS", docId, awsDoc?.docNo, "section", undefined, sectionId);
    toast.success("Section marked complete");
    router.push(`/qc/aws/${docId}`);
  };

  // Auto-save every 30s
  useEffect(() => {
    if (!section || awsDoc?.status !== "DRAFT") return;
    const timer = setInterval(() => { handleSave(); }, 30000);
    return () => clearInterval(timer);
  }, [section, awsDoc, handleSave]);

  if (!currentUser || !awsDoc || !batch || !product || !section || !tp) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading section...</p></div>;
  }

  const getLimits = () => {
    if (tp.resultType === "Qualitative") return tp.acceptanceCriteria || "—";
    if (tp.operator === "NMT") return `NMT ${tp.maxValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "NLT") return `NLT ${tp.minValue} ${tp.uom || ""}`.trim();
    if (tp.operator === "Between") return `${tp.minValue} – ${tp.maxValue} ${tp.uom || ""}`.trim();
    return "—";
  };

  const formulaInputFields: { key: string; label: string; uom: string }[] = (() => {
    if (tp.name === "pH") return [{ key: "pH", label: "pH Reading", uom: "" }];
    if (tp.name === "Loss on Drying") return [{ key: "W1", label: "Initial Weight (W₁)", uom: "g" }, { key: "W2", label: "Final Weight (W₂)", uom: "g" }];
    if (tp.name === "Assay") return [{ key: "A_sample", label: "Peak Area (Sample)", uom: "" }, { key: "A_standard", label: "Peak Area (Standard)", uom: "" }, { key: "W_standard", label: "Wt. Standard", uom: "g" }, { key: "W_sample", label: "Wt. Sample", uom: "g" }, { key: "Purity", label: "Purity of RS", uom: "%" }];
    if (tp.name === "Heavy Metals") return [{ key: "result", label: "Result", uom: "ppm" }];
    return [];
  })();

  return (
    <div className="min-h-screen bg-brand-subtle">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/qc/aws/${docId}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to AWS
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <FlaskConical className="w-5 h-5 text-brand-primary" />
            <span className="font-semibold text-brand-primary">AC-QMS</span>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                <Clock className="w-3 h-3" /> Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <Badge variant="outline" className="text-xs">{currentUser.role.replace("_", " ")}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-lg font-bold">{tp.name}</h1>
          <Badge variant="outline">{tp.resultType}</Badge>
          {tp.mandatory && <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">Mandatory</Badge>}
          <Badge className="text-[10px]" variant="outline">Limits: {getLimits()}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Data Entry (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* A. Instrument */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="w-4 h-4" /> A. Instrument Used</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={instrumentId} onValueChange={(v) => setInstrumentId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select instrument..." /></SelectTrigger>
                  <SelectContent>
                    {SEED_INSTRUMENTS.filter((i) => i.department === "QC").map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.instrumentId}) — Cal: {fmtDate(inst.calibrationDate)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {instrumentExpired && (
                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800">Calibration expired on {fmtDate(selectedInstrument!.useBeforeDate)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox id="ack-inst" checked={expiredInstrAck} onCheckedChange={(v) => setExpiredInstrAck(!!v)} />
                          <Label htmlFor="ack-inst" className="text-xs text-orange-700 cursor-pointer">Acknowledge & Continue</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* B. Reagents */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Beaker className="w-4 h-4" /> B. Reagents / Solutions Used</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {reagentIds.map((rid, idx) => {
                  const rgt = SEED_REAGENTS.find((r) => r.id === rid);
                  const isExp = rgt && new Date(rgt.expiryDate) < new Date();
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-md border ${isExp ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}>
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{rgt?.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">Lot: {rgt?.lotNo} | Exp: {rgt ? fmtDate(rgt.expiryDate) : "—"}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setReagentIds((prev) => prev.filter((_, i) => i !== idx))}>✕</Button>
                    </div>
                  );
                })}
                <Select onValueChange={(v) => { if (v != null) { const val = v as string; if (!reagentIds.includes(val)) setReagentIds((p) => [...p, val]); } }}>
                  <SelectTrigger><SelectValue placeholder="Add reagent..." /></SelectTrigger>
                  <SelectContent>
                    {SEED_REAGENTS.filter((r) => !reagentIds.includes(r.id)).map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} (Lot: {r.lotNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {expiredReagents.length > 0 && (
                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ack-rgt" checked={expiredReagentAck} onCheckedChange={(v) => setExpiredReagentAck(!!v)} />
                      <Label htmlFor="ack-rgt" className="text-xs text-orange-700 cursor-pointer">Acknowledge expired reagent(s) & continue</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* C. Observations / Results */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> C. Test Observations</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={applyPrototypeResult}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Use Expected Result
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {tp.resultType === "Qualitative" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Observation</Label>
                      <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Enter your observation..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Conclusion</Label>
                      <Select value={conclusion} onValueChange={(v) => setConclusion(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Select conclusion..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                          <SelectItem value="Not Satisfactory">Not Satisfactory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {formulaInputFields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-xs">{field.label} {field.uom && <span className="text-muted-foreground">({field.uom})</span>}</Label>
                          <Input type="number" step="any" value={inputs[field.key] || ""} onChange={(e) => setInputs((p) => ({ ...p, [field.key]: e.target.value }))} placeholder="0.000" />
                        </div>
                      ))}
                    </div>
                    {moa?.formula && (
                      <div className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-md">{moa.formula}</div>
                    )}
                    {/* Result display */}
                    {calculatedResult && (
                      <div className={`rounded-lg p-4 border-2 ${isOOS ? "border-orange-400 bg-orange-50" : "border-green-400 bg-green-50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Calculated Result</p>
                            <p className={`text-2xl font-bold ${isOOS ? "text-orange-700" : "text-green-700"}`}>{calculatedResult} {tp.uom || ""}</p>
                          </div>
                          <Badge className={`text-sm px-3 py-1 ${isOOS ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-green-100 text-green-700 border-green-300"}`}>
                            {isOOS ? "⚠️ Out of Spec" : "✓ Within Limits"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Acceptance: {getLimits()}</p>
                      </div>
                    )}
                    {/* OOS Banner */}
                    {isOOS && (
                      <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-orange-800">Out of Specification!</p>
                            <p className="text-sm text-orange-700 mt-1">Result {calculatedResult} {tp.uom || ""} is outside acceptance range ({getLimits()}).</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Checkbox id="ack-oos" checked={oosAcknowledged} onCheckedChange={(v) => setOosAcknowledged(!!v)} />
                              <Label htmlFor="ack-oos" className="text-sm text-orange-800 font-medium cursor-pointer">Acknowledge & Continue</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Auto conclusion */}
                    {calculatedResult && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Conclusion:</span>
                        <span className={autoConclusion === "Satisfactory" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{autoConclusion}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* E. Outside Lab (conditional) */}
            {isOutsideLab && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">E. Outside Laboratory Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-xs">Report Reference No.</Label><Input value={outsideLabRef} onChange={(e) => setOutsideLabRef(e.target.value)} placeholder="e.g., OL-2026-001" /></div>
                    <div className="space-y-1"><Label className="text-xs">Date of Analysis</Label><Input type="date" value={outsideLabDate} onChange={(e) => setOutsideLabDate(e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 pb-6">
              <Button variant="outline" onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
              <Button className="bg-brand-highlight hover:bg-brand-highlight/90" onClick={handleMarkComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete & Return
              </Button>
            </div>
          </div>

          {/* RIGHT: MOA Reference (40%) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-800 flex items-center gap-2"><FileText className="w-4 h-4" /> MOA Procedure Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {moa ? (
                    <>
                      <div><p className="font-medium text-blue-700 text-xs mb-1">Pharmacopoeia</p><p>{moa.pharmacopoeia}</p></div>
                      <Separator />
                      <div><p className="font-medium text-blue-700 text-xs mb-1">Sample Preparation</p><p className="text-xs leading-relaxed">{moa.samplePrep}</p></div>
                      <Separator />
                      <div><p className="font-medium text-blue-700 text-xs mb-1">Standard Preparation</p><p className="text-xs leading-relaxed">{moa.standardPrep}</p></div>
                      {moa.blankPrep && (<><Separator /><div><p className="font-medium text-blue-700 text-xs mb-1">Blank Preparation</p><p className="text-xs leading-relaxed">{moa.blankPrep}</p></div></>)}
                      {moa.formula && (<><Separator /><div><p className="font-medium text-blue-700 text-xs mb-1">Formula</p><p className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">{moa.formula}</p></div></>)}
                      <Separator />
                      <div><p className="font-medium text-blue-700 text-xs mb-1">Acceptance Criteria</p><p className="text-xs font-semibold">{getLimits()}</p></div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">No MOA procedure available for this test.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
