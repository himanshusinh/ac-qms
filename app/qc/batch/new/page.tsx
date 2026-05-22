"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_PRODUCTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function NewBatchPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const createBatch = useAppStore((s) => s.createBatch);
  const router = useRouter();

  const [productId, setProductId] = useState("prod-glycine");
  const [batchNo, setBatchNo] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const [arNo, setArNo] = useState("");
  const [qtySampled, setQtySampled] = useState("");
  const [qtySampledUom, setQtySampledUom] = useState("g");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "QC_EXEC") router.push("/login");
  }, [currentUser, router]);

  const valid = productId && batchNo && mfgDate && expDate && arNo && qtySampled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const batch = createBatch({ productId, batchNo, mfgDate, expDate, arNo, qtySampled, qtySampledUom });
    if (batch) {
      toast.success(`Batch ${batchNo} initiated successfully`);
      router.push(`/qc/batch/${batch.id}`);
    } else {
      toast.error("Failed to create batch");
    }
  };

  if (!currentUser) return null;
  const product = SEED_PRODUCTS.find((p) => p.id === productId);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Initiate New Batch</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batch Information</CardTitle>
          <CardDescription>Enter sampling and batch details to start the 4-document quality release process.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEED_PRODUCTS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                </SelectContent>
              </Select>
              {product && (
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Formula: {product.formula}</span>
                  <span>MW: {product.molecularWeight} {product.mwUom}</span>
                  <span>Refs: {product.regulatoryRefs.join(", ")}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Batch No.</Label><Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="e.g., B-2026-001" /></div>
              <div className="space-y-2"><Label>A.R. No.</Label><Input value={arNo} onChange={(e) => setArNo(e.target.value)} placeholder="e.g., AR-2026-001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mfg. Date</Label><Input type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Exp. Date</Label><Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Qty Sampled</Label><Input value={qtySampled} onChange={(e) => setQtySampled(e.target.value)} placeholder="e.g., 50" /></div>
              <div className="space-y-2"><Label>UOM</Label>
                <Select value={qtySampledUom} onValueChange={(v) => setQtySampledUom(v ?? "g")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g (grams)</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => router.push("/qc/dashboard")}>Cancel</Button>
              <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90" disabled={!valid}>Create Batch</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
