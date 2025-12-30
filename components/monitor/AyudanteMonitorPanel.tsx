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
import { ProfileRepository } from "@/lib/repositories/profile.repository"
import { NotificationItem, transactionToNotificationItem, realtimeTransactionToNotificationItem } from "@/lib/utils/transaction-mapper"
import { signOut } from "@/app/actions/auth"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { LogOut, Settings, MoreVertical, Volume2, VolumeX, Bell, BellOff, Radio } from "lucide-react"

export function AyudanteMonitorPanel() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const { setIsLoading } = useLoadingStore()

    // State for transactions
    const [transactions, setTransactions] = useState<NotificationItem[]>([])
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([])
    const [soundEnabled, setSoundEnabled] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const [desktopNotifications, setDesktopNotifications] = useState(false)

    // Admin Name Link
    const [displayAdminName, setDisplayAdminName] = useState<string>("Usuario")

    // Get today's date in Lima Timezone
    const nowLima = DateTime.now().setZone("America/Lima")
    const today = nowLima.toFormat("yyyy-MM-dd")

    // Admin ID (from Ayudante user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminId = (user as any)?.id_admin

    // Fetch Admin Name
    useEffect(() => {
        const fetchName = async () => {
            if (adminId) {
                const name = await ProfileRepository.getAdminName(adminId)
                if (name && name.nombre) setDisplayAdminName(name.nombre)
            }
        }
        fetchName()
    }, [adminId])

    // Initial Fetch (Always Today for Ayudante)
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!adminId) return

            setIsLoading(true)

            try {
                // Construct today range in Lima Timezone
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

            } catch (error) {
                console.error("Error fetching transactions:", error)
                toast.error("Error al cargar transacciones")
            } finally {
                setIsLoading(false)
            }
        }

        fetchTransactions()
    }, [adminId, setIsLoading])

    // Realtime Hook
    const { isConnected } = useRealtimeTransactions(adminId, (newTransaction) => {
        try {
            const mappedTransaction = realtimeTransactionToNotificationItem(newTransaction)

            // Ayudante always sees today, so always add
            setTransactions((prev) => [mappedTransaction, ...prev])
            setRawTransactions((prev) => [newTransaction, ...prev])

            setHighlightedId(mappedTransaction.id)
            setTimeout(() => setHighlightedId(null), 5000)

            if (soundEnabled) {
                const audio = new Audio('/audio/yape_sonido.mp3')
                audio.play().catch(e => console.error("Audio play failed", e))
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
                        Monitor de pagos de {displayAdminName}
                    </h2>
                    <p className="text-muted-foreground">
                        Panel de Ayudante
                    </p>
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

            {/* Table Section */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="px-6 pt-6 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                        Transacciones de Hoy
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
        </div>
    )
}
