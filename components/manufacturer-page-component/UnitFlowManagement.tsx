"use client"
import { useState, useEffect, useCallback } from 'react';
import UnitQrcode from './components/UnitQrcode';
import UnitRangeSelection from './components/UnitRangeSelection';
import { Product, MedicationUnit } from '@/lib/generated/prisma/browser';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '@/components/ui/loading';
import { AlertCircle, RefreshCcw } from 'lucide-react';

const UnitFlowManagement = ({ orgId }: { orgId: string }) => {
    const [step, setStep] = useState(1);
    const [mintedUnits, setMintedUnits] = useState<MedicationUnit[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {

            const res = await fetch(`/api/web/products?organizationId=${orgId}`);

            const data = await res.json();


            if (res.ok) {
                setProducts(data.products || []);
            } else {
                const errorMsg = data.error || "Failed to load products from the unit pool.";
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch {
            const genericError = "A network error occurred while fetching products.";
            setError(genericError);
            toast.error(genericError);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (orgId) {
            loadProducts();
        }
    }, [orgId, loadProducts]);

    const handleMintingComplete = (newUnits: MedicationUnit[]) => {
        setMintedUnits(newUnits);
        setStep(2);
    };

    if (loading) return (
        <div className="flex justify-end min-h-full w-full p-6">
            <LoadingSpinner text="Accessing Product Pool..." />
        </div>
    );

    if (error) return (
        <div className="flex justify-end min-h-full w-full p-6">
            <div className="w-96 bg-white border border-red-100 rounded-xl shadow-sm p-8 flex flex-col items-center text-center">
                <div className="bg-red-50 p-3 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Data Load Failed</h3>
                <p className="text-sm text-slate-500 mb-6">{error}</p>
                <button
                    onClick={loadProducts}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Retry Loading
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex justify-end min-h-full w-full">
            {step === 1 ? (
                <UnitRangeSelection
                    products={products}
                    onSuccess={handleMintingComplete}
                    orgId={orgId}
                />
            ) : (
                <UnitQrcode
                    units={mintedUnits}
                    onBack={() => setStep(1)}
                />
            )}
        </div>
    );
};

export default UnitFlowManagement;