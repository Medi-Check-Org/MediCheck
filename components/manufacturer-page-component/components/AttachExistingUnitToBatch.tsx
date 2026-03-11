import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Hash, CheckCircle2, AlertCircle, Loader2, Package, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MedicationUnit } from "@/lib/generated/prisma/browser"

interface AttachUnitsContainerProps {
    onSuccess: () => Promise<void>;
    onCancel: () => void;
    orgId: string
}

const AttachUnitsContainer: React.FC<AttachUnitsContainerProps> = ({ onSuccess, onCancel, orgId }) => {
    const [units, setUnits] = useState<MedicationUnit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [endRange, setEndRange] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAvailableUnits = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/web/units?orgId=${orgId}`);
                const formattedResponse = await response.json();
                const data = formattedResponse.units
                setUnits(data);
                if (data.length > 0) {
                    setEndRange(data[data.length - 1].mintedUnitId);
                }
            } catch (error) {
                console.error("Failed to fetch units", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableUnits();
    }, []);

    const startingUnitId = units.length > 0 ? units[0]?.mintedUnitId : '0000';
    const maxAvailableId = units.length > 0 ? units[units.length - 1]?.mintedUnitId : '0000';

    const startNum = parseInt(startingUnitId ?? "", 10);
    const maxNum = parseInt(maxAvailableId ?? "", 10);
    const endNum = parseInt(endRange, 10);

    const isValid = useMemo(() => {
        return !isNaN(endNum) && endNum >= startNum && endNum <= maxNum;
    }, [endNum, startNum, maxNum]);

    const unitCount = isValid ? endNum - startNum + 1 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSuccess();
        } catch (error) {
            console.error("Batch creation failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300 px-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Loading State UI */}
                {loading ? (
                    <div className="p-8 space-y-6 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg" />
                            <div className="space-y-2">
                                <div className="h-5 w-40 bg-muted rounded" />
                                <div className="h-3 w-60 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-muted rounded-md" />
                            <div className="h-16 bg-muted rounded-md" />
                        </div>
                        <div className="h-20 bg-muted rounded-lg" />
                        <div className="flex justify-end gap-3 pt-2">
                            <div className="h-10 w-24 bg-muted rounded" />
                            <div className="h-10 w-32 bg-muted rounded" />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white">
                        {/* Header Section */}
                        <div className="bg-white px-6 py-5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary tracking-tight leading-none">Define Batch Range</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Select existing units to associate with this batch.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Start Range (Locked) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Lock size={12} /> Starting Unit ID
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                                        <input
                                            type="text"
                                            disabled
                                            value={startingUnitId ?? ""}
                                            className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border text-muted-foreground rounded-md cursor-not-allowed font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* End Range (Editable) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1">
                                        Ending Unit ID
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" size={16} />
                                        <input
                                            type="text"
                                            value={endRange}
                                            onChange={(e) => setEndRange(e.target.value)}
                                            placeholder={maxAvailableId ?? ""}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-md font-mono text-sm focus:ring-2 outline-none transition-all ${isValid ? 'border-accent focus:ring-accent/20' : 'border-destructive focus:ring-destructive/20'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Summary / Error Box */}
                            <div className={`p-4 rounded-lg border transition-all duration-300 ${isValid ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
                                }`}>
                                {isValid ? (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-accent mt-0.5" size={18} />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground leading-none">
                                                Confirm <span className="text-accent">{unitCount} Units</span>
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-1.5">
                                                Grouping serials <span className="font-mono font-bold">{startingUnitId}</span> through <span className="font-mono font-bold">{endRange}</span>.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 text-destructive">
                                        <AlertCircle className="mt-0.5" size={18} />
                                        <p className="text-xs font-medium">
                                            Please enter an ID between {startingUnitId} and {maxAvailableId}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end px-6 py-4 bg-muted/10 border-t border-border gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                                className="hover:bg-muted font-semibold text-sm h-10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isValid || isSubmitting}
                                className="bg-primary hover:bg-primary-hover text-white px-8 font-bold text-sm h-10 shadow-sm transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Batch'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AttachUnitsContainer;