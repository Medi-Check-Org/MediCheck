import React, { useState, useEffect } from 'react';
import { ProductSchema } from '@/utils';
import { toast } from 'react-toastify';

const UpdateStockModal = ({ product, isOpen, onClose, onSuccess }: { product: ProductSchema, isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
    const [quantity, setQuantity] = useState(product?.numberOfProductAvailable || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Sync state if the product prop changes while modal is open
    useEffect(() => {
        if (product) {
            setQuantity(product.numberOfProductAvailable || 0);
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (quantity < 0) {
            setError("Stock cannot be less than zero.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/web/products/${product.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    numberOfProductAvailable: quantity,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            toast.success("Stock updated successfully!");

            onSuccess();
            
            onClose();
        }
        catch (err) {
            setError("Server error: Could not update stock.");
            console.error("Fetch error:", err);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-xl font-bold text-gray-900">Update Stock Level</h3>
            <p className="mb-6 text-sm text-gray-600">
                Editing: <span className="font-semibold text-gray-800">{product.name}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="stock-qty" className="text-sm font-medium text-gray-700">
                        New Quantity Available
                    </label>
                    <input
                        id="stock-qty"
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => {
                            setQuantity(parseInt(e.target.value) || 0);
                            if (error) setError("");
                        }}
                        className={`w-full rounded-md border px-3 py-2 outline-none transition-colors focus:ring-2 
                                ${error
                                ? "border-red-500 focus:ring-red-200"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                    />
                    {error && <span className="text-xs text-red-600">{error}</span>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-md cursor-pointer border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md cursor-pointer bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Syncing...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateStockModal;