import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import { AlertTriangle, Clock, Activity, Package, X, Eye, EyeOff, Filter, RefreshCw, TrendingUp, Shield, Bell, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"

interface CriticalAlert {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    timeAgo: string;
    batchId?: string;
}

interface ExpiryAlert {
    id: string;
    type: string;
    title: string;
    description: string;
    expiryDate: string;
    daysUntilExpiry: number;
}

interface SystemNotification {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    timeAgo: string;
}

interface SuspiciousActivity {
    id: string;
    type: string;
    title: string;
    description: string;
    location?: string;
    timeAgo: string;
}

interface AlertsData {
    criticalAlerts: CriticalAlert[];
    expiryWarnings: {
        urgent: ExpiryAlert[];
        warning: ExpiryAlert[];
    };
    systemNotifications: SystemNotification[];
    suspiciousActivity: SuspiciousActivity[];
}

const HospitalAlerts = () => {
    const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState("");
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
    const [showDismissed, setShowDismissed] = useState(false);
    const [filterType, setFilterType] = useState<string>("ALL");

    useEffect(() => {
        const fetchAlertsData = async () => {
            try {
                // Get organization ID
                const orgResponse = await fetch("/api/web/organizations/me");
                if (orgResponse.ok) {
                    const orgResult = await orgResponse.json();
                    const organizationId = orgResult.organizationId;
                    setOrgId(organizationId);

                    // Fetch alerts data
                    const alertsResponse = await fetch(`/api/web/hospital/alerts?orgId=${organizationId}`);
                    if (alertsResponse.ok) {
                        const data = await alertsResponse.json();
                        setAlertsData(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching alerts data:', error);
                toast.error('Failed to load alerts data');
            } finally {
                setLoading(false);
            }
        };

        fetchAlertsData();
    }, []);

    const handleDismissAlert = (alertId: string, alertType: string) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
        toast.success(`${alertType} alert dismissed`);
    };

    const handleRefreshAlerts = async () => {
        setLoading(true);
        try {
            const alertsResponse = await fetch(`/api/web/hospital/alerts?orgId=${orgId}`);
            if (alertsResponse.ok) {
                const data = await alertsResponse.json();
                setAlertsData(data);
                toast.success('Alerts refreshed');
            }
        } catch (error) {
            console.error('Error refreshing alerts:', error);
            toast.error('Failed to refresh alerts');
        } finally {
            setLoading(false);
        }
    };

    const getVisibleAlerts = (alerts: any[], type: string) => {
        if (!alerts) return [];
        
        const filtered = showDismissed 
            ? alerts 
            : alerts.filter(alert => !dismissedAlerts.has(alert.id));
        
        if (filterType === "ALL") return filtered;
        return filtered.filter(alert => alert.type === filterType || alert.severity === filterType);
    };

    const getAlertStatistics = () => {
        if (!alertsData) return { total: 0, critical: 0, expiring: 0, dismissed: 0, active: 0, suspicious: 0 };

        const allAlerts = [
            ...(alertsData.criticalAlerts || []),
            ...(alertsData.expiryWarnings?.urgent || []),
            ...(alertsData.expiryWarnings?.warning || []),
            ...(alertsData.suspiciousActivity || [])
        ];

        return {
            total: allAlerts.length,
            critical: (alertsData.criticalAlerts?.length || 0) + (alertsData.expiryWarnings?.urgent?.length || 0),
            expiring: (alertsData.expiryWarnings?.urgent?.length || 0) + (alertsData.expiryWarnings?.warning?.length || 0),
            dismissed: dismissedAlerts.size,
            active: allAlerts.filter(alert => !dismissedAlerts.has(alert.id)).length,
            suspicious: alertsData.suspiciousActivity?.length || 0
        };
    };

    const stats = getAlertStatistics();

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-destructive border-destructive/20';
            case 'high': return 'bg-status-critical border-status-critical/20';
            case 'medium': return 'bg-status-warning border-status-warning/20';
            case 'low': return 'bg-status-warning/60 border-status-warning/10';
            default: return 'bg-muted-foreground border-border';
        }
    };

    const getUrgencyColor = (days: number) => {
        if (days <= 10) return 'border-destructive/20 bg-destructive/5';
        if (days <= 30) return 'border-status-warning/20 bg-status-warning/5';
        return 'border-border bg-muted/30';
    };

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground">Alerts & Notifications</h1>
                <div className="flex items-center justify-center p-6 sm:p-8">
                    <LoadingSpinner size="large" text="Loading alerts..." />
                </div>
            </div>
        );
    }
    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground">Alerts & Notifications</h1>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">Monitor critical alerts and system notifications</p>
                </div>
                
                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshAlerts}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filter Bar (commented out, not needed for now) */}
            {/**
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filter:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'critical', 'high', 'medium', 'low', 'expiry_urgent', 'expiry_warning'].map((filter) => (
                                <Button
                                    key={filter}
                                    variant={filterType === filter ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterType(filter)}
                                    className="text-xs h-8"
                                >
                                    {filter === 'ALL' ? 'All' : 
                                     filter === 'expiry_urgent' ? 'Urgent Expiry' :
                                     filter === 'expiry_warning' ? 'Expiry Warning' :
                                     filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Button>
                            ))}
                        </div>
                        {(dismissedAlerts.size > 0 || filterType !== 'ALL') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDismissedAlerts(new Set());
                                    setFilterType('ALL');
                                    setShowDismissed(false);
                                }}
                                className="text-xs"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            */}

            {/* Alert Statistics Dashboard */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Alerts</p>
                                <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                            </div>
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-destructive/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Critical</p>
                                <div className="text-xl sm:text-2xl font-bold text-destructive">{stats.critical}</div>
                            </div>
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-status-warning/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Expiring</p>
                                <div className="text-xl sm:text-2xl font-bold text-status-warning">{stats.expiring}</div>
                            </div>
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-status-warning" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-status-warning/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Suspicious</p>
                                <div className="text-xl sm:text-2xl font-bold text-status-warning">{stats.suspicious}</div>
                            </div>
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-status-warning" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-status-verified/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active</p>
                                <div className="text-xl sm:text-2xl font-bold text-status-verified">{stats.active}</div>
                            </div>
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-status-verified" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dismissed</p>
                                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">{stats.dismissed}</div>
                            </div>
                            <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Insights */}
            {stats.total > 0 && (
                <Card className="shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm sm:text-base">Alert Summary</h4>
                                <p className="text-sm text-muted-foreground">
                                    {stats.critical > 0 ? (
                                        <span className="text-destructive font-medium">
                                            {stats.critical} critical alert{stats.critical !== 1 ? 's' : ''} require immediate attention
                                        </span>
                                    ) : stats.expiring > 0 ? (
                                        <span className="text-status-warning font-medium">
                                            {stats.expiring} medication{stats.expiring !== 1 ? 's are' : ' is'} expiring soon
                                        </span>
                                    ) : stats.suspicious > 0 ? (
                                        <span className="text-status-warning font-medium">
                                            {stats.suspicious} suspicious activit{stats.suspicious !== 1 ? 'ies' : 'y'} detected
                                        </span>
                                    ) : (
                                        <span className="text-status-verified font-medium">
                                            All systems operating normally - no critical issues detected
                                        </span>
                                    )}
                                    {stats.dismissed > 0 && (
                                        <span className="ml-2 text-muted-foreground">
                                            • {stats.dismissed} alert{stats.dismissed !== 1 ? 's' : ''} dismissed
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {/* Critical Alerts */}
                {alertsData?.criticalAlerts && getVisibleAlerts(alertsData.criticalAlerts, 'critical').length > 0 && (
                    <Card className="border border-destructive/20 bg-destructive/5 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-destructive text-lg sm:text-xl">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Critical Alerts</span>
                                <Badge variant="destructive" className="ml-auto text-xs">
                                    {getVisibleAlerts(alertsData.criticalAlerts, 'critical').length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {getVisibleAlerts(alertsData.criticalAlerts, 'critical').map((alert) => (
                                <Card key={alert.id} className={`bg-card border border-border shadow-sm ${dismissedAlerts.has(alert.id) ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                                <Badge variant="destructive" className="text-xs">
                                                    {alert.severity.toLowerCase()}
                                                </Badge>
                                                {dismissedAlerts.has(alert.id) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Dismissed
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{alert.timeAgo}</span>
                                                {!dismissedAlerts.has(alert.id) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDismissAlert(alert.id, 'Critical')}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm sm:text-base leading-tight">{alert.title}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                                            {alert.batchId && (
                                                <div className="bg-muted/30 rounded-lg p-2 mt-3">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Batch ID</span>
                                                    <p className="font-mono text-sm font-semibold">{alert.batchId}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Expiry Warnings */}
                {(alertsData && alertsData.expiryWarnings && 
                  (getVisibleAlerts(alertsData.expiryWarnings.urgent || [], 'expiry').length > 0 || 
                   getVisibleAlerts(alertsData.expiryWarnings.warning || [], 'expiry').length > 0)) && (
                    <Card className="border-status-warning/20 bg-status-warning/5 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-status-warning text-lg sm:text-xl">
                                <Clock className="h-5 w-5" />
                                <span>Expiry Warnings</span>
                                <Badge variant="outline" className="ml-auto text-xs border-status-warning/30">
                                    {getVisibleAlerts(alertsData.expiryWarnings.urgent || [], 'expiry').length + 
                                     getVisibleAlerts(alertsData.expiryWarnings.warning || [], 'expiry').length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Urgent Expiry Warnings */}
                            {getVisibleAlerts(alertsData?.expiryWarnings.urgent || [], 'expiry_urgent').map((alert) => (
                                <Card key={alert.id} className={`bg-card border-2 border-destructive/20 shadow-sm ${dismissedAlerts.has(alert.id) ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                                <Badge variant="destructive" className="text-xs">
                                                    Urgent
                                                </Badge>
                                                {dismissedAlerts.has(alert.id) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Dismissed
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                                                    {alert.daysUntilExpiry} day{alert.daysUntilExpiry !== 1 ? 's' : ''}
                                                </Badge>
                                                {!dismissedAlerts.has(alert.id) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDismissAlert(alert.id, 'Urgent Expiry')}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm sm:text-base text-destructive leading-tight">
                                                {alert.title}
                                            </h4>
                                            <p className="text-sm text-destructive/80 leading-relaxed">{alert.description}</p>
                                            <div className="bg-destructive/5 rounded-lg p-3 mt-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-destructive/80 uppercase tracking-wide">Expires</span>
                                                    <span className="text-sm font-semibold text-destructive">
                                                        {new Date(alert.expiryDate).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric', 
                                                            year: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Warning Expiry Alerts */}
                            {getVisibleAlerts(alertsData?.expiryWarnings.warning || [], 'expiry_warning').map((alert) => (
                                <Card key={alert.id} className={`bg-card border-2 border-status-warning/20 shadow-sm ${dismissedAlerts.has(alert.id) ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-status-warning flex-shrink-0" />
                                                <Badge variant="outline" className="text-xs border-status-warning/30 text-status-warning">
                                                    Warning
                                                </Badge>
                                                {dismissedAlerts.has(alert.id) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Dismissed
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs border-status-warning/30 text-status-warning">
                                                    {alert.daysUntilExpiry} day{alert.daysUntilExpiry !== 1 ? 's' : ''}
                                                </Badge>
                                                {!dismissedAlerts.has(alert.id) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDismissAlert(alert.id, 'Expiry Warning')}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-status-warning"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm sm:text-base text-status-warning leading-tight">
                                                {alert.title}
                                            </h4>
                                            <p className="text-sm text-status-warning/80 leading-relaxed">{alert.description}</p>
                                            <div className="bg-status-warning/5 rounded-lg p-3 mt-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-status-warning/80 uppercase tracking-wide">Expires</span>
                                                    <span className="text-sm font-semibold text-status-warning">
                                                        {new Date(alert.expiryDate).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric', 
                                                            year: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Action Button */}
                            {(alertsData && alertsData.expiryWarnings && 
                              ((alertsData.expiryWarnings.urgent && alertsData.expiryWarnings.urgent.length > 0) || 
                               (alertsData.expiryWarnings.warning && alertsData.expiryWarnings.warning.length > 0))) && (
                                <div className="pt-3 border-t border-border/40">
                                    <Button size="sm" className="w-full sm:w-auto">
                                        <Package className="h-4 w-4 mr-2" />
                                        View Inventory Details
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Suspicious Activity */}
                {alertsData?.suspiciousActivity && getVisibleAlerts(alertsData.suspiciousActivity, 'suspicious').length > 0 && (
                    <Card className="border-status-warning/20 bg-status-warning/5 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-status-warning text-lg sm:text-xl">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Suspicious Activity</span>
                                <Badge variant="outline" className="ml-auto text-xs border-status-warning/30">
                                    {getVisibleAlerts(alertsData.suspiciousActivity, 'suspicious').length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {getVisibleAlerts(alertsData.suspiciousActivity, 'suspicious').map((activity) => (
                                <Card key={activity.id} className={`bg-card border-0 shadow-sm ${dismissedAlerts.has(activity.id) ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-4 w-4 text-status-warning flex-shrink-0" />
                                                <Badge variant="outline" className="text-xs border-status-warning/30 text-status-warning">
                                                    Suspicious
                                                </Badge>
                                                {dismissedAlerts.has(activity.id) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Dismissed
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{activity.timeAgo}</span>
                                                {!dismissedAlerts.has(activity.id) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDismissAlert(activity.id, 'Suspicious Activity')}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-status-warning"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm sm:text-base text-status-warning leading-tight">
                                                {activity.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                                            {activity.location && (
                                                <div className="bg-status-warning/5 rounded-lg p-3 mt-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-status-warning/80 uppercase tracking-wide">Location</span>
                                                        <span className="text-sm font-semibold text-status-warning">{activity.location}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* System Notifications */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Activity className="h-5 w-5" />
                            <span>System Notifications</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {alertsData?.systemNotifications && alertsData.systemNotifications.length > 0 ? (
                            alertsData.systemNotifications.map((notification) => (
                                <Card key={notification.id} className="bg-muted/30 border-0 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                                                <Badge variant="outline" className="text-xs">
                                                    {notification.status.toLowerCase()}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{notification.timeAgo}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm sm:text-base leading-tight">{notification.title}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{notification.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="bg-muted/30 border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <Activity className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-sm sm:text-base leading-tight">System maintenance scheduled</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">Tonight at 2:00 AM - 4:00 AM</p>
                                            <span className="text-xs text-muted-foreground">1 day ago</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {/* No Alerts Message */}
                {(!alertsData?.criticalAlerts || alertsData.criticalAlerts.length === 0) &&
                 (!alertsData?.expiryWarnings?.urgent || alertsData.expiryWarnings.urgent.length === 0) &&
                 (!alertsData?.expiryWarnings?.warning || alertsData.expiryWarnings.warning.length === 0) &&
                 (!alertsData?.suspiciousActivity || alertsData.suspiciousActivity.length === 0) && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 shadow-sm">
                        <CardContent className="p-6 sm:p-8 text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                    <Activity className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-green-800 dark:text-green-200 mb-2">All Clear!</h3>
                            <p className="text-sm sm:text-base text-green-600 dark:text-green-300 leading-relaxed">
                                No active alerts or warnings at this time. Your system is running smoothly.
                                {stats.dismissed > 0 && (
                                    <span className="block mt-2 text-xs text-green-500">
                                        {stats.dismissed} alert{stats.dismissed !== 1 ? 's have' : ' has'} been dismissed
                                    </span>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default HospitalAlerts;
