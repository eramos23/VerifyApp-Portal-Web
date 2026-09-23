"use client"

import { useAuthStore } from "@/lib/store/useAuthStore"
import { AdminMonitorPanel } from "@/components/monitor/AdminMonitorPanel"
import { AyudanteMonitorPanel } from "@/components/monitor/AyudanteMonitorPanel"

export default function MonitorPage() {
    const { role } = useAuthStore()
    const isAyudante = role === 'ayudante' || (typeof window !== 'undefined' && localStorage.getItem('user_type') === 'ayudante')

    if (role === 'admin') {
        return <AdminMonitorPanel />
    }

    if (isAyudante) {
        return <AyudanteMonitorPanel />
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Cargando...</p>
        </div>
    )
}
