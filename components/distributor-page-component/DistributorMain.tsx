import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import { Package, AlertTriangle, TrendingUp, Truck, Building2, QrCode } from "lucide-react";
import { ManufacturerTab } from "@/utils";
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle";

interface DistributorStats {
    totalBatches: number;
    totalBatchUnits: number;
    activeShipments: number;
    lowStockCount: number;
}

const DistributorMain = ({ setActiveTab, orgId }: { 
    setActiveTab: React.Dispatch<React.SetStateAction<ManufacturerTab>>;
    orgId: string;
}) => {
    const [stats, setStats] = useState<DistributorStats>({
        totalBatches: 0,
        totalBatchUnits: 0,
        activeShipments: 0,
        lowStockCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [distributorName, setDistributorName] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            if (!orgId) return;
            
            try {
                setLoading(true);
                const response = await fetch(`/api/web/batches?organizationId=${orgId}`); 
                if (response.ok) {
                    const result = await response.json();
                    const batches = result.data.batches;
                    const totalBatchUnits = batches.reduce((sum: number, batch: any) => sum + (batch.quantity || 0), 0);
                    
                    // Calculate active shipments (batches in transit)
                    const activeShipments = batches.filter((batch: any) => 
                        batch.status === "IN_TRANSIT" || batch.status === "DISPATCHED"
                    ).length;
                    
                    // Calculate low stock (batches with less than 100 units)
                    const lowStockCount = batches.filter((batch: any) => 
                        batch.quantity > 0 && batch.quantity < 100
                    ).length;
                    
                    setStats({
                        totalBatches: batches.length,
                        totalBatchUnits: totalBatchUnits,
                        activeShipments: activeShipments,
                        lowStockCount: lowStockCount,
                    });
                }
            } catch (error) {
                console.error('Error fetching distributor stats:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchDistributorName = async () => {
            if (!orgId) return;
            try {
                const response = await fetch(`/api/web/organizations/info?orgId=${orgId}`);
                if (response.ok) {
                    const data = await response.json();
                    setDistributorName(data.companyName);
                }
            } catch (error) {
                setDistributorName("");
            }
        };

        fetchStats();
        fetchDistributorName();
    }, [orgId]);

    const handleScanQR = () => {
        setActiveTab("qr-scanner");
    }

    const handleViewAnalytics = () => {
        setActiveTab("reports")
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="font-bold text-2xl sm:text-3xl text-foreground">Distributor Dashboard</h1>
                <div className="flex items-center justify-center p-8">
                    <LoadingSpinner size="large" text="Loading dashboard..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="font-bold text-2xl sm:text-3xl text-foreground">Distribution Center</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-base sm:text-lg">
                      Welcome{distributorName ? ` to ${distributorName} - Wholesale Distribution` : " to your distribution center"}
                    </p>
                </div>
                <div className="flex items-center justify-start sm:justify-end gap-2">
                    <span className="hidden sm:inline">
                        <ThemeToggle />
                    </span>
                    <Badge variant="distributor" className="px-3 py-1.5 text-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        Distributor
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Batches</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalBatches.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            In warehouse inventory
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-status-verified/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-status-verified" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalBatchUnits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Available for distribution
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Shipments</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-accent" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-accent">{stats.activeShipments}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently in transit
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-status-warning/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-status-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-warning">{stats.lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Batches need restocking
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-semibold text-foreground">Quick Actions</CardTitle>
                        <CardDescription>Wholesale distribution tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" onClick={() => setActiveTab("transfers")}>
                            <Truck className="h-4 w-4 mr-2" />
                            Dispatch Batch
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={handleScanQR}
                        >
                            <QrCode className="h-4 w-4 mr-2" />
                            Scan QR Code
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={() => setActiveTab("inventory")}
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Check Warehouse Stock
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={() => setActiveTab("alerts")}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            View Stock Alerts
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={handleViewAnalytics}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Distribution Analytics
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default DistributorMain
