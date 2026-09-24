"use client"

import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { useState, useEffect } from "react"

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    const { setIsLoading } = useLoadingStore()

    useEffect(() => {
        setMounted(true)
        setIsLoading(false)
    }, [setIsLoading])

    if (!mounted) return null

    return (
        <main className="h-full min-h-screen bg-[#f0f4f8] dark:bg-slate-900">
            {children}
        </main>
    )
}

