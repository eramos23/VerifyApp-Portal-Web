"use client"

import { useAuthStore } from "@/lib/store/useAuthStore"
import { AdminMonitorPanel } from "@/components/monitor/AdminMonitorPanel"
import { AyudanteMonitorPanel } from "@/components/monitor/AyudanteMonitorPanel"

export default function MonitorPage() {
    const { role } = useAuthStore()

    if (role === 'admin') {
        return <AdminMonitorPanel />
    }

    if (role === 'ayudante') {
        return <AyudanteMonitorPanel />
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Cargando...</p>
        </div>
    )
}
