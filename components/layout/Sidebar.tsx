"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/lib/store/useAuthStore"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Bell,
    BarChart3,
    User
} from "lucide-react"
import { signOut } from "@/app/actions/auth"
import Image from "next/image"

import { useUIStore } from "@/lib/store/useUIStore"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useLoadingStore } from "@/lib/store/useLoadingStore"

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { role } = useAuthStore()
    const { isSidebarCollapsed, toggleSidebar } = useUIStore()
    const { setIsLoading } = useLoadingStore()
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)

    const handleLogout = async () => {
        setIsLogoutOpen(false)
        setIsLoading(true)
        await signOut()
        router.push("/login/distribuidor")
    }

    const routes = [
        {
            label: "Monitor",
            icon: LayoutDashboard,
            href: "/monitor",
            color: "text-sky-500",
            roles: ["admin", "ayudante"]
        },
        {
            label: "Distribuidor",
            icon: BarChart3,
            href: "/distribuidor",
            color: "text-violet-500",
            roles: ["distribuidor"]
        },
        {
            label: "Clientes",
            icon: Users,
            href: "/distribuidor/clientes",
            color: "text-pink-700",
            roles: ["distribuidor"]
        },
        {
            label: "Comisiones",
            icon: CreditCard,
            href: "/distribuidor/comisiones",
            color: "text-orange-700",
            roles: ["distribuidor"]
        },
        {
            label: "Cuenta",
            icon: User,
            href: "/distribuidor/cuenta",
            color: "text-green-600",
            roles: ["distribuidor"]
        },
    ]

    return (
        <>
            <div className={cn(
                "space-y-4 py-4 flex flex-col h-full bg-[#0f172a] text-white border-r border-slate-800 transition-all duration-300 relative",
                isSidebarCollapsed ? "w-20" : "w-72"
            )}>
                {/* Collapse Button */}
                <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    className="absolute -right-4 top-7 h-7 w-7 rounded-full border bg-[#0f172a] p-0 hover:bg-slate-800 z-50 hidden md:flex"
                >
                    {isSidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>

                <div className="px-3 py-2 flex-1">
                    <Link href={role === 'distribuidor' ? "/distribuidor" : "/monitor"} className={cn("flex items-center pl-3 mb-14 transition-all", isSidebarCollapsed ? "justify-center pl-0" : "")}>
                        <div className="relative w-8 h-8 mr-4">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        {!isSidebarCollapsed && (
                            <h1 className="text-2xl font-bold">
                                VerifyApp
                            </h1>
                        )}
                    </Link>
                    <div className="space-y-1">
                        {routes.map((route) => {
                            if (route.roles && !route.roles.includes(role || "")) return null

                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                        pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                                        isSidebarCollapsed && "justify-center px-2"
                                    )}
                                >
                                    <div className="flex items-center flex-1">
                                        <route.icon className={cn("h-5 w-5", route.color, !isSidebarCollapsed && "mr-3")} />
                                        {!isSidebarCollapsed && route.label}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="px-3 py-2">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10", isSidebarCollapsed && "justify-center px-2")}
                        onClick={() => setIsLogoutOpen(true)}
                    >
                        <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                        {!isSidebarCollapsed && "Cerrar Sesión"}
                    </Button>
                </div>
            </div>

            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cerrar Sesión?</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro que deseas salir del sistema?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
