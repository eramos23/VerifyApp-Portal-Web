"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { toast } from "sonner"
import { TransactionTable } from "@/components/dashboard/TransactionTable"
import { useRealtimeAyudanteTransactions } from "@/lib/hooks/useRealtimeAyudanteTransactions"
import { Transaction } from "@/types/transaction"
import { DateTime } from "luxon"
import { TransactionRepository } from "@/lib/repositories/transaction.repository"
import { ProfileRepository } from "@/lib/repositories/profile.repository"
import { NotificationItem, transactionToNotificationItem, realtimeTransactionToNotificationItem } from "@/lib/utils/transaction-mapper"
import { signOut } from "@/app/actions/auth"

import { Button } from "@/components/ui/button"
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
import { 
    LogOut, 
    Settings, 
    MoreVertical, 
    Volume2, 
    VolumeX, 
    Bell, 
    BellOff, 
    RefreshCw,
    TrendingUp,
    Activity,
    Home,
    Wallet,
    Receipt,
    Search
} from "lucide-react"

import { AyudanteStorageService } from "@/lib/services/ayudante-storage.service"
import { AyudanteAuthService } from "@/lib/services/ayudante-auth.service"

export function AyudanteMonitorPanel() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const { setIsLoading } = useLoadingStore()

    // Estado para transacciones y búsqueda
    const [transactions, setTransactions] = useState<NotificationItem[]>([])
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([])
    const [tableSearchQuery, setTableSearchQuery] = useState("")
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const [desktopNotifications, setDesktopNotifications] = useState(false)

    // Nombre del Administrador / Negocio
    const [displayAdminName, setDisplayAdminName] = useState<string>("Market")

    // Rango de fecha de hoy en zona horaria de Lima
    const nowLima = DateTime.now().setZone("America/Lima")

    // Admin ID & Helper ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminId = (user as any)?.id_admin || AyudanteStorageService.getAdminId()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const helperId = (user as any)?.ayudante_id || (user as any)?.id || AyudanteStorageService.getAyudanteId()

    // Obtener nombre del negocio / admin
    useEffect(() => {
        const fetchName = async () => {
            if (adminId) {
                const profile = await ProfileRepository.getAdminName(adminId)
                if (profile) {
                    const businessName = profile.nombre_negocio || profile.nombre
                    if (businessName) {
                        setDisplayAdminName(businessName)
                    }
                }
            }
        }
        fetchName()
    }, [adminId])

    // Estado para recarga manual
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Cargar transacciones
    const loadTransactions = useCallback(async (showToast = false) => {
        if (!adminId) return

        setIsLoading(true)
        setIsRefreshing(true)

        try {
            // 1. Validar sesión del ayudante en PostgreSQL antes de consultar
            const sessionValidation = await AyudanteAuthService.validarSesion()
            if (!sessionValidation.sesion_valida) {
                console.warn("⛔ Sesión de ayudante no válida al consultar lista de transacciones")
                toast.error(sessionValidation.mensaje || "Tu usuario fue desactivado por el administrador.")
                await signOut()
                logout()
                router.push("/login/ayudante")
                return
            }

            // 2. Rango del día de hoy
            const startDT = nowLima.startOf('day')
            const endDT = nowLima.endOf('day')

            const data = await TransactionRepository.getTransactionsByDate(
                adminId,
                startDT.toString(),
                endDT.toString()
            )

            const mappedTransactions = data.map((t) => transactionToNotificationItem(t))
            setRawTransactions(data)
            setTransactions(mappedTransactions)

            if (showToast) {
                toast.success("Tabla de transacciones actualizada")
            }

        } catch (error) {
            console.error("Error fetching transactions:", error)
            toast.error("Error al cargar transacciones")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [adminId, setIsLoading, logout, router])

    // Fetch inicial
    useEffect(() => {
        loadTransactions()
    }, [loadTransactions])

    // Hook en tiempo real para Ayudante
    const { isConnected } = useRealtimeAyudanteTransactions(
        adminId,
        helperId,
        (newTransaction) => {
            try {
                const mappedTransaction = realtimeTransactionToNotificationItem(newTransaction)

                // Evitar duplicados
                setTransactions((prev) => {
                    if (prev.some((item) => item.id === mappedTransaction.id)) {
                        return prev
                    }
                    return [mappedTransaction, ...prev]
                })

                setRawTransactions((prev) => {
                    if (prev.some((item) => item.id === newTransaction.id)) {
                        return prev
                    }
                    return [newTransaction, ...prev]
                })

                setHighlightedId(mappedTransaction.id)
                setTimeout(() => setHighlightedId(null), 5000)

                // Notificación de escritorio
                if (desktopNotifications && "Notification" in window && Notification.permission === "granted") {
                    try {
                        new Notification(`Nuevo pago de: ${mappedTransaction.moneda} ${mappedTransaction.monto}`, {
                            body: `${mappedTransaction.nombre} - ${mappedTransaction.codigoPago}`,
                            icon: '/verify_check.png',
                            silent: true
                        })
                    } catch (err) {
                        console.error("Error showing desktop notification:", err)
                    }
                }

                if (soundEnabled) {
                    const audio = new Audio('/audio/yape_sonido.mp3')
                    audio.play().catch(e => console.error("Audio play failed", e))
                }

                toast.success(`Nueva transacción: ${mappedTransaction.moneda} ${mappedTransaction.monto}`)
            } catch (error) {
                console.error("Error processing realtime transaction:", error)
            }
        },
        async () => {
            // Manejo de invalidación de sesión
            setIsLoading(true)
            await signOut()
            logout()
            router.push("/login/ayudante")
        }
    )

    // Cargar preferencia de sonido desde localStorage
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

    // Estados para Modales
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)

    const handleLogout = async () => {
        setIsLogoutOpen(false)
        setIsLoading(true)
        AyudanteAuthService.logout()
        await signOut()
        logout()
        router.push("/login/ayudante")
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

    // Calcular Monto Total de Ventas de Hoy
    const totalAmount = rawTransactions.reduce((sum, t) => {
        const amount = Number(t.monto) || 0
        return sum + amount
    }, 0).toFixed(2)

    return (
        <div className="min-h-screen bg-[#f3f6fa] pb-16 font-sans text-slate-800">
            {/* Header / Barra de Navegación Superior */}
            <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
                {/* Brand Logo & Subtitle */}
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-8">
                        <Image
                            src="/logo.png"
                            alt="VerifyApp"
                            fill
                            className="object-contain object-center"
                            priority
                        />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-tight -mt-0.5">
                        Monitor de Pagos
                    </span>
                </div>

                {/* Right Connection Status Badge */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${isConnected
                        ? 'bg-[#e6f9f0] text-[#00c875] border-[#bbf2d7]'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00c875] animate-pulse' : 'bg-rose-500'}`} />
                        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                </div>
            </header>

            {/* Contenido Principal (Sin Sidebar, 100% de Ancho) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                {/* Hero Banner Pastel Blue */}
                <div className="bg-gradient-to-r from-[#eef5ff] via-[#e8f1fd] to-[#e4eefd] rounded-3xl p-0 border border-blue-100/90 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                    {/* Left text section */}
                    <div className="space-y-2 max-w-xl z-10 p-4 sm:p-5 md:pr-0">
                        <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-xs text-[#0095e0] font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-200/60 shadow-2xs">
                            <Home className="h-3 w-3" />
                            <span>PANEL DE AYUDANTE</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                            {displayAdminName}
                        </h1>

                        <p className="text-slate-500 font-medium text-xs leading-relaxed">
                            Controla en tiempo real tus ventas, reportes y transacciones tus billeteras dijitales.
                        </p>
                    </div>

                    {/* Right side Image Banner */}
                    <div className="relative z-10 w-full md:w-auto self-stretch flex items-center justify-center md:justify-end">
                        <div className="relative w-full md:w-[360px] lg:w-[410px] h-32 sm:h-36 md:h-full min-h-[130px] sm:min-h-[145px]">
                            <Image
                                src="/assets/img/banner-pago-recibido.png"
                                alt="Tu negocio siempre al día"
                                fill
                                className="object-contain object-center md:object-right"
                                priority
                            />
                        </div>
                    </div>

                    {/* Background Soft Blur Orbs */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Cards de Métricas de Hoy (Purple & Green cards) - 2 Columnas en Móvil y Escritorio */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6">

                    {/* Card 1: Ventas de Hoy (Purple Theme) */}
                    <div className="bg-[#fcfaff] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-purple-100/90 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-1 z-10">
                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#8b5cf6] text-white flex items-center justify-center shadow-sm shadow-purple-500/20 shrink-0">
                                    <Wallet className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-slate-500 truncate">
                                    Ventas de hoy
                                </span>
                            </div>

                            <div className="pt-0.5">
                                <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                    S/ {totalAmount}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-[#10b981] text-[9px] sm:text-[11px] font-bold pt-0.5">
                                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                <span className="truncate">Monto total hoy</span>
                            </div>
                        </div>

                        {/* Sparkline Wave Line Decorative */}
                        <div className="absolute right-2 bottom-2 opacity-30 pointer-events-none hidden sm:block">
                            <svg className="w-16 h-8 text-purple-400" viewBox="0 0 100 40" fill="none">
                                <path d="M0 30 Q 25 35, 50 15 T 100 5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 2: Pagos Registrados (Green Theme) */}
                    <div className="bg-[#f6fbf8] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-emerald-100/90 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-1 z-10">
                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#10b981] text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
                                    <Receipt className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-slate-500 truncate">
                                    Pagos registrados
                                </span>
                            </div>

                            <div className="pt-0.5">
                                <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {transactions.length} <span className="text-xs sm:text-xs font-semibold text-slate-500">pagos</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-[#10b981] text-[9px] sm:text-[11px] font-bold pt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                                <span className="truncate">Notificaciones</span>
                            </div>
                        </div>

                        {/* Bar Chart Decorative */}
                        <div className="absolute right-2 bottom-2 opacity-30 pointer-events-none hidden sm:block">
                            <div className="flex items-end gap-1 h-6">
                                <div className="w-1.5 h-2.5 bg-emerald-300 rounded-xs" />
                                <div className="w-1.5 h-4 bg-emerald-400 rounded-xs" />
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-xs" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Main Card: Transacciones de Hoy */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden p-5 sm:p-7 space-y-6">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0095e0] flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4" />
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                Transacciones de Hoy
                            </h2>
                        </div>

                        <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end">
                            {/* Input de Búsqueda al lado derecho al nivel del título */}
                            <div className="relative flex-1 sm:w-64 md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por código, monto o fecha..."
                                    value={tableSearchQuery}
                                    onChange={(e) => setTableSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0095e0]/20 focus:border-[#0095e0] transition-all"
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadTransactions(true)}
                                disabled={isRefreshing}
                                className="h-9 px-3 border-slate-200 text-[#0095e0] hover:text-[#0095e0] hover:bg-blue-50/50 font-bold text-xs flex items-center gap-1.5 shadow-2xs rounded-xl cursor-pointer transition-all shrink-0"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Actualizar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Rendered Table */}
                    <TransactionTable
                        transactions={transactions}
                        highlightedId={highlightedId}
                        searchQuery={tableSearchQuery}
                    />
                </div>
            </main>

            {/* Floating Action Button (FAB) & Menu */}
            <div className="fixed bottom-6 right-6 z-50 group">
                <div className="absolute bottom-full right-0 pb-3 flex flex-col gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0">
                    <Button
                        variant="secondary"
                        className="shadow-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-all"
                        onClick={() => setIsConfigOpen(true)}
                    >
                        <Settings className="h-4 w-4 text-[#0095e0]" />
                        <span>Configuración</span>
                    </Button>
                    <Button
                        variant="destructive"
                        className="shadow-md bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-all"
                        onClick={() => setIsLogoutOpen(true)}
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>

                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-[#0095e0] hover:bg-[#0084c7] text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <MoreVertical className="h-6 w-6" />
                </Button>
            </div>

            {/* Modal de Configuración */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                            <Settings className="h-5 w-5 text-[#0095e0]" />
                            Configuración del Panel
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm">
                            Ajusta tus preferencias de sonido y notificaciones en este dispositivo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-5">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                                    {soundEnabled ? <Volume2 className="h-5 w-5 text-emerald-600" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
                                </div>
                                <div>
                                    <Label htmlFor="sound-mode" className="cursor-pointer font-bold text-slate-800 text-sm">
                                        Efecto de Sonido
                                    </Label>
                                    <p className="text-xs text-slate-500">Reproduce un tono al recibir notificaciones</p>
                                </div>
                            </div>
                            <Switch
                                id="sound-mode"
                                checked={soundEnabled}
                                onCheckedChange={handleSoundChange}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                                    {desktopNotifications ? <Bell className="h-5 w-5 text-[#0095e0]" /> : <BellOff className="h-5 w-5 text-slate-400" />}
                                </div>
                                <div>
                                    <Label htmlFor="desktop-mode" className="cursor-pointer font-bold text-slate-800 text-sm">
                                        Notificaciones PC
                                    </Label>
                                    <p className="text-xs text-slate-500">Alertas emergentes del sistema operativo</p>
                                </div>
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

            {/* Modal de Cerrar Sesión */}
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600">
                            <LogOut className="h-5 w-5" />
                            ¿Cerrar Sesión?
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-1">
                            Si cierras sesión, dejarás de recibir notificaciones de pagos en tiempo real en este dispositivo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex flex-row gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsLogoutOpen(false)}
                            className="rounded-xl border-slate-200 text-slate-700 font-semibold h-10 px-4"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 px-4"
                        >
                            Cerrar Sesión
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
