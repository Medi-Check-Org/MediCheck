// Treasure Mazeedah Adekanye: 2026-02-22
"use client"
import { useState } from 'react';
import { Layers, Save, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading';
import { Product, UnitStatus, MedicationUnit } from '@/lib/generated/prisma/browser';
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
            setError(`Insufficient units. Only ${selectedProduct?.numberOfProductAvailable} available in pool.`);
            return;
        }

        setCreating(true)

        try {
            const createBody = {
                orgId: orgId,
                productId: selectedProductId,
                productQuantity: quantity,
            }

            const res = await fetch("/api/web/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createBody)
            });

            const data = await res.json();

            console.log("Unit Creation Response:", data);

            if (res.ok  && data.success) {

                toast.success("Product created successfully");

                onSuccess(data.units);
            }
            else {
                setError(String(data.error) || "Failed to create product");
            }
        } catch (error) {
            setError("Failed to create product");
        } finally {
            setCreating(false);
        }

    };


    return (
        <div className="w-full bg-card border border-border rounded-xl shadow-sm p-6 page-transition">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Layers className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Mint Batch Units</h2>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Select Product</label>
                    <select
                        className="w-full p-2.5 border border-gray-600 rounded-lg ring-transparent text-sm outline-none"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                        {products.filter(product => product.numberOfProductAvailable > 0).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({(p as any).numberOfProductAvailable} available)</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Batch Quantity</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full p-2.5 border border-gray-600 rounded-lg ring-transparent text-sm outline-none"
                            placeholder="Enter amount to mint"
                            value={quantity}
                            max={products.find(p => p.id === selectedProductId)?.numberOfProductAvailable}
                            min={1}
                            onChange={(e) => {
                                setQuantity(parseInt(e.target.value) || 0);
                                setError("");
                            }}
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-1.5 mt-2 text-destructive text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {error}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleMint}
                    disabled={!quantity || quantity <= 0}
                    className="w-full mt-2 cursor-pointer bg-[#0891b2] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                    {creating ? (
                        <div className="flex items-center gap-2">
                            <LoadingSpinner className="w-4 h-4 animate-spin" />
                            Creating Units...
                        </div>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Confirm & Mint Units
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UnitRangeSelection;