"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Mock type based on schema
interface Client {
    id: string
    nombre: string
    telefono_contacto: string
    tipo_negocio: string
    activo: boolean
    fecha_creacion: string
    plan: string
}

interface ClientTableProps {
    clients: Client[]
}

export function ClientTable({ clients }: ClientTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Negocio</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No hay clientes registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.nombre}</TableCell>
                                <TableCell>{client.telefono_contacto}</TableCell>
                                <TableCell>{client.tipo_negocio}</TableCell>
                                <TableCell>{client.plan}</TableCell>
                                <TableCell>
                                    <Badge variant={client.activo ? 'default' : 'destructive'}>
                                        {client.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(client.fecha_creacion), "dd/MM/yyyy")}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
