import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Mail, Phone, MapPin, User } from "lucide-react";
import { useState, useEffect } from "react";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface OrganizationData {
    companyName: string;
    contactEmail: string;
    contactPhone: string | null;
    contactPersonName: string | null;
    address: string;
    country: string;
    state: string | null;
    licenseNumber: string | null;
    nafdacNumber: string | null;
    businessRegNumber: string | null;
    rcNumber: string | null;
    pcnNumber: string | null;
}

const ManufacturerSettings = () => {
    const [orgData, setOrgData] = useState<OrganizationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const response = await fetch('/api/web/organizations/me');
                if (response.ok) {
                    const data = await response.json();
                    setOrgData(data.organization);
                }
            } catch (error) {
                console.error('Error fetching organization data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgData();
    }, []);

    if (loading) return <UniversalLoader text="Loading Settings." />;

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-6">
            
            <div className=" flex-col gap-y-2 md:flex-row flex md:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
                    <p className="text-muted-foreground">Review and manage your manufacturing facility details.</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">Manufacturer Account</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: General & Regulatory */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <CardTitle>Facility Identification</CardTitle>
                            </div>
                            <CardDescription>Official business details and registrations</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoBlock label="Facility Name" value={orgData?.companyName} />
                                <InfoBlock label="RC Number" value={orgData?.rcNumber} />
                            </div>

                            {/* <Separator /> */}

                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold">Compliance & Licenses</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoBlock label="NAFDAC Reg No." value={orgData?.nafdacNumber} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <CardTitle>Location</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground leading-relaxed">
                                {orgData?.address}<br />
                                <span className="font-medium">{orgData?.state}, {orgData?.country}</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Contact Personnel */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <CardTitle className="text-lg">Contact Person</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoBlock label="Name" value={orgData?.contactPersonName} icon={<User className="w-3 h-3" />} />
                            <InfoBlock label="Email" value={orgData?.contactEmail} icon={<Mail className="w-3 h-3" />} />
                            <InfoBlock label="Phone" value={orgData?.contactPhone} icon={<Phone className="w-3 h-3" />} />
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs text-blue-800 leading-tight">
                            <strong>Need to update this info?</strong><br />
                            Please contact the administrator or support to modify verified regulatory data.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

/** Reusable sub-component for layout consistency */
const InfoBlock = ({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) => (
    <div className="space-y-1">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
            {icon} {label}
        </label>
        <p className="text-sm font-medium text-foreground">{value || "Not provided"}</p>
    </div>
);

export default ManufacturerSettings;