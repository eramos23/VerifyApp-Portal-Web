"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { toast } from "sonner"
import { TransactionTable } from "@/components/dashboard/TransactionTable"
import { useRealtimeTransactions } from "@/lib/hooks/useRealtimeTransactions"
import { Transaction } from "@/types/transaction"
import { DateTime } from "luxon"
import { TransactionRepository } from "@/lib/repositories/transaction.repository"
import { NotificationItem, transactionToNotificationItem, realtimeTransactionToNotificationItem } from "@/lib/utils/transaction-mapper"
import * as XLSX from 'xlsx-js-style'
import { signOut } from "@/app/actions/auth"
import { ProfileRepository } from "@/lib/repositories/profile.repository"
import { RefreshCw } from "lucide-react"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { LogOut, Settings, Search, Download, ChevronDown, ChevronUp, MoreVertical, Volume2, VolumeX, Bell, BellOff, Radio, MessageCircle } from "lucide-react"

export function AdminMonitorPanel() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const { setIsLoading } = useLoadingStore()

    // State for transactions
    const [transactions, setTransactions] = useState<NotificationItem[]>([])
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([])
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const [isFiltersOpen, setIsFiltersOpen] = useState(true)
    const [profileConfig, setProfileConfig] = useState<{ nombre: string, showSearchFilter: boolean }>({ nombre: '', showSearchFilter: true })
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    // Subscription State
    const [subscriptionStatus, setSubscriptionStatus] = useState<{ success: boolean, message: string } | null>(null)

    // Get today's date in Lima Timezone
    const nowLima = DateTime.now().setZone("America/Lima")
    const today = nowLima.toFormat("yyyy-MM-dd")

    // Filters
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)
    const [queryParams, setQueryParams] = useState({ start: today, end: today })
    const [desktopNotifications, setDesktopNotifications] = useState(false)
    const [isExportWarningOpen, setIsExportWarningOpen] = useState(false)

    // Admin ID
    const adminId = user?.id

    // Check Subscription
    useEffect(() => {
        const checkSub = async () => {
            if (!adminId) return
            const status = await ProfileRepository.checkSubscription(adminId)
            setSubscriptionStatus(status)
        }
        checkSub()
    }, [adminId])

    // Initial Fetch & Filter Effect
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!adminId) return

            setIsLoading(true)

            try {
                // Construct start and end dates in Lima Timezone
                const startDT = queryParams.start
                    ? DateTime.fromISO(queryParams.start, { zone: "America/Lima" }).startOf('day')
                    : nowLima.startOf('day')

                const endDT = queryParams.end
                    ? DateTime.fromISO(queryParams.end, { zone: "America/Lima" }).endOf('day')
                    : nowLima.endOf('day')

                const data = await TransactionRepository.getTransactionsByDate(
                    adminId,
                    startDT.toString(),
                    endDT.toString()
                )

                const mappedTransactions = data.map((t) => transactionToNotificationItem(t))
                setRawTransactions(data)
                setTransactions(mappedTransactions)

            } catch (error) {
                console.error("Error fetching transactions:", error)
                toast.error("Error al cargar transacciones")
            } finally {
                setIsLoading(false)
            }
        }

        fetchTransactions()
    }, [adminId, queryParams, setIsLoading, refreshTrigger])

    // Fetch Profile Config
    useEffect(() => {
        const fetchProfile = async () => {
            if (!adminId) return
            const profile = await ProfileRepository.getAdminName(adminId)
            if (profile) {
                setProfileConfig({
                    nombre: profile.nombre || '',
                    showSearchFilter: profile.filtro_busqueda_web ?? true // Default to true if null
                })
            }
        }
        fetchProfile()
    }, [adminId])

    // Realtime Hook
    const { isConnected } = useRealtimeTransactions(adminId, (newTransaction) => {
        try {
            const mappedTransaction = realtimeTransactionToNotificationItem(newTransaction)

            // Only add to table if we are viewing "Today"
            if (endDate === today) {
                setTransactions((prev) => [mappedTransaction, ...prev])
                setRawTransactions((prev) => [newTransaction, ...prev])

                setHighlightedId(mappedTransaction.id)
                setTimeout(() => setHighlightedId(null), 5000)
            }

            if (soundEnabled) {
                const audio = new Audio('/audio/yape_sonido.mp3')
                audio.play().catch(e => {
                    console.error("Audio play failed", e)
                    if (e.name === 'NotAllowedError') {
                        toast.warning("Haga clic en la página para habilitar el sonido de notificaciones")
                    }
                })
            }

            toast.success(`Nueva transacción: ${mappedTransaction.moneda} ${mappedTransaction.monto}`)
        } catch (error) {
            console.error("Error processing realtime transaction:", error)
        }
    })

    // Load sound preference from localStorage
    useEffect(() => {
        const savedSound = localStorage.getItem('soundEnabled')
        if (savedSound !== null) {
            setSoundEnabled(savedSound === 'true')
        }
    }, [])

    const handleSoundChange = (enabled: boolean) => {
        setSoundEnabled(enabled)
        localStorage.setItem('soundEnabled', String(enabled))
    }

    // Modals state
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)

    const handleLogout = async () => {
        setIsLogoutOpen(false)
        setIsLoading(true)
        await signOut()
        logout()
        router.push("/login/admin")
    }

    const handleSearch = () => {
        if (!startDate || !endDate) {
            toast.error("Seleccione ambas fechas")
            return
        }

        if (startDate > endDate) {
            toast.error("La fecha de inicio no puede ser mayor a la fecha fin")
            return
        }
        if (startDate > today) {
            toast.error("La fecha de inicio no puede ser mayor a hoy")
            return
        }
        if (endDate > today) {
            toast.error("La fecha fin no puede ser mayor a hoy")
            return
        }

        setQueryParams({ start: startDate, end: endDate })
    }

    const handleExportClick = () => {
        if (rawTransactions.length === 0) {
            toast.error("No hay datos para exportar")
            return
        }
        setIsExportWarningOpen(true)
    }

    const handleExport = () => {
        setIsExportWarningOpen(false)

        const dataToExport = rawTransactions.map(t => {
            const mapped = transactionToNotificationItem(t)
            const mensaje = t.mensaje_original ? t.mensaje_original.split('|')[1] || '' : ''

            return {
                "Remitente": mapped.nombre,
                "Fecha": mapped.fecha,
                "Monto": `${mapped.moneda} ${mapped.monto}`,
                "Código Pago": mapped.codigoPago,
                "Mensaje": mensaje
            }
        })

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet([[`Transacciones - ${startDate} y ${endDate}`]])

        XLSX.utils.sheet_add_json(ws, dataToExport, { origin: "A2" })

        if (!ws['!merges']) ws['!merges'] = []
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })

        if (!ws['A1'].s) ws['A1'].s = {}
        ws['A1'].s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
            fill: { fgColor: { rgb: "0095E0" } },
            alignment: { horizontal: "center", vertical: "center" }
        }

        const range = XLSX.utils.decode_range(ws['!ref']!)
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C })
                if (!ws[cell_address]) continue
                if (!ws[cell_address].s) ws[cell_address].s = {}

                ws[cell_address].s.border = {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        }

        const wscols = [
            { wch: 25 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 68 }
        ]
        ws['!cols'] = wscols

        XLSX.utils.book_append_sheet(wb, ws, "Transacciones")
        XLSX.writeFile(wb, `transacciones_${startDate}_${endDate}.xlsx`)
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

    // Calculate Total Amount
    const totalAmount = rawTransactions.reduce((sum, t) => {
        const amount = Number(t.monto) || 0
        return sum + amount
    }, 0).toFixed(2)

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto relative min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Monitor de Pagos {profileConfig.nombre ? `de ${profileConfig.nombre}` : ''}
                    </h2>
                    {!profileConfig.showSearchFilter && (
                        <div className="mt-2">
                            <Button
                                size="sm"
                                className="gap-2 bg-[#0095e0] hover:bg-[#007bb8] text-white shadow-sm"
                                onClick={() => {
                                    setStartDate(today)
                                    setEndDate(today)
                                    setQueryParams({ start: today, end: today })
                                    setRefreshTrigger(prev => prev + 1)
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Actualizar Hoy
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className={`flex items-center gap-2 font-semibold px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-100 text-red-600'}`}>
                        <Radio className="h-4 w-4" />
                        {isConnected ? 'CONECTADO' : 'NO CONECTADO'}
                    </div>
                </div>
            </div>

            {/* Subscription Warning Card */}
            {subscriptionStatus && !subscriptionStatus.success && (
                <Card className="border-2 border-amber-400 bg-amber-50 shadow-lg animate-pulse">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <LogOut className="h-6 w-6 text-amber-600 rotate-180" />
                            </div>
                            <div>
                                <h3 className="font-bold text-amber-800 text-lg">No tiene una suscripción activa</h3>
                                <p className="text-amber-700 text-sm">{subscriptionStatus.message || "Activa tu plan para continuar recibiendo notificaciones."}</p>
                            </div>
                        </div>
                        <Button
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold gap-2 shadow-sm"
                            asChild
                        >
                            <a
                                href="https://wa.me/51907796591?text=Quiero%20activar%20mi%20suscripci%C3%B3n%20de%20VerifyApp"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Activar Suscripción en WhatsApp
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Filters Card */}
            {profileConfig.showSearchFilter && (
                <Card className="border-none shadow-xl bg-white">
                    <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-semibold text-gray-800">Filtros de Búsqueda</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CardHeader>
                    {isFiltersOpen && (
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">Fecha Inicio</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        required
                                        max={today}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">Fecha Fin</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        required
                                        min={startDate}
                                        max={today}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-[#0095e0] hover:bg-[#007bb8] text-white shadow-sm"
                                        onClick={handleSearch}
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                                        onClick={handleExportClick}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Excel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Table Section */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="px-6 pt-6 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                        {startDate && endDate ? 'Resultados de Búsqueda' : 'Transacciones Recientes'}
                        <span className="text-muted-foreground font-normal text-base ml-2">
                            {transactions.length} Registros
                        </span>
                    </CardTitle>
                    <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-1">
                        <span className="text-xl font-bold text-gray-900">Total:</span>
                        <span className="text-lg font-medium text-gray-700">S/ {totalAmount}</span>
                    </div>
                </CardHeader>
                <CardContent className="px-6">
                    <TransactionTable
                        transactions={transactions}
                        highlightedId={highlightedId}
                    />
                </CardContent>
            </Card>

            {/* FABS and Modals */}
            <div className="fixed bottom-8 right-8 z-50 group">
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

                <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-[#0095e0] hover:bg-[#0095e0]/90 text-white">
                    <MoreVertical className="h-6 w-6" />
                </Button>
            </div>

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
                                onCheckedChange={handleSoundChange}
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

            <Dialog open={isExportWarningOpen} onOpenChange={setIsExportWarningOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 flex items-center gap-2">
                            ⚠️ Advertencia Importante
                        </DialogTitle>
                        <DialogDescription className="pt-4 text-base text-gray-700">
                            Esta hoja de excel solo es informativa, no para hacer cálculos o tomar decisiones numéricas.
                            Para más seguridad le recomendamos descargarlo desde la misma aplicación (Yape, Plin, etc).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportWarningOpen(false)}>Cancelar</Button>
                        <Button className="bg-[#0095e0] hover:bg-[#007bb8]" onClick={handleExport}>Entendido, Descargar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
