import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Info, Loader2, X } from "lucide-react";

const CreateNewBatchForm = ({
    newBatch,
    setNewBatch,
    products,
    orgId,
    handleCreateBatch,
    setIsCreateBatchOpen,
    isLoading
}: {
    newBatch: { drugName: string; batchSize: string };
    setNewBatch: React.Dispatch<React.SetStateAction<{ drugName: string; batchSize: string }>>;
    products: any[];
    orgId: string;
    handleCreateBatch: (e: React.FormEvent) => Promise<void>;
    setIsCreateBatchOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
}
) => {
    const selectedProduct = products.find(
        (product) => product.name === newBatch.drugName && product.organizationId === orgId
    );

    const isOverLimit = Number(newBatch.batchSize) > (selectedProduct?.numberOfProductAvailable || 0);

    return (
        <div
            className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300 px-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close Icon Button */}
                <button
                    onClick={() => setIsCreateBatchOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <form onSubmit={handleCreateBatch} className="bg-white">
                    {/* Header Section */}
                    <div className="bg-white px-6 py-5 border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                <Package size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-primary tracking-tight leading-none">New Batch Registration</h3>
                                <p className="text-xs text-muted-foreground mt-1">Initialize batch and generate child units.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Product Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="product" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Target Product
                                </Label>
                                <Select
                                    value={newBatch.drugName}
                                    onValueChange={(value) => setNewBatch({ ...newBatch, drugName: value })}>
                                    <SelectTrigger className="bg-white border-border focus:ring-accent h-10">
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {products.length > 0 ? (
                                            products.map((product) => (
                                                <SelectItem key={product.id} value={product.name}>
                                                    <span className="font-medium">{product.name}</span>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-products" disabled>No products found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Batch Size Input */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Quantity (Size)
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="e.g. 50"
                                    max={selectedProduct?.numberOfProductAvailable}
                                    min={1}
                                    value={newBatch.batchSize}
                                    onChange={(e) => setNewBatch({ ...newBatch, batchSize: e.target.value })}
                                    className={`bg-white border-border focus:ring-accent h-10 font-mono ${isOverLimit ? 'border-destructive text-destructive' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Availability Alert Area */}
                        <div className={`min-h-[60px] p-3 rounded-md border transition-colors flex items-start gap-3 ${isOverLimit ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-muted/30 border-border text-muted-foreground'
                            }`}>
                            <Info size={16} className="mt-0.5 shrink-0" />
                            <div className="text-[11px] leading-relaxed">
                                {selectedProduct ? (
                                    <>
                                        Current inventory allows for up to <span className="font-bold underline text-foreground">{selectedProduct.numberOfProductAvailable} units</span> of {selectedProduct.name}.
                                        {isOverLimit && <p className="font-bold mt-1">Error: Input exceeds available raw materials.</p>}
                                    </>
                                ) : (
                                    "Please select a product to view the maximum allowed batch size for your organization."
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end px-6 py-4 bg-muted/10 border-t border-border gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateBatchOpen(false)}
                            className="bg-white hover:bg-muted font-semibold text-sm h-10"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isLoading || !newBatch.drugName || !newBatch.batchSize || isOverLimit}
                            className="bg-primary hover:bg-primary-hover text-white px-8 font-bold text-sm h-10 shadow-sm"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Batch"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateNewBatchForm;