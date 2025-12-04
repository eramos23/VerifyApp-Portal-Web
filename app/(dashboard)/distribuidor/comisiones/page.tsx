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

export default function CommissionsPage() {
    // Mock data
    const commissions = [
        {
            id: "1",
            monto: 50.00,
            estado: "pagada",
            fecha_generacion: new Date().toISOString(),
            concepto: "Comisión mensual - Restaurante El Buen Sabor"
        },
        {
            id: "2",
            monto: 25.00,
            estado: "pendiente",
            fecha_generacion: new Date().toISOString(),
            concepto: "Comisión mensual - Bodega Juanita"
        }
    ]

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Mis Comisiones</h2>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commissions.map((comm) => (
                            <TableRow key={comm.id}>
                                <TableCell>{format(new Date(comm.fecha_generacion), "dd/MM/yyyy")}</TableCell>
                                <TableCell>{comm.concepto}</TableCell>
                                <TableCell className="font-medium">S/ {comm.monto.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={comm.estado === 'pagada' ? 'default' : 'outline'}>
                                        {comm.estado}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
