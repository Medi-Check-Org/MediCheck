"use client";

import { useState } from "react";
import { Layers, AlertCircle, Package, CheckCircle2, X } from "lucide-react";
import { Product } from "@/lib/generated/prisma/browser";
import { MedicationBatchInfoProps } from "@/utils";

interface BatchGroupingProps {
    products: Product[];
    availableBatches: MedicationBatchInfoProps[];
    organizationId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BatchGrouping({
    products,
    availableBatches,
    organizationId,
    onSuccess,
    onCancel,
}: BatchGroupingProps) {

    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    /** * FILTER LOGIC:
     * 1. Must match the selected product.
     * 2. parentBatchId MUST be null (it isn't already inside another container).
     * * Note: This allows "Batch AA" (which contains Batch A) to be visible 
     * so it can be put into "Batch AAA".
     */
    const filteredBatches = availableBatches.filter(
        (b) => b.productId === selectedProductId && b.parentBatchId === null
    );

    const totalUnits = filteredBatches
        .filter((b) => selectedBatchIds.includes(b.id))
        .reduce((acc, curr) => acc + curr.batchSize, 0);

    const handleGroup = async () => {
        if (selectedBatchIds.length < 2) {
            setError("Please select at least two batches to group.");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/web/batches/group", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // Dynamic naming could be added here if needed
                    drugName: products.find(p => p.id === selectedProductId)?.name || "Aggregated Batch",
                    selectedBatchIds, // Passing IDs to the new logic we wrote
                    productId: selectedProductId,
                    orgId: organizationId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create parent batch");
            }

            onSuccess();
            setSelectedBatchIds([]);
        } catch (err: any) {
            setError(err.message || "Failed to group selected batches.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors z-10">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-center gap-4 bg-muted/10">
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Aggregate Batches</h2>
                        <p className="text-xs text-muted-foreground">Group top-level batches into a new container</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* 01. Product Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Select Product Type</label>
                        <select
                            className="w-full h-11 px-4 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none transition-all cursor-pointer"
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setSelectedBatchIds([]);
                                setError("");
                            }}
                        >
                            <option value="">Select a drug product...</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 02. Batch Selection List */}
                    {selectedProductId && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-foreground">Available Top-Level Batches</label>
                                <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                    {selectedBatchIds.length} Selected
                                </span>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredBatches.length > 0 ? (
                                    filteredBatches.map((batch) => (
                                        <div
                                            key={batch.id}
                                            onClick={() => {
                                                setSelectedBatchIds(prev =>
                                                    prev.includes(batch.id) ? prev.filter(id => id !== batch.id) : [...prev, batch.id]
                                                );
                                            }}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selectedBatchIds.includes(batch.id)
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border bg-background hover:border-muted-foreground/30"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold">{batch.batchId}</p>
                                                    {/* Visual cue if this batch is already a parent of others */}
                                                    {availableBatches.some(ab => ab.parentBatchId === batch.id) && (
                                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                            Container
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {batch.batchSize} Items • Created {new Date(batch.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {selectedBatchIds.includes(batch.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 px-4 border border-dashed rounded-lg border-muted">
                                        <p className="text-xs text-muted-foreground italic">No top-level batches available for grouping.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Handling */}
                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleGroup}
                            disabled={selectedBatchIds.length < 2 || creating}
                            className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                        >
                            {creating ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <Layers className="w-4 h-4" />
                                    Group {selectedBatchIds.length} Batches ({totalUnits} Items)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}