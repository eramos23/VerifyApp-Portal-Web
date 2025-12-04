"use client"

import { useRealtimeTransactions } from "@/lib/hooks/useRealtimeTransactions"
import { TransactionTable } from "@/components/dashboard/TransactionTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Download, Search, LogOut, Bell, BellOff, Settings, MoreVertical, Radio } from "lucide-react"
import * as XLSX from 'xlsx'
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { signOut } from "@/app/actions/auth"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { useLoadingStore } from "@/lib/store/useLoadingStore"

export default function MonitorPage() {
    const { transactions, soundEnabled, setSoundEnabled } = useRealtimeTransactions()
    const { role, user } = useAuthStore()

    // Filters for Admin
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [filteredTransactions, setFilteredTransactions] = useState(transactions)
    const [desktopNotifications, setDesktopNotifications] = useState(false)

    // Modals state
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)
    const { setIsLoading } = useLoadingStore()

    const handleLogout = async () => {
        setIsLogoutOpen(false)
        setIsLoading(true)
        await signOut()
    }

    // Update filtered transactions when real-time updates come in (if no filter active)
    useEffect(() => {
        if (!startDate && !endDate) {
            setFilteredTransactions(transactions)
        }
    }, [transactions, startDate, endDate])

    const handleSearch = () => {
        if (!startDate || !endDate) {
            toast.error("Seleccione ambas fechas")
            return
        }
        if (new Date(startDate) > new Date(endDate)) {
            toast.error("La fecha de inicio no puede ser mayor a la fecha fin")
            return
        }

        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.fecha)
            return tDate >= start && tDate <= end
        })
        setFilteredTransactions(filtered)
        toast.success(`Se encontraron ${filtered.length} transacciones`)
    }

    const handleExport = () => {
        const dataToExport = startDate && endDate ? filteredTransactions : transactions
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Transacciones")
        XLSX.writeFile(wb, "transacciones.xlsx")
    }

    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            toast.error("Este navegador no soporta notificaciones de escritorio")
            return
        }

        if (Notification.permission === "granted") {
            setDesktopNotifications(true)
            toast.success("Notificaciones activadas")
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission()
            if (permission === "granted") {
                setDesktopNotifications(true)
                toast.success("Notificaciones activadas")
            }
        }
    }

    const toggleDesktopNotifications = () => {
        if (desktopNotifications) {
            setDesktopNotifications(false)
        } else {
            requestNotificationPermission()
        }
    }

    // Admin Name (Fallback to email if name not available)
    const adminName = user?.user_metadata?.nombre || user?.email || "Usuario"

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Monitor de pagos de {adminName}
                    </h2>
                    <p className="text-muted-foreground">
                        {role === 'admin' ? 'Panel de Administración' : 'Panel de Ayudante'}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-red-600 animate-pulse font-semibold bg-red-100 px-3 py-1 rounded-full">
                    <Radio className="h-4 w-4" />
                    EN VIVO
                </div>
            </div>

            {role === 'admin' && (
                <Card className="border-none shadow-xl bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="grid gap-1.5">
                                <Label htmlFor="start">Fecha Inicio</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="end">Fecha Fin</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="bg-[#0095e0] hover:bg-[#0095e0]/90 text-white">
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </Button>
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table Section */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="px-6 pt-6">
                    <CardTitle>
                        {startDate && endDate ? 'Resultados de Búsqueda' : 'Transacciones Recientes'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <TransactionTable transactions={filteredTransactions} />
                </CardContent>
            </Card>

            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-8 right-8 z-50 group">
                {/* Hover Menu */}
                <div className="absolute bottom-full right-0 pb-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                    <Button
                        variant="secondary"
                        className="shadow-lg"
                        onClick={() => setIsConfigOpen(true)}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                    </Button>
                    <Button
                        variant="destructive"
                        className="shadow-lg"
                        onClick={() => setIsLogoutOpen(true)}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>

                {/* Main Button */}
                <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-[#0095e0] hover:bg-[#0095e0]/90 text-white">
                    <MoreVertical className="h-6 w-6" />
                </Button>
            </div>

            {/* Configuration Modal */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuración</DialogTitle>
                        <DialogDescription>
                            Ajusta tus preferencias de notificaciones.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                <Label htmlFor="sound-mode" className="cursor-pointer">Sonido</Label>
                            </div>
                            <Switch
                                id="sound-mode"
                                checked={soundEnabled}
                                onCheckedChange={setSoundEnabled}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {desktopNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                <Label htmlFor="desktop-mode" className="cursor-pointer">Notificaciones PC</Label>
                            </div>
                            <Switch
                                id="desktop-mode"
                                checked={desktopNotifications}
                                onCheckedChange={toggleDesktopNotifications}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Logout Confirmation Modal */}
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cerrar Sesión?</DialogTitle>
                        <DialogDescription>
                            Dejarás de recibir notificaciones en este dispositivo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
