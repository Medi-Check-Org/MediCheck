"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, CheckCircle, XCircle, Eye } from "lucide-react"
import { UniversalLoader } from "@/components/ui/universal-loader"
import { toast } from "react-toastify"
const RegulatorEntities = () => {
    const [entities, setEntities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const response = await fetch('/api/web/regulator/entities')
                if (response.ok) {
                    const data = await response.json()
                    setEntities(data.entities)
                } else {
                    toast.error("Failed to load entities")
                }
            } catch (error) {
                console.error('Error fetching entities:', error)
                toast.error("Failed to load entities")
            } finally {
                setLoading(false)
            }
        }

        fetchEntities()
    }, [])

    const handleVerifyEntity = async (entityId: string, isVerified: boolean) => {
        try {
            const response = await fetch(`/api/web/regulator/entities/${entityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isVerified, isActive: true }),
            })

            if (response.ok) {
                setEntities(prev => 
                    prev.map(entity => 
                        entity.id === entityId 
                            ? { ...entity, isVerified }
                            : entity
                    )
                )
                toast.success(isVerified ? "Entity verified" : "Entity suspended")
            } else {
                toast.error("Failed to update entity")
            }
        } catch (error) {
            console.error('Error updating entity:', error)
            toast.error("Failed to update entity")
        }
    }

    const getStatusBadge = (entity: any) => {
        if (!entity.isActive) {
            return <Badge variant="destructive">Inactive</Badge>
        }
        if (!entity.isVerified) {
            return <Badge variant="secondary">Under Review</Badge>
        }
        return <Badge variant="verified">Active</Badge>
    }

    const getOrganizationType = (type: string) => {
        switch (type) {
            case 'MANUFACTURER': return 'Manufacturer'
            case 'DRUG_DISTRIBUTOR': return 'Distributor'
            case 'HOSPITAL': return 'Hospital'
            case 'PHARMACY': return 'Pharmacy'
            default: return type
        }
    }

    
    return (
        <div className="space-y-6">
            {(loading) && <UniversalLoader text="Loading entities." />}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground">Registered Entities</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">Review and verify all registered supply-chain entities.</p>
                </div>
            </div>
            <Card className="border border-border shadow-sm overflow-x-auto">
                <CardHeader>
                    <CardTitle>All Registered Entities</CardTitle>
                    <CardDescription>Complete database of registered pharmaceutical entities</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Responsive Table: Show table on md+ screens, show cards on mobile */}
                    <div className="hidden md:block w-full overflow-x-auto">
                        <Table className="min-w-175">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>License</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            Loading entities...
                                        </TableCell>
                                    </TableRow>
                                ) : entities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Users className="h-8 w-8 text-muted-foreground/60" />
                                                <span>No entities found</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entities.map((entity) => (
                                        <TableRow key={entity.id}>
                                            <TableCell className="font-medium whitespace-nowrap max-w-35 overflow-hidden text-ellipsis">{entity.companyName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{getOrganizationType(entity.organizationType)}</TableCell>
                                            <TableCell className="whitespace-nowrap">{entity.state ? `${entity.address}, ${entity.state}` : entity.address}</TableCell>
                                            <TableCell className="whitespace-nowrap">{entity.licenseNumber || entity.nafdacNumber || 'N/A'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{entity.contactEmail}</TableCell>
                                            <TableCell>{getStatusBadge(entity)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                                                    {!entity.isVerified && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleVerifyEntity(entity.id, true)}
                                                            className="h-10 cursor-pointer"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            <span className="hidden sm:inline">Verify</span>
                                                            <span className="sm:hidden">✔</span>
                                                        </Button>
                                                    )}
                                                    {entity.isVerified && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleVerifyEntity(entity.id, false)}
                                                            className="text-destructive hover:bg-destructive/10 h-10 cursor-pointer"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            <span className="hidden sm:inline">Suspend</span>
                                                            <span className="sm:hidden">✖</span>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="h-10 cursor-pointer">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile Card List */}
                    <div className="block md:hidden w-full">
                        {loading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading entities...</div>
                        ) : entities.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                                No entities found
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 p-2">
                                {entities.map((entity) => (
                                    <div key={entity.id} className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-base">{entity.companyName}</span>
                                            {getStatusBadge(entity)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{getOrganizationType(entity.organizationType)}</div>
                                        <div className="text-sm">{entity.state ? `${entity.address}, ${entity.state}` : entity.address}</div>
                                        <div className="text-xs">License: <span className="font-medium">{entity.licenseNumber || entity.nafdacNumber || 'N/A'}</span></div>
                                        <div className="text-xs">Contact: <span className="font-medium">{entity.contactEmail}</span></div>
                                        <div className="flex gap-2 mt-2">
                                            {!entity.isVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleVerifyEntity(entity.id, true)}
                                                    className="flex-1 h-10 cursor-pointer"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Verify
                                                </Button>
                                            )}
                                            {entity.isVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleVerifyEntity(entity.id, false)}
                                                    className="text-destructive hover:bg-destructive/10 flex-1 h-10 cursor-pointer"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Suspend
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="flex-1 h-10 cursor-pointer">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegulatorEntities;
