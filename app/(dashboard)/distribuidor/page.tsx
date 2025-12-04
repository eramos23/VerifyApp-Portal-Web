"use client"

import { useEffect, useState } from "react"
import { MetricsCard } from "@/components/dashboard/MetricsCard"
import { Users, UserX, DollarSign, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function DistribuidorPage() {
    const [metrics, setMetrics] = useState({
        activeClients: 0,
        inactiveClients: 0,
        totalIncome: 0,
        pendingCommissions: 0
    })

    useEffect(() => {
        // TODO: Replace with actual RPC call or queries
        // For now, we'll simulate data fetching
        const fetchMetrics = async () => {
            // Example queries (assuming tables exist)
            // const { count: active } = await supabase.from('clientes').select('*', { count: 'exact' }).eq('estado', 'activo')
            // ...

            // Mock data
            setMetrics({
                activeClients: 12,
                inactiveClients: 3,
                totalIncome: 1500.00,
                pendingCommissions: 300.00
            })
        }

        fetchMetrics()
    }, [])

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Distribuidor</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard
                    title="Clientes Activos"
                    value={metrics.activeClients}
                    icon={Users}
                    description="+2 desde el mes pasado"
                />
                <MetricsCard
                    title="Clientes Inactivos"
                    value={metrics.inactiveClients}
                    icon={UserX}
                    description="Requieren atención"
                />
                <MetricsCard
                    title="Ingresos Totales"
                    value={`S/ ${metrics.totalIncome.toFixed(2)}`}
                    icon={DollarSign}
                    description="Acumulado histórico"
                />
                <MetricsCard
                    title="Comisiones Pendientes"
                    value={`S/ ${metrics.pendingCommissions.toFixed(2)}`}
                    icon={CreditCard}
                    description="Próximo pago: 15/12"
                />
            </div>

            {/* Add charts or recent activity here */}
        </div>
    )
}
