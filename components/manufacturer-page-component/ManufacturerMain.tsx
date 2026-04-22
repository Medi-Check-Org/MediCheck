import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingTable } from "@/components/ui/loading"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Factory,
    Package,
    QrCode,
    Truck,
    Activity,
} from "lucide-react";
import { ManufacturerTab } from "@/utils";
import { UniversalLoader } from "@/components/ui/universal-loader"



interface RecentActivity {
    id: string;
    type: 'batch' | 'transfer';
    batchId?: string;
    productName: string;
    fromEntity?: string;
    toEntity?: string;
    status: string;
    createdAt: string;
}

const ManufacturerMain = ({ setActiveTab, orgId }: { 
    setActiveTab: React.Dispatch<React.SetStateAction<ManufacturerTab>>;
    orgId: string;
}) => {

    const [stats, setStats] = useState({
        totalBatches: 0,
        activeBatches: 0,
        pendingQuality: 0,
        recentTransfers: 0,
    });

    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [gettingStats, setGettingStats] = useState(true);

    // Fetch recent activity data from database
    const fetchRecentActivity = async () => {
        try {
            setLoadingActivity(true);
            const response = await fetch(`/api/web/dashboard/recent-activity?orgId=${orgId}`);
            if (response.ok) {
                const data = await response.json();
                setRecentActivity(data);
            }
        } catch (error) {
            console.error('Error fetching recent activity:', error);
        } finally {
            setLoadingActivity(false);
        }
    };

    // Fetch dashboard stats from database
    const fetchStats = async () => {
        try {
            setGettingStats(true);
            const response = await fetch(`/api/web/dashboard/stats?orgId=${orgId}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
        finally{
            setGettingStats(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchRecentActivity();
            fetchStats();
        }
    }, [orgId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Loading animation component
    const ActivitySkeleton = () => (
        <LoadingTable rows={5} columns={3} />
    );

    // Empty state component with animation
    const EmptyActivity = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
                <Activity 
                    className="w-16 h-16 text-muted-foreground/40" 
                    strokeWidth={1.5}
                />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
            <p className="text-sm text-muted-foreground mb-4">
                When you create batches or initiate transfers, they'll appear here
            </p>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab("products")}
                >
                    Create Product
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab("batches")}
                >
                    Create Batch
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 lg:space-y-8">

            {(loadingActivity || gettingStats || !orgId) && <UniversalLoader text="Loading organization information." />}
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground">
                        Manufacturer Dashboard
                    </h1>
                </div>
                <div className="hidden lg:block">
                    <ThemeToggle />
                </div>
            </div>

            {/* Stats Cards - Mobile: Stacked Vertically, Desktop: Grid */}
            <div className="space-y-4 sm:space-y-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Batches</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Factory className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalBatches}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Batches</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-accent" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.activeBatches}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Currently in circulation
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transfers</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.recentTransfers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions and Recent Activity - Mobile: Stacked, Desktop: Side by side */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {/* Quick Actions */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold text-lg text-foreground">
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">
                            Common manufacturing tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button 
                            variant="default"
                            className="w-full cursor-pointer justify-start h-11 text-sm font-medium" 
                            onClick={() => setActiveTab("batches")}
                        >
                            <Package className="h-4 w-4 mr-3" />
                            Create New Batch
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full cursor-pointer justify-start h-11 text-sm" 
                            onClick={() => setActiveTab("transfers")}
                        >
                            <Truck className="h-4 w-4 mr-3" />
                            Transfer Management
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full justify-start cursor-pointer h-11 text-sm" 
                            onClick={() => setActiveTab("qr-generator")}
                        >
                            <QrCode className="h-4 w-4 mr-3" />
                            Generate QR Codes
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border border-border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <Activity className="w-5 h-5 text-accent" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">
                            Latest batch and transfer activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingActivity ? (
                            <ActivitySkeleton />
                        ) : recentActivity.length === 0 ? (
                            <EmptyActivity />
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.slice(0, 4).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-150">
                                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                                            {activity.type === 'batch' ? (
                                                <Package className="w-4 h-4 text-primary" />
                                            ) : (
                                                <Truck className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {activity.type === 'batch' 
                                                    ? `Batch - ${activity.productName}`
                                                    : `Transfer: ${activity.productName}`
                                                }
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.type === 'transfer' && activity.toEntity
                                                    ? `To ${activity.toEntity}`
                                                    : formatDate(activity.createdAt)
                                                }
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <Badge 
                                                variant={activity.status === "completed" ? "verified" : "secondary"} 
                                                className="text-xs mb-1"
                                            >
                                                {activity.status.replace('_', ' ')}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ManufacturerMain;
