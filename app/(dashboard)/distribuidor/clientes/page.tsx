"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { DistribuidorRepository } from "@/lib/repositories/distribuidor.repository"
import { ClientDistributor } from "@/types/distributor-client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"

export default function ClientsPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [clients, setClients] = useState<ClientDistributor[]>([])

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        const fetchClients = async () => {
            if (!user?.id) return

            setIsLoading(true)
            try {
                const data = await DistribuidorRepository.getClients(user.id)
                setClients(data)
            } catch (error) {
                console.error("Error fetching clients:", error)
                toast.error("Error al cargar la lista de clientes")
            } finally {
                setIsLoading(false)
            }
        }

        fetchClients()
    }, [user?.id])

    // Filter Logic
    const filteredClients = clients.filter(client => {
        const term = searchTerm.toLowerCase()
        return (
            (client.nombre || "").toLowerCase().includes(term) ||
            (client.telefono_contacto || "").includes(term) ||
            (client.tipo_negocio && client.tipo_negocio.toLowerCase().includes(term)) ||
            (client.nombre_negocio && client.nombre_negocio.toLowerCase().includes(term)) ||
            (client.plan_nombre && client.plan_nombre.toLowerCase().includes(term)) ||
            (client.suscripcion_estado || "").toLowerCase().includes(term)
        )
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const getStatusBadge = (status: string | null | undefined) => {
        const safeStatus = status || "Desconocido"
        const lower = safeStatus.toLowerCase()
        let variant = "secondary"
        let className = "bg-gray-100 text-gray-800"

        if (lower === 'activa') {
            className = "bg-green-100 text-green-700 hover:bg-green-200"
        } else if (lower === 'vencida') {
            className = "bg-amber-100 text-amber-700 hover:bg-amber-200"
        } else if (lower === 'cancelada') {
            className = "bg-red-100 text-red-700 hover:bg-red-200"
        } else if (lower === 'inactivo') {
            className = "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }

        return <Badge variant={variant as any} className={className}>{safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}</Badge>
    }

    const getBusinessTypeLabel = (type: string | null | undefined) => {
        if (!type) return '-'
        const parts = type.split('|')
        return parts.length > 1 ? parts[1].trim() : type
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0095e0]" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-[#0f172a] flex items-center gap-2">
                    <Users className="h-8 w-8 text-[#0095e0]" />
                    Clientes
                </h1>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Tipo Negocio</TableHead>
                            <TableHead>Nombre Negocio</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Fin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentClients.map((client, index) => (
                                <TableRow key={client.id || `client-${index}`}>
                                    <TableCell className="font-medium">{client.nombre}</TableCell>
                                    <TableCell>{client.telefono_contacto}</TableCell>
                                    <TableCell>{getBusinessTypeLabel(client.tipo_negocio)}</TableCell>
                                    <TableCell>{client.nombre_negocio}</TableCell>
                                    <TableCell>{client.plan_nombre}</TableCell>
                                    <TableCell>{getStatusBadge(client.suscripcion_estado)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {client.suscripcion_fecha_inicio || '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {client.suscripcion_fecha_fin || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredClients.length)} de {filteredClients.length} clientes
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 ${currentPage === page ? "bg-[#0095e0] hover:bg-[#007bb8]" : ""}`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
