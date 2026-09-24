"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { NotificationItem } from "@/lib/utils/transaction-mapper"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    Calendar, 
    ChevronDown, 
    Target, 
    User, 
    Scan, 
    Coins, 
    FileText,
    Hash,
    CheckCircle2
} from "lucide-react"

interface TransactionTableProps {
    transactions: NotificationItem[]
    highlightedId?: string | null
    searchQuery?: string
}

export function TransactionTable({ transactions, highlightedId, searchQuery: externalSearchQuery }: TransactionTableProps) {
    const [internalSearchQuery, setInternalSearchQuery] = useState("")
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    // Filtrar transacciones según el término de búsqueda
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const query = searchQuery.toLowerCase().trim();
        return transactions.filter((tx) => 
            (tx.nombre && tx.nombre.toLowerCase().includes(query)) ||
            (tx.codigoPago && tx.codigoPago.toLowerCase().includes(query)) ||
            (tx.monto && tx.monto.toString().includes(query)) ||
            (tx.fecha && tx.fecha.toLowerCase().includes(query))
        );
    }, [transactions, searchQuery]);

    // Reiniciar a la página 1 al cambiar el filtro o la lista
    useEffect(() => {
        setCurrentPage(1)
    }, [transactions, searchQuery])

    const totalPages = Math.ceil(filteredTransactions.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return (
        <div className="space-y-4">
            {/* Tabla con Estilos de la Mockup */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc] border-b border-slate-100">
                                <TableHead className="w-[120px] font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3.5 pl-6">
                                    <div className="flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-slate-400" />
                                        <span>ORIGEN</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>FECHA Y HORA</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>REMITENTE</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <Scan className="h-3.5 w-3.5 text-slate-400" />
                                        <span>CÓDIGO PAGO</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3.5 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Coins className="h-3.5 w-3.5 text-slate-400" />
                                        <span>MONTO</span>
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 py-8">
                                            {/* Circular Graphic Icon */}
                                            <div className="relative mb-3">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200/60 flex items-center justify-center shadow-xs">
                                                    <FileText className="h-7 w-7 text-purple-600" />
                                                </div>
                                                {/* Mini sparkle dots */}
                                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                                            </div>
                                            <p className="text-slate-800 font-extrabold text-base">No hay transacciones registradas hoy</p>
                                            <p className="text-slate-400 text-xs mt-1 max-w-sm">
                                                Las nuevas notificaciones aparecerán aquí automáticamente en tiempo real.
                                            </p>
                                        </div>
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
                                            className={`transition-all duration-300 border-b border-slate-100 hover:bg-slate-50/70 ${
                                                isHighlighted 
                                                    ? 'bg-emerald-50/90 border-l-4 border-l-emerald-500 animate-pulse' 
                                                    : ''
                                            }`}
                                        >
                                            {/* Origen Icon */}
                                            <TableCell className="py-3.5 pl-6">
                                                <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200/60 bg-white p-0.5 shadow-2xs flex items-center justify-center">
                                                    <Image
                                                        src={logoSrc}
                                                        alt={tx.origen || "Origen"}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain rounded-xs"
                                                    />
                                                </div>
                                            </TableCell>

                                            {/* Fecha */}
                                            <TableCell className="py-3.5">
                                                <span className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                                                    {tx.fecha}
                                                </span>
                                            </TableCell>

                                            {/* Remitente */}
                                            <TableCell className="py-3.5">
                                                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                                    {tx.nombre}
                                                </span>
                                            </TableCell>

                                            {/* Código Pago */}
                                            <TableCell className="py-3.5">
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200/70">
                                                    <Hash className="h-3 w-3 text-slate-400" />
                                                    <span>{tx.codigoPago || "—"}</span>
                                                </div>
                                            </TableCell>

                                            {/* Monto */}
                                            <TableCell className="text-right py-3.5 pr-6">
                                                <div className="inline-flex items-center gap-1 font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                                                    <span className="text-emerald-600 text-xs font-bold">{tx.moneda}</span>
                                                    <span>{tx.monto}</span>
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-1 inline" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-2">
                    <p className="text-xs text-slate-500 font-medium">
                        Mostrando <span className="font-semibold text-slate-700">{startIndex + 1}</span> a{" "}
                        <span className="font-semibold text-slate-700">
                            {Math.min(endIndex, filteredTransactions.length)}
                        </span>{" "}
                        de <span className="font-semibold text-slate-700">{filteredTransactions.length}</span> pagos
                    </p>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-medium mr-2">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="h-8 rounded-lg px-3 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="h-8 rounded-lg px-3 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
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


