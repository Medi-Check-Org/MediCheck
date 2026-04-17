"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingTable } from "@/components/ui/loading"
import { Shield, AlertTriangle, FileText, TrendingUp, Clock, CheckCircle, XCircle, Eye, Building2 } from "lucide-react";
import { ManufacturerTab } from "@/utils";
import { toast } from "react-toastify";

const RegulatorMain = ({ setActiveTab }: { 
    setActiveTab: React.Dispatch<React.SetStateAction<ManufacturerTab>>;
}) => {

    const [stats, setStats] = useState({
        activeInvestigations: 0,
        investigationGrowth: 0,
        complianceChecks: 0,
        complianceGrowth: 0,
        pendingReviews: 0,
        pendingGrowth: 0,
        violationsFound: 0,
        violationChange: 0,
    })
    const [activities, setActivities] = useState<any[]>([])
    const [alerts, setAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, activitiesResponse, alertsResponse] = await Promise.all([
                    fetch('/api/web/dashboard/regulator-stats'),
                    fetch('/api/web/dashboard/regulator-activities'),
                    fetch('/api/web/regulator/alerts')
                ])

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setStats(statsData)
                }

                if (activitiesResponse.ok) {
                    const activitiesData = await activitiesResponse.json()
                    setActivities(Array.isArray(activitiesData) ? activitiesData : activitiesData.activities || [])
                }

                if (alertsResponse.ok) {
                    const alertsData = await alertsResponse.json()
                    setAlerts(alertsData.alerts || [])
                }
            } catch (error) {
                console.error('Error fetching regulator data:', error)
                toast.error("Failed to load dashboard data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleComplianceCheck = () => {
        setActiveTab("compliance")
    }

    const handleGenerateReport = () => {
        setActiveTab("reports")
    }

    const handleViewAnalytics = () => {
        setActiveTab("analytics")
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div className="flex flex-col sm:flex-row sm:items-center">
                    <h1 className="font-bold text-2xl sm:text-3xl text-foreground">
                        Regulator Dashboard
                    </h1>
                    <span className="text-muted-foreground mt-1 sm:mt-0 sm:ml-2">
                        NAFDAC - Drug Enforcement Division
                    </span>
                </div>
                <div className="hidden sm:flex items-center space-x-4">
                    <Badge variant="regulator" className="px-3 py-1">
                        <Building2 className="h-4 w-4 mr-2" />
                        Regulator
                    </Badge>
                </div>
            </div>

            {/* Card Layout for Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Investigations</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.activeInvestigations}</div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Checks</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.complianceChecks}</div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-status-warning/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-status-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-warning">{stats.pendingReviews}</div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Violations Found</CardTitle>
                        <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.violationsFound}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <Card className="border border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Critical Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-4">
                                <LoadingTable rows={3} columns={3} />
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No critical alerts at this time</p>
                                <p className="text-sm text-muted-foreground mt-1">System is monitoring for issues</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">{alert.message}</p>
                                        <p className="text-sm text-muted-foreground">{alert.location} - {alert.reporter} - {alert.time}</p>
                                        {alert.details && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {alert.details.batchId && `Batch: ${alert.details.batchId}`}
                                                {alert.details.manufacturer && ` | Mfg: ${alert.details.manufacturer}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                alert.severity === "critical" || alert.severity === "high"
                                                    ? "critical"
                                                    : alert.severity === "warning"
                                                        ? "warning"
                                                        : "outline"
                                            }
                                        >
                                            {alert.severity}
                                        </Badge>
                                        <Button 
                                            size="sm" 
                                            variant={alert.severity === "critical" || alert.severity === "high" ? "destructive" : "outline"}
                                            onClick={() => {
                                                if (alert.type === 'counterfeit_report') {
                                                    setActiveTab("investigations")
                                                } else if (alert.type === 'failed_transfer') {
                                                    setActiveTab("compliance")
                                                } else if (alert.type === 'license_expiring') {
                                                    setActiveTab("entities")
                                } else {
                                    setActiveTab("investigations" as ManufacturerTab)
                                }
                                            }}
                                        >
                                            {alert.type === 'counterfeit_report' ? 'Investigate' :
                                             alert.type === 'failed_transfer' ? 'Review' :
                                             alert.type === 'license_expiring' ? 'Check License' :
                                             'View'}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-semibold text-foreground">Recent Activities</CardTitle>
                        <CardDescription>Latest regulatory activities and inspections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity: any) => (
                                    <div
                                        key={activity.id}
                                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 rounded-lg border border-muted/30"
                                    >
                                        {/* Left: Activity Info */}
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="w-2 h-2 mt-2 sm:mt-0 bg-primary rounded-full flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{activity.type} - {activity.target}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {activity.inspector} - {activity.findings}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Right: Status/Badges/Time */}
                                        <div className="flex flex-row flex-wrap sm:flex-col items-center sm:items-end gap-2 sm:gap-1 min-w-[120px] sm:min-w-[120px] text-right">
                                            <Badge
                                                variant={
                                                    activity.priority === "high"
                                                        ? "destructive"
                                                        : activity.priority === "medium"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                                className="mb-0 sm:mb-1"
                                            >
                                                {activity.priority}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    activity.status === "completed"
                                                        ? "default"
                                                        : activity.status === "in-progress"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                                className="mb-0 sm:mb-1"
                                            >
                                                {activity.status}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground w-full sm:w-auto">{activity.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="rounded-full bg-muted p-4 mb-4">
                                        <Clock className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">No Recent Activities</h3>
                                    <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                                        There are no recent regulatory activities or inspections to display. 
                                        Activities will appear here when investigations, compliance reviews, or inspections are conducted.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setActiveTab("investigations")}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Start New Investigation
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-semibold text-foreground">Quick Actions</CardTitle>
                        <CardDescription>Common regulatory tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 
                        <div>
                            <Label htmlFor="investigation-notes">Investigation Notes</Label>
                            <Textarea
                                id="investigation-notes"
                                placeholder="Enter investigation details..."
                                value={investigationNotes}
                                onChange={(e) => setInvestigationNotes(e.target.value)}
                                rows={3}
                                className="mt-1"
                            />
                        </div>
                        <Button className="w-full justify-start" onClick={handleStartInvestigation}>
                            <Eye className="h-4 w-4 mr-2" />
                            Start Investigation
                        </Button>
                        */}
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={handleComplianceCheck}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Compliance Check
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent"
                            onClick={handleGenerateReport}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
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

            {/* ...existing code... */}
        </div>
    )
}

export default RegulatorMain;
