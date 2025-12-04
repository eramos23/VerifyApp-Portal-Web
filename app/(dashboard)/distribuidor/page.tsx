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
        <div className="p-4 md:p-8 space-y-8 bg-[#f0f4f8] min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard Distribuidor</h2>
                    <p className="text-gray-500 mt-1">Bienvenido de nuevo, aquí tienes un resumen de tu actividad.</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Recent Activity / Charts Placeholder - Modern Style */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                        Gráfico de Actividad
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Ingresos</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                        Gráfico Circular
                    </div>
                </div>
            </div>
        </div>
    )
}
