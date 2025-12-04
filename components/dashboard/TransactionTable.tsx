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
import { Transaction } from "@/lib/hooks/useRealtimeTransactions"
import { format } from "date-fns"

interface TransactionTableProps {
    transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cliente ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No hay transacciones recientes.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.fecha), "dd/MM/yyyy HH:mm:ss")}</TableCell>
                                <TableCell className="font-medium">S/ {tx.monto.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.estado === 'completado' ? 'default' : 'secondary'}>
                                        {tx.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell>{tx.cliente_id}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
