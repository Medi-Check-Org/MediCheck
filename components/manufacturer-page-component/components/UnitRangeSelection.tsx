// Treasure Mazeedah Adekanye: 2026-02-22
"use client"
import { useState } from 'react';
import { Layers, PlusCircle, AlertCircle } from 'lucide-react';
import { Product, MedicationUnit } from '@/lib/generated/prisma/browser';
import { toast } from 'react-toastify';

interface Props {
    products: Product[];
    onSuccess: (units: MedicationUnit[]) => void;
    orgId: string;
}

const UnitRangeSelection = ({ products, onSuccess, orgId }: Props) => {
    const [selectedProductId, setSelectedProductId] = useState(products[0]?.id);
    const [quantity, setQuantity] = useState(0);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    const selectedProduct = products.find(p => p.id === selectedProductId) ?? products[0];

    const handleMint = async () => {
        if (creating) return;
        if (quantity > selectedProduct?.numberOfProductAvailable) {
            setError(`Insufficient units. Only ${selectedProduct?.numberOfProductAvailable} available.`);
            return;
        }

        setCreating(true);
        try {
            const createBody = {
                orgId: orgId,
                productId: selectedProductId,
                productQuantity: quantity,
            };

            const res = await fetch("/api/web/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createBody)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Units created successfully");
                onSuccess(data.units);
            } else {
                setError(String(data.error) || "Failed to create units");
            }
        } catch (error) {
            setError("Connection error. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="w-full h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Simple, Non-Technical Header */}
            <div className="px-6 py-5 border-b border-border flex items-center gap-4 bg-muted/10">
                <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Mint Batch Units</h2>
                    <p className="text-xs text-muted-foreground">Create individual drug units for tracking</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* 01. Product Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Drug Batch</label>
                    <select
                        className="w-full h-11 px-4 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none appearance-none transition-all cursor-pointer"
                        value={selectedProductId}
                        onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            setError("");
                        }}
                    >
                        {products.filter(p => p.numberOfProductAvailable > 0).map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} — ({p.numberOfProductAvailable} units remaining)
                            </option>
                        ))}
                    </select>
                </div>

                {/* 02. Quantity Input */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-foreground">Quantity to Mint</label>
                        {selectedProduct && (
                            <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                Limit: {selectedProduct?.numberOfProductAvailable}
                            </span>
                        )}
                    </div>
                    <input
                        type="number"
                        className="w-full h-11 px-4 bg-background border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="Enter amount"
                        value={quantity || ''}
                        max={selectedProduct?.numberOfProductAvailable ?? 0}
                        min={0}
                        onChange={(e) => {
                            setQuantity(parseInt(e.target.value) || 0);
                            setError("");
                        }}
                    />
                    {error && (
                        <div className="flex items-center gap-2 mt-2 text-destructive text-xs font-medium animate-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Button - Using your primary brand color */}
                <button
                    onClick={handleMint}
                    disabled={!quantity || quantity <= 0 || creating}
                    className="w-full h-12 mt-4 bg-primary text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                >
                    {creating ? (
                        <>
                            Processing...
                        </>
                    ) : (
                        <>
                            <PlusCircle className="w-4 h-4" />
                            Confirm & Mint Units
                        </>
                    )}
                </button>

                <p className="text-[11px] text-center text-muted-foreground/70">
                    This action will generate verifiable records for each individual unit.
                </p>
            </div>
        </div>
    );
};

export default UnitRangeSelection;