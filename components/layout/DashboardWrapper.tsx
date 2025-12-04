"use client"

import { useAuthStore } from "@/lib/store/useAuthStore"
import { Sidebar } from "@/components/layout/Sidebar"
import { useEffect, useState } from "react"

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const { role } = useAuthStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Sidebar is HIDDEN for admin and ayudante
    const showSidebar = role !== 'admin' && role !== 'ayudante'

    if (!showSidebar) {
        return <main className="h-full min-h-screen bg-slate-50 dark:bg-slate-900">{children}</main>
    }

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full">
                {children}
            </main>
        </div>
    )
}
