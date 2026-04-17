"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingTable } from "@/components/ui/loading"
import { Eye, Search, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"

const RegulatorInvestigations = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [investigations, setInvestigations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [isNewInvestigationOpen, setIsNewInvestigationOpen] = useState(false)
    const [newInvestigation, setNewInvestigation] = useState({
        batchId: '',
        reportType: '',
        severity: '',
        description: '',
        location: ''
    })

    useEffect(() => {
        const fetchInvestigations = async () => {
            try {
                const response = await fetch('/api/web/regulator/investigations')
                if (response.ok) {
                    const data = await response.json()
                    setInvestigations(data.investigations)
                } else {
                    toast.error("Failed to load investigations")
                }
            } catch (error) {
                console.error('Error fetching investigations:', error)
                toast.error("Failed to load investigations")
            } finally {
                setLoading(false)
            }
        }

        fetchInvestigations()
    }, [])

    const handleCreateInvestigation = async () => {
        setSubmitting(true)
        try {
            const response = await fetch('/api/web/regulator/investigations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newInvestigation,
                    status: 'PENDING'
                }),
            })

            const data = await response.json();

            if (response.ok) {
                setInvestigations(prev => [data.investigation, ...prev])
                setNewInvestigation({
                    batchId: '',
                    reportType: '',
                    severity: '',
                    description: '',
                    location: ''
                })
                setIsNewInvestigationOpen(false)
                toast.success("Investigation created successfully")
            } else {
                toast.error(`Failed to create investigation: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error creating investigation:', error)
            toast.error("Error creating investigation")
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateStatus = async (investigationId: string, status: string, resolution?: string) => {
        setUpdatingId(investigationId)
        try {
            const response = await fetch(`/api/web/regulator/investigations/${investigationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, resolution }),
            })

            if (response.ok) {
                setInvestigations(prev => 
                    prev.map(inv => 
                        inv.id === investigationId 
                            ? { ...inv, status, resolution }
                            : inv
                    )
                )
                toast.success(`Investigation marked ${status.toLowerCase()}`)
            } else {
                toast.error("Failed to update investigation status")
            }
        } catch (error) {
            console.error('Error updating investigation:', error)
            toast.error("Failed to update investigation status")
        } finally {
            setUpdatingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary">Pending</Badge>
            case 'INVESTIGATING':
                return <Badge variant="default" className="bg-blue-100 text-blue-800">Investigating</Badge>
            case 'RESOLVED':
                return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>
            case 'DISMISSED':
                return <Badge variant="outline">Dismissed</Badge>
            case 'ESCALATED':
                return <Badge variant="destructive">Escalated</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'LOW':
                return <Badge variant="outline" className="text-green-600">Low</Badge>
            case 'MEDIUM':
                return <Badge variant="outline" className="text-yellow-600">Medium</Badge>
            case 'HIGH':
                return <Badge variant="outline" className="text-orange-600">High</Badge>
            case 'CRITICAL':
                return <Badge variant="destructive">Critical</Badge>
            default:
                return <Badge variant="outline">{severity}</Badge>
        }
    }

    const filteredInvestigations = investigations.filter(inv =>
        inv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.batch?.drugName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.consumers?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-sans font-bold text-3xl text-foreground">Investigations Management</h1>
                    <p className="text-muted-foreground">Track, triage, and resolve regulatory investigations.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Dialog open={isNewInvestigationOpen} onOpenChange={setIsNewInvestigationOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                New Investigation
                            </Button>
                        </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Investigation</DialogTitle>
                            <DialogDescription>
                                Start a new regulatory investigation into potential counterfeit or safety issues.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="batchId">Batch ID (Optional)</Label>
                                <Input
                                    id="batchId"
                                    placeholder="Enter batch ID if known"
                                    value={newInvestigation.batchId}
                                    onChange={(e) => setNewInvestigation(prev => ({ ...prev, batchId: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reportType">Investigation Type</Label>
                                <Select value={newInvestigation.reportType} onValueChange={(value) => setNewInvestigation(prev => ({ ...prev, reportType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select investigation type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COUNTERFEIT_SUSPICION">Counterfeit Suspicion</SelectItem>
                                        <SelectItem value="QUALITY_ISSUE">Quality Issue</SelectItem>
                                        <SelectItem value="ADVERSE_REACTION">Adverse Reaction</SelectItem>
                                        <SelectItem value="PACKAGING_DEFECT">Packaging Defect</SelectItem>
                                        <SelectItem value="SUPPLY_CHAIN_ISSUE">Supply Chain Issue</SelectItem>
                                        <SelectItem value="REGULATORY_VIOLATION">Regulatory Violation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="severity">Severity Level</Label>
                                <Select value={newInvestigation.severity} onValueChange={(value) => setNewInvestigation(prev => ({ ...prev, severity: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select severity level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location (Optional)</Label>
                                <Input
                                    id="location"
                                    placeholder="Location where issue was reported"
                                    value={newInvestigation.location}
                                    onChange={(e) => setNewInvestigation(prev => ({ ...prev, location: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Investigation Details</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide detailed description of the issue requiring investigation..."
                                    value={newInvestigation.description}
                                    onChange={(e) => setNewInvestigation(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewInvestigationOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateInvestigation}
                                disabled={
                                  submitting ||
                                  !newInvestigation.reportType ||
                                  !newInvestigation.severity ||
                                  !newInvestigation.description
                                }
                            >
                                {submitting ? "Creating..." : "Create Investigation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Investigations</CardTitle>
                    <CardDescription>Complete list of regulatory investigations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by description, drug, or reporter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" disabled>
                            <Search className="h-4 w-4 mr-2" />
                            Search ({filteredInvestigations.length})
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Batch/Drug</TableHead>
                                <TableHead>Reporter</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <LoadingTable rows={3} columns={8} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvestigations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        No investigations found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvestigations.map((investigation) => (
                                    <TableRow key={investigation.id}>
                                        <TableCell className="max-w-xs">
                                            <div className="truncate" title={investigation.description}>
                                                {investigation.description}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{investigation.batch?.drugName || 'N/A'}</div>
                                                <div className="text-sm text-muted-foreground">{investigation.batch?.batchId || ''}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{investigation.consumers?.fullName || 'System'}</TableCell>
                                        <TableCell>{investigation.reportType?.replace('_', ' ')}</TableCell>
                                        <TableCell>{getSeverityBadge(investigation.severity)}</TableCell>
                                        <TableCell>{getStatusBadge(investigation.status)}</TableCell>
                                        <TableCell>{new Date(investigation.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {investigation.status === 'PENDING' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdateStatus(investigation.id, 'INVESTIGATING')}
                                                        disabled={updatingId === investigation.id}
                                                    >
                                                        Start
                                                    </Button>
                                                )}
                                                {investigation.status === 'INVESTIGATING' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleUpdateStatus(investigation.id, 'RESOLVED', 'Investigation completed')}
                                                            className="text-green-600 hover:bg-green-50"
                                                            disabled={updatingId === investigation.id}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Resolve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleUpdateStatus(investigation.id, 'ESCALATED')}
                                                            className="text-red-600 hover:bg-red-50"
                                                            disabled={updatingId === investigation.id}
                                                        >
                                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                                            Escalate
                                                        </Button>
                                                    </>
                                                )}
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegulatorInvestigations;
