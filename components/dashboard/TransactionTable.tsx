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
import { NotificationItem } from "@/lib/utils/transaction-mapper"
import Image from "next/image"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TransactionTableProps {
    transactions: NotificationItem[]
    highlightedId?: string | null
}

export function TransactionTable({ transactions, highlightedId }: TransactionTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    // Reset to page 1 when a new transaction arrives (transactions array changes)
    useEffect(() => {
        setCurrentPage(1)
    }, [transactions])

    const totalPages = Math.ceil(transactions.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const currentTransactions = transactions.slice(startIndex, endIndex)

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Origen</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Remitente</TableHead>
                            <TableHead>Código Pago</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay transacciones recientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentTransactions.map((tx) => {
                                const isYape = tx.origen?.toLowerCase().includes('yape');
                                const logoSrc = isYape ? '/yape-logo.png' : '/notificationcash-logo.png';
                                const isHighlighted = tx.id === highlightedId;

                                return (
                                    <TableRow
                                        key={tx.id}
                                        className={`transition-colors duration-500 ${isHighlighted ? 'bg-green-100 animate-pulse' : ''}`}
                                    >
                                        <TableCell>
                                            <div className="relative w-8 h-8">
                                                <Image
                                                    src={logoSrc}
                                                    alt={tx.origen || "Origen"}
                                                    fill
                                                    className="object-contain rounded-md"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>{tx.fecha}</TableCell>
                                        <TableCell className="font-medium">
                                            {tx.moneda} {tx.monto}
                                        </TableCell>
                                        <TableCell>{tx.nombre}</TableCell>
                                        <TableCell>{tx.codigoPago}</TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end py-4">
                    <div className="flex items-center space-x-2">
                        <div className="text-sm text-muted-foreground mr-4">
                            Página {currentPage} de {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="h-9 min-w-[100px]"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="h-9 min-w-[100px]"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
