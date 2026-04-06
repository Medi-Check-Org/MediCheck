import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Hash, CheckCircle2, AlertCircle, Loader2, Package, X, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, MedicationUnit } from '@/lib/generated/prisma/browser';

interface AttachUnitsContainerProps {
    onSuccess: (selectedUnits: MedicationUnit[], productId: string) => Promise<void>;
    onCancel: () => void;
    orgId: string;
    products: Product[];
}

const AttachUnitsContainer: React.FC<AttachUnitsContainerProps> = ({ 
    onSuccess, 
    onCancel, 
    orgId, 
    products 
}) => {
    const [allUnits, setAllUnits] = useState<MedicationUnit[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [endRange, setEndRange] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch Units on Mount
    useEffect(() => {
        const fetchAvailableUnits = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/web/units?orgId=${orgId}`);
                const formattedResponse = await response.json();
                // Filter units that aren't already in a batch (batchId === null)
                const availableUnits = (formattedResponse.units || []).filter(
                    (u: MedicationUnit) => !u.batchId
                );
                setAllUnits(availableUnits);
            } catch (error) {
                console.error("Failed to fetch units", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableUnits();
    }, [orgId]);

    // 2. Filter units based on the Product selected from props
    const filteredUnits = useMemo(() => {
        if (!selectedProductId) return [];
        return allUnits
            .filter(u => u.productId === selectedProductId)
            .sort((a, b) => parseInt(a.mintedUnitId || '0') - parseInt(b.mintedUnitId || '0'));
    }, [allUnits, selectedProductId]);

    // 3. Derived boundaries for the specific product
    const startingUnitId = filteredUnits.length > 0 ? filteredUnits[0].mintedUnitId : '0000';
    const maxAvailableId = filteredUnits.length > 0 ? filteredUnits[filteredUnits.length - 1].mintedUnitId : '0000';

    const startNum = parseInt(startingUnitId || '0', 10);
    const maxNum = parseInt(maxAvailableId || '0', 10);
    const endNum = parseInt(endRange, 10);

    // Auto-fill endRange when product changes to save user time
    useEffect(() => {
        if (selectedProductId && maxAvailableId !== '0000') {
            setEndRange(maxAvailableId || '');
        } else {
            setEndRange('');
        }
    }, [selectedProductId, maxAvailableId]);

    const isValid = useMemo(() => {
        return (
            selectedProductId !== '' &&
            !isNaN(endNum) &&
            endNum >= startNum &&
            endNum <= maxNum &&
            filteredUnits.length > 0
        );
    }, [endNum, startNum, maxNum, selectedProductId, filteredUnits]);

    const unitCount = isValid ? endNum - startNum + 1 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            // Find the product name from the props array to include in payload
            const selectedProduct = products.find(p => p.id === selectedProductId);

            const payload = {
                drugName: selectedProduct?.name || "Unknown Product",
                unitStartRange: startingUnitId, 
                unitStopRange: endRange,      
                productId: selectedProductId,
                orgId: orgId
            };

            const response = await fetch('/api/web/batches/create/attachExistingUnits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to create batch');
            }

            // Filter the units objects to pass to the parent onSuccess if needed
            const unitsAttached = filteredUnits.filter(u => {
                const val = parseInt(u.mintedUnitId || '0', 10);
                return val >= startNum && val <= endNum;
            });

            await onSuccess(unitsAttached, selectedProductId);

        } catch (error) {
            console.error("Batch creation failed:", error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                
                <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors z-10">
                    <X size={20} />
                </button>

                {loading ? (
                    <div className="p-8 space-y-6 animate-pulse">
                        <div className="h-10 w-full bg-muted rounded" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-muted rounded" />
                            <div className="h-16 bg-muted rounded" />
                        </div>
                        <div className="h-24 bg-muted rounded" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white text-foreground">
                        <div className="bg-white px-6 py-5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary tracking-tight">Attach Existing Units</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Assign unattached inventory to a new batch.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Product Select using PROPS */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                    <Filter size={12} /> 1. Select Product
                                </Label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                    <SelectTrigger className="w-full bg-white border-border border">
                                        <SelectValue placeholder="Select a product to see available units" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-border">
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                                                {p.name} <span className="text-[10px] opacity-50 ml-2">({p.strength}mg)</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Range Section */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300 ${!selectedProductId ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Starting ID</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                                        <input 
                                            disabled 
                                            value={startingUnitId ?? ""} 
                                            className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border text-muted-foreground rounded-md font-mono text-sm" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Ending ID</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" size={16} />
                                        <input
                                            type="text"
                                            value={endRange}
                                            onChange={(e) => setEndRange(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-md font-mono text-sm focus:ring-2 outline-none transition-all ${
                                                isValid ? 'border-accent focus:ring-accent/20' : 'border-destructive/50'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Summary Feedback */}
                            {selectedProductId && (
                                <div className={`p-4 rounded-lg border transition-all ${
                                    isValid ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
                                }`}>
                                    {isValid ? (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="text-accent mt-0.5" size={18} />
                                            <div>
                                                <p className="text-sm font-semibold text-primary">Include {unitCount} Units</p>
                                                <p className="text-[11px] text-muted-foreground">Range: {startingUnitId} → {endRange}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 text-destructive">
                                            <AlertCircle className="mt-0.5" size={18} />
                                            <p className="text-xs font-medium">
                                                {filteredUnits.length === 0 
                                                    ? "No unattached units found for this product." 
                                                    : `Enter an ID between ${startingUnitId} and ${maxAvailableId}.`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 bg-muted/10 border-t border-border gap-3">
                            <Button type="button" variant="ghost" onClick={onCancel} className="font-semibold">Cancel</Button>
                            <Button 
                                type="submit" 
                                disabled={!isValid || isSubmitting} 
                                className="bg-primary hover:bg-primary/90 text-white px-8 font-bold shadow-sm transition-all"
                            >
                                {isSubmitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : 'Create Batch'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AttachUnitsContainer;