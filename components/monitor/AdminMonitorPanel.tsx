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
import { 
    LogOut, 
    Settings, 
    Search, 
    Download, 
    ChevronDown, 
    ChevronUp, 
    MoreVertical, 
    Volume2, 
    VolumeX, 
    Bell, 
    BellOff, 
    RefreshCw, 
    MessageCircle,
    Wallet,
    Receipt,
    TrendingUp,
    Activity,
    Home,
    User,
    ShieldCheck,
    CheckCircle2
} from "lucide-react"

export function AdminMonitorPanel() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const { setIsLoading } = useLoadingStore()

    // State for transactions and search
    const [transactions, setTransactions] = useState<NotificationItem[]>([])
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([])
    const [tableSearchQuery, setTableSearchQuery] = useState("")
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const [isFiltersOpen, setIsFiltersOpen] = useState(true)
    const [profileConfig, setProfileConfig] = useState<{ nombre: string, nombre_negocio: string, showSearchFilter: boolean }>({ nombre: '', nombre_negocio: '', showSearchFilter: true })
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
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)

    // Admin ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminId = (user as any)?.id

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
                    nombre_negocio: profile.nombre_negocio || '',
                    showSearchFilter: profile.filtro_busqueda_web ?? true
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

            // Desktop Notification
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

    // Load preference from localStorage
    useEffect(() => {
        const savedSound = localStorage.getItem('soundEnabled')
        if (savedSound !== null) {
            setSoundEnabled(savedSound === 'true')
        }

        const savedDesktop = localStorage.getItem('desktopNotifications')
        if (savedDesktop !== null) {
            setDesktopNotifications(savedDesktop === 'true')
        }
    }, [])

    const handleSoundChange = (enabled: boolean) => {
        setSoundEnabled(enabled)
        localStorage.setItem('soundEnabled', String(enabled))
    }

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
            localStorage.setItem('desktopNotifications', 'true')
            toast.success("Notificaciones activadas")
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission()
            if (permission === "granted") {
                setDesktopNotifications(true)
                localStorage.setItem('desktopNotifications', 'true')
                toast.success("Notificaciones activadas")
            }
        }
    }

    const toggleDesktopNotifications = () => {
        if (desktopNotifications) {
            setDesktopNotifications(false)
            localStorage.setItem('desktopNotifications', 'false')
        } else {
            requestNotificationPermission()
        }
    }

    // Calculate Total Amount
    const totalAmount = rawTransactions.reduce((sum, t) => {
        const amount = Number(t.monto) || 0
        return sum + amount
    }, 0).toFixed(2)

    // Check if filter dates are both today
    const isTodaySelected = startDate === today && endDate === today
    const dateLabel = isTodaySelected ? "Pagos de hoy" : "Pagos de la fecha"

    // Business Name display
    const businessName = profileConfig.nombre_negocio || profileConfig.nombre || "Empresa"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userEmail = (user as any)?.email || "admin@empresa.com"

    return (
        <div className="min-h-screen bg-[#f4fbfd] pb-16 font-sans text-slate-800">
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

                {/* Right Status & Profile Pill */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${
                        isConnected 
                            ? 'bg-[#e6f9f0] text-[#00c875] border-[#bbf2d7]' 
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00c875] animate-pulse' : 'bg-rose-500'}`} />
                        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                    </div>

                    <div className="hidden sm:block h-6 w-[1px] bg-slate-200" />

                    {/* Profile User Badge with Options Trigger */}
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                            className="flex items-center gap-2 pl-1 focus:outline-none cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#0095e0] text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 leading-tight">
                                    {userEmail}
                                </span>
                                <span className="text-[10px] font-semibold text-[#0095e0]">
                                    Administrador
                                </span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {/* Dropdown Menu al hacer click en el icono al costado del correo */}
                        {isHeaderMenuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setIsHeaderMenuOpen(false)} 
                                />

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsHeaderMenuOpen(false)
                                            setIsConfigOpen(true)
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                                    >
                                        <Settings className="h-4 w-4 text-[#0095e0]" />
                                        <span>Configuración</span>
                                    </button>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsHeaderMenuOpen(false)
                                            setIsLogoutOpen(true)
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 text-rose-600" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Contenido Principal (100% de Ancho) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                {/* Hero Banner Pastel Blue */}
                <div className="bg-[#f0f9ff] rounded-3xl p-0 border border-blue-100/90 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                    {/* Left text section with Wallet Icon & Payment Stats */}
                    <div className="z-10 py-2.5 px-4 sm:py-3 sm:px-6 flex items-center gap-4 sm:gap-6">
                        {/* Rounded square box with primary color */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[22px] bg-[#0095e0] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0095e0]/25">
                            <Wallet className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2]" />
                        </div>

                        {/* Information stack */}
                        <div className="space-y-0.5">
                            <p className="text-slate-500 font-medium text-xs sm:text-sm">
                                {dateLabel}
                            </p>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0f172a] tracking-tight">
                                S/ {totalAmount}
                            </h2>
                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs sm:text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500 text-white" />
                                <span>{transactions.length} pagos confirmados</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side Image Banner (Desplazado más a la izquierda) */}
                    <div className="relative z-10 w-full md:w-auto self-stretch flex items-center justify-center md:justify-start md:pr-16 lg:pr-28 md:pl-4">
                        <div className="relative w-full md:w-[320px] lg:w-[360px] h-24 sm:h-28 md:h-full min-h-[100px] sm:min-h-[110px]">
                            <Image
                                src="/assets/img/banner_monitor.webp"
                                alt="Tu negocio siempre al día"
                                fill
                                className="object-contain object-center"
                                priority
                            />
                        </div>
                    </div>

                    {/* Background Soft Blur Orbs */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Subscription Warning Card */}
                {subscriptionStatus && !subscriptionStatus.success && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-amber-900 text-sm">No tiene una suscripción activa</h3>
                                <p className="text-amber-700 text-xs mt-0.5">{subscriptionStatus.message || "Activa tu plan para continuar recibiendo notificaciones."}</p>
                            </div>
                        </div>
                        <Button
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs gap-2 rounded-xl h-9 shadow-xs shrink-0"
                            asChild
                        >
                            <a
                                href="https://wa.me/51907796591?text=Quiero%20activar%20mi%20suscripci%C3%B3n%20de%20VerifyApp"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Activar Suscripción en WhatsApp
                            </a>
                        </Button>
                    </div>
                )}

                {/* Filters Card (Admin Only Option) */}
                {profileConfig.showSearchFilter && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        <div className="py-2.5 px-4 sm:py-3 sm:px-5 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-[#0095e0]" />
                                Filtros de Búsqueda por Rango de Fechas
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="h-7 w-7 p-0 rounded-xl"
                            >
                                {isFiltersOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                            </Button>
                        </div>
                        {isFiltersOpen && (
                            <div className="py-2.5 px-4 sm:py-3.5 sm:px-5 bg-slate-50/40">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="start-date" className="text-xs font-bold text-slate-700">Fecha Inicio</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            required
                                            max={today}
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="end-date" className="text-xs font-bold text-slate-700">Fecha Fin</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            required
                                            min={startDate}
                                            max={today}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                                        />
                                    </div>
                                    <div className="flex gap-2.5">
                                        <Button
                                            className="flex-1 bg-[#0095e0] hover:bg-[#0084c7] text-white font-bold text-xs sm:text-sm h-10 rounded-xl shadow-2xs cursor-pointer"
                                            onClick={handleSearch}
                                        >
                                            <Search className="mr-2 h-4 w-4" />
                                            Buscar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs sm:text-sm h-10 rounded-xl cursor-pointer"
                                            onClick={handleExportClick}
                                        >
                                            <Download className="mr-2 h-4 w-4 text-emerald-600" />
                                            Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Card: Transacciones Recientes */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden p-5 sm:p-7 space-y-6">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0095e0] flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4" />
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                {startDate && endDate ? 'Resultados de Búsqueda' : 'Transacciones Recientes'}
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

                            {!profileConfig.showSearchFilter && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStartDate(today)
                                        setEndDate(today)
                                        setQueryParams({ start: today, end: today })
                                        setRefreshTrigger(prev => prev + 1)
                                    }}
                                    className="h-9 px-3 border-slate-200 text-[#0095e0] hover:text-[#0095e0] hover:bg-blue-50/50 font-bold text-xs flex items-center gap-1.5 shadow-2xs rounded-xl cursor-pointer transition-all shrink-0"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Actualizar Hoy</span>
                                </Button>
                            )}
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
                            Dejarás de recibir notificaciones de pagos en tiempo real en este dispositivo.
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

            {/* Modal de Advertencia de Exportación Excel */}
            <Dialog open={isExportWarningOpen} onOpenChange={setIsExportWarningOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 font-bold text-lg flex items-center gap-2">
                            ⚠️ Advertencia Importante
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm text-slate-700 leading-relaxed">
                            Esta hoja de Excel solo es informativa, no para hacer cálculos o tomar decisiones numéricas.
                            Para más seguridad le recomendamos descargarlo desde la misma aplicación (Yape, Plin, etc).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex flex-row gap-3 justify-end">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsExportWarningOpen(false)}
                            className="rounded-xl border-slate-200 text-slate-700 font-semibold h-10 px-4"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="rounded-xl bg-[#0095e0] hover:bg-[#0084c7] text-white font-semibold h-10 px-4" 
                            onClick={handleExport}
                        >
                            Entendido, Descargar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
