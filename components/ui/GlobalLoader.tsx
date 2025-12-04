"use client"

import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { Loader2 } from "lucide-react"

export function GlobalLoader() {
    const { isLoading } = useLoadingStore()

    if (!isLoading) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-[#0095e0] animate-spin" />
                <p className="text-gray-700 font-medium">Cargando...</p>
            </div>
        </div>
    )
}
