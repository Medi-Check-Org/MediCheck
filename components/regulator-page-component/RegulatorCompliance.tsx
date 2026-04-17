"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Clock, AlertTriangle, FileCheck, TrendingUp, Users } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading"
import { toast } from "react-toastify"

interface TransferData {
    id: string;
    batchId: string;
    fromOrgId: string;
    toOrgId: string;
    transferDate: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    notes?: string;
    batch: {
        batchId: string;
        drugName: string;
        product?: {
            manufacturingDate: string | null;
            expiryDate: string | null;
        } | null;
    };
    fromOrg: {
        companyName: string;
        organizationType: string;
        contactEmail: string;
    };
    toOrg: {
        companyName: string;
        organizationType: string;
        contactEmail: string;
    };
}

interface ComplianceStats {
    totalTransfers: number;
    pendingReviews: number;
    completedTransfers: number;
    flaggedTransfers: number;
    complianceRate: number;
}

const RegulatorCompliance = () => {
    const [transfers, setTransfers] = useState<TransferData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<ComplianceStats>({
        totalTransfers: 0,
        pendingReviews: 0,
        completedTransfers: 0,
        flaggedTransfers: 0,
        complianceRate: 0
    })

    useEffect(() => {
        fetchComplianceData()
    }, [])

    const fetchComplianceData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/web/regulator/compliance')
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            setTransfers(data.transfers || [])
            
            // Calculate statistics
            const total = data.transfers?.length || 0
            const pending = data.transfers?.filter((t: TransferData) => t.status === 'PENDING').length || 0
            const completed = data.transfers?.filter((t: TransferData) => t.status === 'COMPLETED').length || 0
            const failed = data.transfers?.filter((t: TransferData) => t.status === 'FAILED').length || 0
            const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0
            
            setStats({
                totalTransfers: total,
                pendingReviews: pending,
                completedTransfers: completed,
                flaggedTransfers: failed,
                complianceRate
            })
            
        } catch (error) {
            console.error('Error fetching compliance data:', error)
            setError('Failed to load compliance data. Please try again.')
            toast.error("Failed to load compliance data")
        } finally {
            setLoading(false)
        }
    }

    const handleApproveTransfer = async (transferId: string, status: 'COMPLETED' | 'FAILED', notes?: string) => {
        try {
            const response = await fetch('/api/web/regulator/compliance', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transferId, status, notes }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            
            // Update local state
            setTransfers(prev => 
                prev.map(transfer => 
                    transfer.id === transferId 
                        ? { ...transfer, status, notes }
                        : transfer
                )
            )
            
            // Recalculate stats
            await fetchComplianceData()
            toast.success(`Transfer ${status === "COMPLETED" ? "approved" : "rejected"} successfully`)
            
        } catch (error) {
            console.error('Error updating transfer:', error)
            setError('Failed to update transfer status. Please try again.')
            toast.error("Failed to update transfer status")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary" className="bg-status-warning/10 text-status-warning dark:bg-status-warning/20 dark:text-status-warning">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </Badge>
            case 'IN_PROGRESS':
                return <Badge variant="default" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    In Progress
                </Badge>
            case 'COMPLETED':
                return <Badge variant="default" className="bg-status-verified/10 text-status-verified dark:bg-status-verified/20 dark:text-status-verified">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                </Badge>
            case 'FAILED':
                return <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                </Badge>
            case 'CANCELLED':
                return <Badge variant="outline">Cancelled</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getOrganizationTypeColor = (type: string) => {
        switch (type) {
            case 'MANUFACTURER':
                return 'bg-role-manufacturer/10 text-role-manufacturer dark:bg-role-manufacturer/20 dark:text-role-manufacturer'
            case 'DRUG_DISTRIBUTOR':
                return 'bg-role-distributor/10 text-role-distributor dark:bg-role-distributor/20 dark:text-role-distributor'
            case 'HOSPITAL':
                return 'bg-role-hospital/10 text-role-hospital dark:bg-role-hospital/20 dark:text-role-hospital'
            case 'PHARMACY':
                return 'bg-role-consumer/10 text-role-consumer dark:bg-role-consumer/20 dark:text-role-consumer'
            default:
                return 'bg-muted text-muted-foreground'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isExpiringSoon = (expiryDate: string) => {
        const expiry = new Date(expiryDate)
        const now = new Date()
        const sixMonthsFromNow = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000))
        return expiry <= sixMonthsFromNow
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground">Compliance Monitoring</h1>
                </div>
                <LoadingSpinner size="large" text="Loading compliance data..." />
            </div>
        )
    }
    const pendingTransfers = transfers.filter(t => t.status === 'PENDING')
    const recentTransfers = transfers.slice(0, 10)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div className="flex flex-row items-center gap-2">
                    <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground">Compliance Monitoring</h1>
                </div>
                <p className="text-sm text-muted-foreground">Review ownership transfers and enforce compliance actions.</p>
            </div>
            {error && (
                <Card className="border-destructive/20 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive dark:text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchComplianceData}
                                className="ml-auto"
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTransfers}</div>
                        <p className="text-xs text-muted-foreground">
                            All ownership transfers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-warning">{stats.pendingReviews}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-verified">{stats.complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Successful transfers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Transfers</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.flaggedTransfers}</div>
                        <p className="text-xs text-muted-foreground">
                        Failed/cancelled
                    </p>
                </CardContent>
            </Card>
            </div>

            {/* Pending Transfers Section */}
            {pendingTransfers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-status-warning" />
                            Pending Transfers ({pendingTransfers.length})
                        </CardTitle>
                        <CardDescription>Transfers requiring immediate regulatory approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingTransfers.slice(0, 5).map((transfer) => (
                                <div
                                    key={transfer.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 border rounded-lg bg-white dark:bg-slate-900"
                                >
                                    {/* Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-base truncate">{transfer.batch.drugName}</div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {transfer.fromOrg.companyName} → {transfer.toOrg.companyName}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                                            <span>Batch: {transfer.batch.batchId}</span>
                                            <span>Transfer: {formatDate(transfer.transferDate)}</span>
                                            {transfer.batch.product?.expiryDate && isExpiringSoon(transfer.batch.product.expiryDate) && (
                                                <span className="text-status-warning ml-2">⚠️ Expires Soon</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Actions Section */}
                                    <div className="flex flex-col w-full sm:w-auto gap-2 mt-3 sm:mt-0">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveTransfer(transfer.id, 'COMPLETED')}
                                            className="bg-status-verified text-status-verified-foreground hover:bg-status-verified/90 w-full"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleApproveTransfer(transfer.id, 'FAILED', 'Rejected by regulator')}
                                            className="text-destructive hover:bg-destructive/10 w-full"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All Transfers Table - Responsive */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle>All Ownership Transfers</CardTitle>
                            <CardDescription>Complete history of ownership transfers across the supply chain</CardDescription>
                        </div>
                        <Button variant="outline" onClick={fetchComplianceData}>
                            <Users className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {transfers.length === 0 ? (
                        <div className="text-center py-12">
                            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No transfers found</p>
                            <p className="text-sm text-muted-foreground">There are currently no ownership transfers to review.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medication Details</TableHead>
                                            <TableHead>From Organization</TableHead>
                                            <TableHead>To Organization</TableHead>
                                            <TableHead>Transfer Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transfers.map((transfer) => (
                                            <TableRow key={transfer.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{transfer.batch.drugName}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Batch: {transfer.batch.batchId}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Mfg: {transfer.batch.product?.manufacturingDate ? formatDate(transfer.batch.product.manufacturingDate) : "—"} | 
                                                            Exp: {transfer.batch.product?.expiryDate ? formatDate(transfer.batch.product.expiryDate) : "—"}
                                                            {transfer.batch.product?.expiryDate && isExpiringSoon(transfer.batch.product.expiryDate) && (
                                                                <span className="text-status-warning ml-1">⚠️</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{transfer.fromOrg.companyName}</div>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-xs mt-1 ${getOrganizationTypeColor(transfer.fromOrg.organizationType)}`}
                                                        >
                                                            {transfer.fromOrg.organizationType.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{transfer.toOrg.companyName}</div>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-xs mt-1 ${getOrganizationTypeColor(transfer.toOrg.organizationType)}`}
                                                        >
                                                            {transfer.toOrg.organizationType.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(transfer.transferDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(transfer.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {transfer.status === 'PENDING' ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApproveTransfer(transfer.id, 'COMPLETED')}
                                                                    className="bg-status-verified text-status-verified-foreground hover:bg-status-verified/90"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleApproveTransfer(transfer.id, 'FAILED', 'Rejected by regulator')}
                                                                    className="text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">
                                                                {transfer.status === 'COMPLETED' ? 'Processed' : 'Reviewed'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Mobile Card List */}
                            <div className="md:hidden space-y-4">
                                {transfers.map((transfer) => (
                                    <div
                                        key={transfer.id}
                                        className="border rounded-lg p-4 bg-white dark:bg-slate-900 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-base truncate">{transfer.batch.drugName}</div>
                                            {getStatusBadge(transfer.status)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Batch: {transfer.batch.batchId}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <div>
                                                <span className="font-medium">{transfer.fromOrg.companyName}</span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`text-xs ml-1 ${getOrganizationTypeColor(transfer.fromOrg.organizationType)}`}
                                                >
                                                    {transfer.fromOrg.organizationType.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <span className="mx-1">→</span>
                                            <div>
                                                <span className="font-medium">{transfer.toOrg.companyName}</span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`text-xs ml-1 ${getOrganizationTypeColor(transfer.toOrg.organizationType)}`}
                                                >
                                                    {transfer.toOrg.organizationType.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Mfg: {transfer.batch.product?.manufacturingDate ? formatDate(transfer.batch.product.manufacturingDate) : "—"} | Exp: {transfer.batch.product?.expiryDate ? formatDate(transfer.batch.product.expiryDate) : "—"}
                                            {transfer.batch.product?.expiryDate && isExpiringSoon(transfer.batch.product.expiryDate) && (
                                                <span className="text-status-warning ml-1">⚠️</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Transfer: {formatDate(transfer.transferDate)}
                                        </div>
                                        <div className="flex flex-row gap-2 mt-2">
                                            {transfer.status === 'PENDING' ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApproveTransfer(transfer.id, 'COMPLETED')}
                                                        className="bg-status-verified text-status-verified-foreground hover:bg-status-verified/90 flex-1"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleApproveTransfer(transfer.id, 'FAILED', 'Rejected by regulator')}
                                                        className="text-destructive hover:bg-destructive/10 flex-1"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">
                                                    {transfer.status === 'COMPLETED' ? 'Processed' : 'Reviewed'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default RegulatorCompliance;
