"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading"
import { 
    AlertTriangle, 
    Clock, 
    Activity, 
    Bell, 
    Shield, 
    FileX, 
    TrendingUp,
    CheckCircle,
    XCircle,
    Eye,
    RefreshCw,
    Calendar,
    MapPin,
    User
} from "lucide-react"
import { toast } from "react-toastify"

interface AlertDetails {
    batchId?: string;
    drugName?: string;
    manufacturer?: string;
    description?: string;
    scanCount?: number;
    fromOrg?: string;
    toOrg?: string;
    notes?: string;
    companyName?: string;
    organizationType?: string;
    lastUpdated?: string;
}

interface Alert {
    id: string;
    type: 'counterfeit_report' | 'suspicious_pattern' | 'failed_transfer' | 'license_expiring';
    message: string;
    severity: 'critical' | 'high' | 'warning' | 'info';
    time: string;
    location: string;
    reporter: string;
    details: AlertDetails;
}

const RegulatorAlerts = () => {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [activeAlert, setActiveAlert] = useState<Alert | null>(null)

    useEffect(() => {
        fetchAlerts()
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAlerts, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/web/regulator/alerts')
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            setAlerts(data.alerts || [])
            setLastRefresh(new Date())
            
        } catch (error) {
            console.error('Error fetching alerts:', error)
            setError('Failed to load alerts. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleInvestigate = async (alertId: string, alertType: string) => {
        const selected = alerts.find((a) => a.id === alertId) ?? null
        setActiveAlert(selected)
        toast.info(`Investigation workflow opened for ${alertType.replaceAll("_", " ")}`)
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <AlertTriangle className="h-4 w-4 text-destructive" />
            case 'high':
                return <XCircle className="h-4 w-4 text-status-critical" />
            case 'warning':
                return <Clock className="h-4 w-4 text-status-warning" />
            case 'info':
                return <Activity className="h-4 w-4 text-accent" />
            default:
                return <Bell className="h-4 w-4 text-muted-foreground" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-destructive/5 border-destructive/20'
            case 'high':
                return 'bg-status-critical/5 border-status-critical/20'
            case 'warning':
                return 'bg-status-warning/5 border-status-warning/20'
            case 'info':
                return 'bg-accent/5 border-accent/20'
            default:
                return 'bg-muted border-border'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'counterfeit_report':
                return <Shield className="h-4 w-4" />
            case 'suspicious_pattern':
                return <TrendingUp className="h-4 w-4" />
            case 'failed_transfer':
                return <FileX className="h-4 w-4" />
            case 'license_expiring':
                return <Calendar className="h-4 w-4" />
            default:
                return <Bell className="h-4 w-4" />
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'counterfeit_report':
                return <Badge variant="destructive" className="text-xs">Counterfeit</Badge>
            case 'suspicious_pattern':
                return <Badge variant="secondary" className="text-xs">Suspicious</Badge>
            case 'failed_transfer':
                return <Badge variant="outline" className="text-xs">Transfer</Badge>
            case 'license_expiring':
                return <Badge variant="default" className="text-xs">License</Badge>
            default:
                return <Badge variant="outline" className="text-xs">Alert</Badge>
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h1 className="font-sans font-bold text-3xl text-foreground">Alerts & Notifications</h1>
                </div>
                <LoadingSpinner size="large" text="Loading alerts..." />
            </div>
        )
    }

    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    const highAlerts = alerts.filter(a => a.severity === 'high')
    const warningAlerts = alerts.filter(a => a.severity === 'warning')
    const infoAlerts = alerts.filter(a => a.severity === 'info')

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="font-sans font-bold text-3xl text-foreground">Alerts & Notifications</h1>
                    <p className="text-muted-foreground">Monitor real-time risks and act quickly on critical events.</p>
                </div>
            </div>

            {error && (
                <Card className="border border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchAlerts}
                                className="ml-auto"
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alert Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                                <p className="text-2xl font-bold text-destructive">{criticalAlerts.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                                <p className="text-2xl font-bold text-status-critical">{highAlerts.length}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-status-critical" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                                <p className="text-2xl font-bold text-status-warning">{warningAlerts.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-status-warning" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Info</p>
                                <p className="text-2xl font-bold text-accent">{infoAlerts.length}</p>
                            </div>
                            <Activity className="h-8 w-8 text-accent" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Refresh Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-start">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchAlerts}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <Card className="border border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Critical Alerts ({criticalAlerts.length})
                        </CardTitle>
                        <CardDescription className="text-destructive/70">
                            Immediate attention required
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {criticalAlerts.map((alert) => (
                                <div key={alert.id} className="p-4 bg-card border border-border rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(alert.type)}
                                            {getTypeBadge(alert.type)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {alert.time}
                                        </div>
                                    </div>
                                    <p className="font-medium text-foreground mb-2">{alert.message}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {alert.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {alert.reporter}
                                        </div>
                                    </div>
                                    {alert.details && (
                                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3">
                                            {alert.details.batchId && (
                                                <div>Batch ID: {alert.details.batchId}</div>
                                            )}
                                            {alert.details.drugName && (
                                                <div>Drug: {alert.details.drugName}</div>
                                            )}
                                            {alert.details.manufacturer && (
                                                <div>Manufacturer: {alert.details.manufacturer}</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="destructive"
                                            onClick={() => handleInvestigate(alert.id, alert.type)}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Investigate Now
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* High Priority Alerts */}
            {highAlerts.length > 0 && (
                <Card className="border border-status-warning/20 bg-status-warning/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-status-warning">
                            <XCircle className="h-5 w-5" />
                            High Priority Alerts ({highAlerts.length})
                        </CardTitle>
                        <CardDescription className="text-status-warning/70">
                            Requires prompt review
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {highAlerts.map((alert) => (
                                <div key={alert.id} className="p-4 bg-card border border-border rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(alert.type)}
                                            {getTypeBadge(alert.type)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {alert.time}
                                        </div>
                                    </div>
                                    <p className="font-medium text-foreground mb-2">{alert.message}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {alert.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {alert.reporter}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleInvestigate(alert.id, alert.type)}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Review
                                        </Button>
                                        <Button size="sm" variant="ghost">
                                            Mark as Reviewed
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
                <Card className="border border-status-warning/20 bg-status-warning/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-status-warning">
                            <Clock className="h-5 w-5" />
                            Warning Alerts ({warningAlerts.length})
                        </CardTitle>
                        <CardDescription className="text-status-warning/70">
                            Monitor and review when possible
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {warningAlerts.map((alert) => (
                                <div key={alert.id} className="p-3 bg-card border border-border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(alert.type)}
                                            {getTypeBadge(alert.type)}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                                    </div>
                                    <p className="font-medium text-foreground text-sm mb-2">{alert.message}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground">
                                            {alert.location} • {alert.reporter}
                                        </div>
                                        <Button size="sm" variant="outline" className="text-xs">
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Information Alerts */}
            {infoAlerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Information Alerts ({infoAlerts.length})
                        </CardTitle>
                        <CardDescription>
                            General notifications and system updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {infoAlerts.map((alert) => (
                                <div key={alert.id} className="p-3 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(alert.type)}
                                            {getTypeBadge(alert.type)}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                                    </div>
                                    <p className="font-medium text-foreground text-sm mb-1">{alert.message}</p>
                                    <div className="text-xs text-muted-foreground">
                                        {alert.location} • {alert.reporter}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {alerts.length === 0 && !loading && (
                <Card>
                    <CardContent className="pt-12 pb-12">
                        <div className="text-center">
                            <CheckCircle className="h-12 w-12 mx-auto text-status-verified mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">All Clear!</h3>
                            <p className="text-muted-foreground">
                                No active alerts or notifications at this time.
                            </p>
                            <Button 
                                variant="outline" 
                                className="mt-4" 
                                onClick={fetchAlerts}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={!!activeAlert} onOpenChange={(open) => !open && setActiveAlert(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Alert details</DialogTitle>
                        <DialogDescription>
                            Review this alert before starting a full investigation workflow.
                        </DialogDescription>
                    </DialogHeader>
                    {activeAlert && (
                        <div className="space-y-3 text-sm">
                            <div className="font-medium">{activeAlert.message}</div>
                            <div className="text-muted-foreground">
                                Type: {activeAlert.type.replaceAll("_", " ")} | Severity: {activeAlert.severity}
                            </div>
                            <div className="text-muted-foreground">
                                Reporter: {activeAlert.reporter} | Location: {activeAlert.location}
                            </div>
                            {activeAlert.details?.description && (
                                <div className="rounded-md border bg-muted/40 p-3">
                                    {activeAlert.details.description}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveAlert(null)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success("Alert marked for investigation")
                                setActiveAlert(null)
                            }}
                        >
                            Start Investigation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default RegulatorAlerts;
