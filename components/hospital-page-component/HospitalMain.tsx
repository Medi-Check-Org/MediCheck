import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingTable } from "@/components/ui/loading"
import { Package, AlertTriangle, TrendingUp, Clock, CheckCircle, QrCode, Building2 } from "lucide-react";
import { ManufacturerTab } from "@/utils";
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle";

interface HospitalStats {
    totalMedications: number;
    medicationGrowth: number;
    verifiedToday: number;
    verificationDifference: number;
    pendingVerifications: number;
    alerts: number;
}

const HospitalMain = ({ setActiveTab, orgId }: { 
    setActiveTab: React.Dispatch<React.SetStateAction<ManufacturerTab>>;
    orgId: string;
}) => {
    const [stats, setStats] = useState<HospitalStats>({
        totalMedications: 0,
        medicationGrowth: 0,
        verifiedToday: 0,
        verificationDifference: 0,
        pendingVerifications: 0,
        alerts: 0,
    });
    const [loading, setLoading] = useState(true);
    const [hospitalName, setHospitalName] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            if (!orgId) return;
            
            try {
                setLoading(true);
                const response = await fetch(`/api/web/dashboard/hospital-stats?orgId=${orgId}`);
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching hospital stats:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchHospitalName = async () => {
            if (!orgId) return;
            try {
                const response = await fetch(`/api/web/organizations/info?orgId=${orgId}`);
                if (response.ok) {
                    const data = await response.json();
                    setHospitalName(data.companyName);
                }
            } catch (error) {
                setHospitalName("");
            }
        };

        fetchStats();
        fetchHospitalName();
    }, [orgId]);

    const handleVerifyMedication = () => {
        setActiveTab("qr-scanner");
    }

    const handleViewAnalytics = () => {
        setActiveTab("reports")
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-7 w-48 rounded" aria-hidden="true" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-5">
                            <div className="skeleton h-3 w-24 rounded mb-4" />
                            <div className="skeleton h-7 w-16 rounded mb-2" />
                            <div className="skeleton h-3 w-32 rounded" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-lg p-5">
                        <LoadingTable rows={3} columns={2} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="font-bold text-2xl sm:text-3xl text-foreground">Hospital Dashboard</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-base sm:text-lg">
                      Welcome{hospitalName ? ` to ${hospitalName}` : " to your hospital"}
                    </p>
                </div>
                <div className="flex items-center justify-start sm:justify-end gap-2">
                    <span className="hidden sm:inline">
                        <ThemeToggle />
                    </span>
                    <Badge variant="hospital" className="px-3 py-1.5 text-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        Hospital
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Medications</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalMedications.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`font-medium ${stats.medicationGrowth >= 0 ? 'text-status-verified' : 'text-destructive'}`}>
                                {stats.medicationGrowth >= 0 ? '+' : ''}{stats.medicationGrowth}%
                            </span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Verified Today</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-status-verified/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-status-verified" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.verifiedToday}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className={`font-medium ${stats.verificationDifference >= 0 ? 'text-status-verified' : 'text-destructive'}`}>
                                {stats.verificationDifference >= 0 ? '+' : ''}{stats.verificationDifference}
                            </span> {stats.verificationDifference === 1 || stats.verificationDifference === -1 ? 'more' : 'from'} yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-status-warning/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-status-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-warning">{stats.pendingVerifications}</div>
                        <p className="text-xs text-muted-foreground">Awaiting verification</p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.alerts}</div>
                        <p className="text-xs text-muted-foreground">
                            Expired &amp; expiring medications
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-semibold text-foreground">Quick Actions</CardTitle>
                        <CardDescription>Common hospital tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" onClick={handleVerifyMedication}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Verify Medication
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={() => setActiveTab("inventory")}
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Check Inventory
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={handleViewAnalytics}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Analytics
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default HospitalMain;
