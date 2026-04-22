import React from 'react';
import { PackagePlus, LayoutGrid, ArrowRight, X } from 'lucide-react';

// Types for the  logic
export type BatchCreationMethod = 'attach-existing' | 'create-new';

interface CreateBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (method: BatchCreationMethod) => void;
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-2xl border border-border m-4 relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">Initialize Production Batch</h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Choose a manufacturing workflow to begin your batch registration.
                    </p>
                </div>

                {/* Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Method 1: Attach Existing */}
                    <button
                        onClick={() => onSelect('attach-existing')}
                        className="group flex flex-col items-start p-6 text-left border-2 border-transparent bg-muted/20 hover:bg-accent/5 hover:border-accent transition-all duration-300 rounded-xl relative ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="mb-5 p-3 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                            <PackagePlus size={32} strokeWidth={1.5} />
                        </div>
                        <h4 className="font-bold text-lg text-foreground mb-2">Attach Existing Units</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            Select verified units from your inventory to group into a new batch ID.
                        </p>
                        <div className="mt-auto flex items-center text-xs font-semibold uppercase tracking-wider text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Continue <ArrowRight size={14} className="ml-2" />
                        </div>
                    </button>

                    {/* Method 2: Create New Everything */}
                    <button
                        onClick={() => onSelect('create-new')}
                        className="group flex flex-col items-start p-6 text-left border-2 border-transparent bg-muted/20 hover:bg-primary/5 hover:border-primary transition-all duration-300 rounded-xl relative ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="mb-5 p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <LayoutGrid size={32} strokeWidth={1.5} />
                        </div>
                        <h4 className="font-bold text-lg text-foreground mb-2">New Batch & Units</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            Generate both the batch and its child units simultaneously from production templates.
                        </p>
                        <div className="mt-auto flex items-center text-xs font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Continue <ArrowRight size={14} className="ml-2" />
                        </div>
                    </button>

                </div>

                {/* Contextual Note */}
                <div className="mt-8 pt-6 border-t border-border/60">
                    <p className="text-[11px] text-muted-foreground text-center italic">
                        All batch operations are logged under the manufacturer ID for regulatory compliance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateBatchModal;