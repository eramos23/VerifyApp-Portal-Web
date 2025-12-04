"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
    BarChart3
} from "lucide-react"
import { signOut } from "@/app/actions/auth"

export function Sidebar() {
    const pathname = usePathname()
    const { role } = useAuthStore()

    const routes = [
        {
            label: "Monitor",
            icon: Bell,
            href: "/monitor",
            color: "text-sky-500",
            roles: ["admin", "ayudante"],
        },
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/distribuidor",
            color: "text-violet-500",
            roles: ["distribuidor"],
        },
        {
            label: "Clientes",
            icon: Users,
            href: "/distribuidor/clientes",
            color: "text-pink-700",
            roles: ["distribuidor"],
        },
        {
            label: "Comisiones",
            icon: CreditCard,
            href: "/distribuidor/comisiones",
            color: "text-orange-700",
            roles: ["distribuidor"],
        },
        {
            label: "Historial",
            icon: BarChart3,
            href: "/monitor/historial",
            color: "text-emerald-500",
            roles: ["admin"],
        },
        {
            label: "Configuración",
            icon: Settings,
            href: "/settings",
            roles: ["admin", "distribuidor"],
        },
    ]

    const filteredRoutes = routes.filter((route) =>
        !route.roles || (role && route.roles.includes(role))
    )

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">
                        VerifyApp
                    </h1>
                </Link>
                <div className="space-y-1">
                    {filteredRoutes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
                    onClick={async () => {
                        await signOut()
                    }}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
