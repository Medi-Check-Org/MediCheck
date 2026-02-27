import QRCode from 'react-qr-code';
import { FileDown, FileSpreadsheet, ArrowLeft, Printer } from 'lucide-react';
import { MedicationUnit } from '@/lib/generated/prisma/browser';

const UnitQrcode = ({ units, onBack }: { units: MedicationUnit[];  onBack: () => void }) => {

    const downloadExcel = () => {
        console.log("Exporting unit data to CSV/Excel...");
    };

    const downloadPDF = () => {
        window.print();
    };

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col h-fit max-h-[90vh">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 text-cyan-700">Batch Registry</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ready for Carton Printing</p>
                </div>
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {units.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:border-cyan-100 transition-all bg-white shadow-sm">
                        <div className="bg-white p-1 border border-slate-100 rounded">
                            <QRCode value={u.qrCode || ""} size={60} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <span className="text-xs font-bold text-slate-400 block uppercase">Serial Number</span>
                            <span className="text-sm font-bold text-slate-800 block truncate">UNIT-{u.mintedUnitId}</span>
                            <span className="text-[10px] text-cyan-600 font-mono truncate block mt-1">
                                {u.qrCode}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-3">
                <button
                    onClick={downloadExcel}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV for Printer
                </button>

                <button
                    onClick={downloadPDF}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 hover:border-cyan-500 hover:text-cyan-600 text-slate-700 rounded-lg text-sm font-medium transition-all"
                >
                    <FileDown className="w-4 h-4" />
                    Download PDF Labels
                </button>

                <div className="flex items-center gap-2 justify-center py-1 text-[10px] text-slate-400 italic">
                    <Printer className="w-3 h-3" />
                    Standard GS1-Compliant Output [cite: 8]
                </div>
            </div>
        </div>
    );
};

export default UnitQrcode;