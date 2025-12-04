"use client"

import { useUIStore } from "@/lib/store/useUIStore"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { Sidebar } from "@/components/layout/Sidebar"
import { useState, useEffect } from "react"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const { role } = useAuthStore()
    const { isSidebarCollapsed } = useUIStore()
    const [mounted, setMounted] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const { setIsLoading } = useLoadingStore()

    useEffect(() => {
        setMounted(true)
        setIsLoading(false)
    }, [setIsLoading])

    if (!mounted) return null

    // Sidebar is HIDDEN for admin and ayudante
    console.log("DashboardWrapper: Current Role:", role)
    const showSidebar = role !== 'admin' && role !== 'ayudante'
    console.log("DashboardWrapper: showSidebar:", showSidebar)

    if (!showSidebar) {
        return <main className="h-full min-h-screen bg-[#f0f4f8] dark:bg-slate-900">{children}</main>
    }

    return (
        <div className="flex h-full min-h-screen bg-[#f0f4f8] relative">
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-[90]">
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-white shadow-md border-gray-200 text-[#0095e0]"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[85] md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[90] bg-gray-900 transition-transform duration-300 md:translate-x-0 md:static md:h-screen md:sticky md:top-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                isSidebarCollapsed ? "md:w-20" : "md:w-72"
            )}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-full min-h-screen transition-all duration-300">
                {/* On mobile, add top padding for the menu button */}
                <div className="pt-16 md:pt-0 h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
