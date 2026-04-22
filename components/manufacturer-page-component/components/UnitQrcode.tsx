// Treasure Mazeedah Adekanye: 2026-03-05
"use client"
import QRCode from 'react-qr-code';
import { FileDown, FileSpreadsheet, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { MedicationUnit } from '@/lib/generated/prisma/browser';

const UnitQrcode = ({ units, onBack }: { units: MedicationUnit[]; onBack: () => void }) => {
    const downloadExcel = () => console.log("Exporting to CSV...");
    const downloadPDF = () => window.print();

    return (
        <div className="w-full mx-auto bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Header: Integrated & Clean */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-background rounded-full transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Batch Registry</h2>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Ready for Carton Printing
                        </div>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Total Units</span>
                    <p className="text-lg font-bold text-foreground">{units.length}</p>
                </div>
            </div>

            {/* Scrollable List: Card-in-Card style */}
            <div className="max-h-[50vh] overflow-y-auto p-6 space-y-3 bg-background/50">
                {units.map((u) => (
                    <div
                        key={u.id}
                        className="flex items-center gap-5 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-all group shadow-sm"
                    >
                        <div className="bg-white p-2 rounded-md border border-border group-hover:scale-105 transition-transform">
                            <QRCode value={u.qrCode || ""} size={56} level="H" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Serial Number</span>
                            <h3 className="text-base font-bold text-foreground truncate uppercase tracking-wide">
                                UNIT-{u.mintedUnitId}
                            </h3>
                            <p className="text-[10px] font-mono text-primary truncate mt-0.5 opacity-60">
                                {u.qrCode}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions: System-unified Buttons */}
            <div className="p-6 border-t border-border bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={downloadExcel}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV for Printer
                    </button>

                    <button
                        onClick={downloadPDF}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-card border border-border text-foreground rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-muted active:scale-[0.98] transition-all"
                    >
                        <FileDown className="w-4 h-4" />
                        Download PDF Labels
                    </button>
                </div>

                <div className="flex items-center gap-2 justify-center pt-2 text-[10px] text-muted-foreground/60 font-medium italic">
                    <Printer className="w-3 h-3" />
                    Standard GS1-Compliant Output Format
                </div>
            </div>
        </div>
    );
};

export default UnitQrcode;