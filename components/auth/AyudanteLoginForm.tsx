"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, RefreshCw, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AyudanteAuthService } from "@/lib/services/ayudante-auth.service"
import { AyudanteStorageService } from "@/lib/services/ayudante-storage.service"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { setAyudanteSessionCookie } from "@/app/actions/auth"
import { supabase } from "@/lib/supabase/client"

const formSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es requerido" }).max(50, { message: "Máximo 50 caracteres" }),
    codigoCanal: z
        .string()
        .min(3, { message: "El código debe tener al menos 3 caracteres" })
        .max(15, { message: "Máximo 15 caracteres" }),
})

export function AyudanteLoginForm() {
    const router = useRouter()
    const { setUser, setRole, setLoading } = useAuthStore()
    const { setIsLoading } = useLoadingStore()

    const [view, setView] = useState<"form" | "waiting" | "error">("form")
    const [statusText, setStatusText] = useState("Esperando respuesta del administrador...")
    const [errorMessage, setErrorMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [solicitudId, setSolicitudId] = useState("")

    // Approved session state for "Ya tienes acceso" button
    const [isApproved, setIsApproved] = useState(false)
    const [approvedSolicitudId, setApprovedSolicitudId] = useState<string | null>(null)
    const [isConnectingApproved, setIsConnectingApproved] = useState(false)

    const isProcessingSession = useRef(false)
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            codigoCanal: "",
        },
    })

    // Check if device already has an approved request or pending request on mount
    useEffect(() => {
        setIsLoading(false)

        const checkIfApproved = async () => {
            const deviceId = AyudanteStorageService.getDeviceId()
            if (!deviceId) return

            try {
                const res = await AyudanteAuthService.consultarEstadoSolicitud()
                const estado = (res?.estado || "").toLowerCase()
                const solId = res?.solicitud_id || null

                if (estado === "aceptado" || estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
                    setIsApproved(true)
                    setApprovedSolicitudId(solId)
                } else if (estado === "pendiente") {
                    setIsApproved(false)
                    setApprovedSolicitudId(solId)
                    setSolicitudId(solId || "")
                    setView("waiting")
                    setStatusText(res.mensaje || "Conectado. Esperando que el administrador apruebe tu solicitud...")
                    startListeningAndPolling(deviceId, solId || "")
                } else {
                    setIsApproved(false)
                    setApprovedSolicitudId(null)
                }
            } catch (err) {
                console.log("No request status found on mount:", err)
                setIsApproved(false)
                setApprovedSolicitudId(null)
            }
        }

        checkIfApproved()

        return () => {
            stopPolling()
        }
    }, [])

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
        }
    }

    const connectApprovedSession = async () => {
        const solId = approvedSolicitudId
        if (!solId) {
            toast.error("No se encontró solicitud aprobada")
            return
        }

        setIsConnectingApproved(true)

        try {
            // 1. Iniciar sesión mediante AyudanteAuthService
            // Genera token seguro de 256 bits y guarda en storage SOLO tras respuesta exitosa de DB
            const helperData = await AyudanteAuthService.iniciarSesion(solId)

            // 2. Actualizar estado y galletas
            setUser(helperData as any)
            setRole("ayudante")
            setLoading(false)

            await setAyudanteSessionCookie()

            toast.success("¡Sesión iniciada correctamente!")
            router.push("/monitor")
        } catch (err: any) {
            console.error("Error al conectar sesión aprobada:", err)
            toast.error(err.message || "Error al validar la sesión del ayudante")
        } finally {
            setIsConnectingApproved(false)
        }
    }

    const handleApprovedSession = async (solId: string) => {
        if (isProcessingSession.current) return
        isProcessingSession.current = true

        try {
            stopPolling()
            setStatusText("¡Aprobación recibida! Iniciando sesión...")

            // Iniciar sesión y guardar credenciales en LocalStorage
            const helperData = await AyudanteAuthService.iniciarSesion(solId)

            // Actualizar estado global y cookie de servidor
            setUser(helperData as any)
            setRole("ayudante")
            setLoading(false)

            await setAyudanteSessionCookie()

            toast.success("¡Bienvenido! Solicitud aprobada.")
            router.push("/monitor")
        } catch (err: any) {
            console.error("Error al procesar sesión aprobada:", err)
            setErrorMessage(err.message || "Error al iniciar sesión")
            setView("error")
        } finally {
            isProcessingSession.current = false
        }
    }

    const startListeningAndPolling = (devId: string, currentSolId: string) => {
        stopPolling()

        // 1. Polling fallback cada 3 segundos
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await AyudanteAuthService.consultarEstadoSolicitud()
                const estado = (res?.estado || "").toLowerCase()

                if (estado === "aceptado" || estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
                    stopPolling()
                    setStatusText(res.mensaje || "¡Solicitud aprobada! Iniciando sesión...")
                    await handleApprovedSession(res.solicitud_id || currentSolId)
                } else if (estado === "rechazado" || estado === "rechazada") {
                    stopPolling()
                    setErrorMessage(res.mensaje || "Tu solicitud fue rechazada por el administrador.")
                    setView("error")
                } else if (estado === "no_encontrada") {
                    stopPolling()
                    setErrorMessage(res.mensaje || "No existe una solicitud para este dispositivo.")
                    setView("error")
                } else if (res.mensaje) {
                    setStatusText(res.mensaje)
                }
            } catch (err) {
                console.error("Error polling estado solicitud:", err)
            }
        }, 3000)

        // 2. Suscripción Supabase Realtime
        try {
            const channel = supabase
                .channel(`solicitud_ayudante_${devId}`)
                .on(
                    'postgres_changes' as any,
                    {
                        event: '*',
                        schema: 'public',
                        table: 'solicitud_ayudante',
                        filter: `device_id=eq.${devId}`
                    },
                    async (payload: any) => {
                        const newEstado = (payload.new?.estado || "").toLowerCase()
                        if (newEstado === "aceptado" || newEstado === "aceptada" || newEstado === "aprobado" || newEstado === "aprobada") {
                            stopPolling()
                            setStatusText("¡Aprobación recibida en tiempo real! Iniciando sesión...")
                            await handleApprovedSession(payload.new?.id || currentSolId)
                        } else if (newEstado === "rechazado" || newEstado === "rechazada") {
                            stopPolling()
                            setErrorMessage(payload.new?.mensaje || "Tu solicitud fue rechazada por el administrador.")
                            setView("error")
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        } catch (rtErr) {
            console.log("Realtime subscription fallback to polling:", rtErr)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        setErrorMessage("")

        try {
            const response = await AyudanteAuthService.solicitarIngreso(
                values.codigoCanal,
                values.nombre
            )

            const estado = (response?.estado || "").toLowerCase()
            const solId = response?.solicitud_id || ""
            setSolicitudId(solId)

            if (estado === "aceptado" || estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
                await handleApprovedSession(solId)
            } else if (estado === "pendiente") {
                setView("waiting")
                setStatusText(response?.mensaje || "Solicitud enviada. Esperando que el administrador te dé acceso...")
                const deviceId = AyudanteStorageService.getDeviceId()
                startListeningAndPolling(deviceId, solId)
            } else {
                setErrorMessage(response?.mensaje || "No se pudo procesar la solicitud.")
                setView("error")
            }
        } catch (error: any) {
            console.error("Error al solicitar ingreso:", error)
            setErrorMessage(error.message || "Error al conectar con el servidor.")
            setView("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRetry = () => {
        stopPolling()
        setView("form")
        setErrorMessage("")
        setIsSubmitting(false)
    }

    return (
        <Card className="w-[400px] border-none shadow-xl bg-white">
            <CardHeader className="space-y-1 flex flex-col items-center">
                <div className="relative w-40 h-40 mb-1">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <CardTitle className="text-2xl font-bold text-center text-[#0095e0]">Ayudante</CardTitle>
                <CardDescription className="text-center">
                    {view === "form" && "Ingresa tus datos y el código proporcionado por el administrador"}
                    {view === "waiting" && "Tu solicitud fue enviada correctamente"}
                    {view === "error" && "Ocurrió un problema con tu solicitud de ingreso"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                    {/* VIEW: FORM */}
                    {view === "form" && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-gray-700">Tu Nombre</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Juan Pérez"
                                                    {...field}
                                                    disabled={isSubmitting}
                                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="codigoCanal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-gray-700">Código del Canal</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. CANAL123"
                                                    {...field}
                                                    disabled={isSubmitting}
                                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white uppercase text-sm"
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-10 font-semibold bg-[#0095e0] hover:bg-[#0095e0]/90 text-white transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Enviando solicitud...</span>
                                        </div>
                                    ) : (
                                        "Ingresar"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}

                    {/* VIEW: WAITING */}
                    {view === "waiting" && (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#0095e0] animate-pulse">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                                    <Loader2 className="w-4 h-4 text-[#0095e0] animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-1 max-w-xs">
                                <p className="text-sm font-medium text-gray-800">
                                    {statusText}
                                </p>
                                <p className="text-xs text-gray-500">
                                    El administrador recibirá una notificación para aprobar tu dispositivo.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetry}
                                className="mt-2 text-xs text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                Cancelar / Volver a intentar
                            </Button>
                        </div>
                    )}

                    {/* VIEW: ERROR */}
                    {view === "error" && (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-800">
                                    {errorMessage || "No se pudo completar el ingreso"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Verifica que el código del canal sea correcto o consulta con tu administrador.
                                </p>
                            </div>
                            <Button
                                onClick={handleRetry}
                                className="w-full bg-[#0095e0] hover:bg-[#0095e0]/90 text-white font-semibold text-xs h-9"
                            >
                                Intentar nuevamente
                            </Button>
                        </div>
                    )}

                    {/* APPROVED SESSION FALLBACK BUTTON: "Ya tienes acceso" */}
                    {isApproved && view === "form" && (
                        <div className="pt-2 border-t border-gray-100">
                            <Button
                                type="button"
                                onClick={connectApprovedSession}
                                disabled={isConnectingApproved}
                                className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-none animate-pulse transition-all flex items-center justify-center gap-2 shadow-md text-xs cursor-pointer"
                            >
                                {isConnectingApproved ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Conectando sesión...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                        <span>Ya tienes acceso - Entrar ahora</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Link to Admin Login */}
                    <div className="pt-4 text-center">
                        <Link
                            href="/login/admin"
                            className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-[#0095e0] transition-colors group"
                        >
                            <span>Ingresar como Admin</span>
                            <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
    )
}
