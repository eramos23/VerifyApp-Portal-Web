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
import { AyudanteRepository } from "@/lib/repositories/ayudante.repository"
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

function getOrCreateDeviceId(): string {
    if (typeof window === "undefined") return ""
    let id = localStorage.getItem("helper_device_id")
    if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        localStorage.setItem("helper_device_id", id)
    }
    return id
}

function getOrCreateSessionToken(): string {
    if (typeof window === "undefined") return ""
    let token = localStorage.getItem("helper_session_token")
    if (!token) {
        token = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : `tok_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        localStorage.setItem("helper_session_token", token)
    }
    return token
}

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
            const deviceId = getOrCreateDeviceId()
            if (!deviceId) return

            try {
                const res = await AyudanteRepository.consultarEstadoSolicitud(deviceId)
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
        const deviceId = getOrCreateDeviceId()

        try {
            const sessionToken = getOrCreateSessionToken()

            // 1. Iniciar sesión mediante 'fn_iniciar_sesion_ayudante'
            const loginRes = await AyudanteRepository.iniciarSesionAyudante(
                solId,
                deviceId,
                sessionToken
            )

            // 2. Validar sesión
            const valRes = await AyudanteRepository.validarSesionAyudante(
                deviceId,
                sessionToken
            )

            if (valRes?.sesion_valida || loginRes?.ayudante_id) {
                const helperData = {
                    success: true,
                    message: valRes.mensaje || loginRes.mensaje || "Sesión iniciada correctamente",
                    token: sessionToken,
                    ayudante_id: valRes.ayudante_id || loginRes.ayudante_id || "",
                    id_admin: valRes.id_admin || loginRes.id_admin || "",
                    id_canal: valRes.id_canal || loginRes.id_canal || "",
                    nombre: valRes.nombre || loginRes.nombre || "",
                    zona_horaria: loginRes.zona_horaria || ""
                }

                // Update Zustand store
                setUser(helperData as any)
                setRole("ayudante")
                setLoading(false)

                // Save persistent keys in LocalStorage
                localStorage.setItem("helper_device_id", deviceId)
                localStorage.setItem("helper_session_token", sessionToken)
                localStorage.setItem("helper_session_id", loginRes?.session_id || "")
                localStorage.setItem("helper_ayudante_id", helperData.ayudante_id)
                localStorage.setItem("helper_id_admin", helperData.id_admin)
                localStorage.setItem("helper_id_canal", helperData.id_canal)
                localStorage.setItem("helper_nombre", helperData.nombre)
                localStorage.setItem("user_type", "ayudante")

                // Set server cookie for middleware
                await setAyudanteSessionCookie()

                toast.success("¡Sesión iniciada correctamente!")
                router.push("/monitor")
            } else {
                const msg = valRes?.mensaje || "Tu cuenta no está activa o fue desactivada por el administrador."
                toast.error(msg)
            }
        } catch (err: any) {
            console.error("Error al conectar sesión aprobada:", err)
            toast.error(err.message || "Error al validar la sesión del ayudante")
        } finally {
            setIsConnectingApproved(false)
        }
    }

    const handleApprovedSession = async (solId: string, devId: string) => {
        if (isProcessingSession.current) return
        isProcessingSession.current = true

        try {
            stopPolling()
            setStatusText("¡Aprobación recibida! Iniciando sesión...")

            const sessionToken = getOrCreateSessionToken()

            // 1. Iniciar sesión de ayudante
            const loginRes = await AyudanteRepository.iniciarSesionAyudante(
                solId,
                devId,
                sessionToken
            )

            // 2. Validar sesión
            const valRes = await AyudanteRepository.validarSesionAyudante(
                devId,
                sessionToken
            )

            if (valRes?.sesion_valida || loginRes?.ayudante_id) {
                const helperData = {
                    success: true,
                    message: valRes.mensaje || loginRes.mensaje || "Sesión activa",
                    token: sessionToken,
                    ayudante_id: valRes.ayudante_id || loginRes.ayudante_id || "",
                    id_admin: valRes.id_admin || loginRes.id_admin || "",
                    id_canal: valRes.id_canal || loginRes.id_canal || "",
                    nombre: valRes.nombre || loginRes.nombre || "",
                    zona_horaria: loginRes.zona_horaria || ""
                }

                // Update Zustand store
                setUser(helperData as any)
                setRole("ayudante")
                setLoading(false)

                // Save persistent keys in LocalStorage
                localStorage.setItem("helper_device_id", devId)
                localStorage.setItem("helper_session_token", sessionToken)
                localStorage.setItem("helper_session_id", loginRes?.session_id || "")
                localStorage.setItem("helper_ayudante_id", helperData.ayudante_id)
                localStorage.setItem("helper_id_admin", helperData.id_admin)
                localStorage.setItem("helper_id_canal", helperData.id_canal)
                localStorage.setItem("helper_nombre", helperData.nombre)
                localStorage.setItem("user_type", "ayudante")

                // Set server cookie for middleware
                await setAyudanteSessionCookie()

                toast.success("¡Bienvenido! Solicitud aprobada.")
                router.push("/monitor")
            } else {
                setErrorMessage(valRes?.mensaje || "No se pudo validar la sesión del ayudante")
                setView("error")
            }
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

        // 1. Polling fallback every 3 seconds
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await AyudanteRepository.consultarEstadoSolicitud(devId)
                const estado = (res?.estado || "").toLowerCase()

                if (estado === "aceptado" || estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
                    stopPolling()
                    setStatusText(res.mensaje || "¡Solicitud aprobada! Iniciando sesión...")
                    await handleApprovedSession(res.solicitud_id || currentSolId, devId)
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

        // 2. Supabase Realtime channel subscription
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
                            await handleApprovedSession(payload.new?.id || currentSolId, devId)
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
        const deviceId = getOrCreateDeviceId()

        try {
            const response = await AyudanteRepository.solicitarIngresoCanal(
                values.codigoCanal,
                values.nombre,
                deviceId
            )

            const estado = (response?.estado || "").toLowerCase()
            const solId = response?.solicitud_id || ""
            setSolicitudId(solId)

            if (estado === "aceptado" || estado === "aceptada" || estado === "aprobado" || estado === "aprobada") {
                setView("waiting")
                setStatusText(response.mensaje || "¡Solicitud aprobada! Iniciando sesión...")
                await handleApprovedSession(solId, deviceId)
            } else if (estado === "rechazado" || estado === "rechazada") {
                setErrorMessage(response.mensaje || "Tu solicitud fue rechazada por el administrador.")
                setView("error")
            } else {
                // Pendiente or Default
                setView("waiting")
                setStatusText(response.mensaje || "Conectado. Esperando que el administrador apruebe tu solicitud...")
                startListeningAndPolling(deviceId, solId)
            }
        } catch (err: any) {
            console.error("Error al solicitar ingreso:", err)
            toast.error(err.message || "Error al solicitar ingreso al canal")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelOrRetry = () => {
        stopPolling()
        setView("form")
        setErrorMessage("")
        setIsSubmitting(false)
    }

    return (
        <Card className="w-[420px] border-none shadow-xl bg-white">
            <CardHeader className="space-y-1 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-1">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <CardTitle className="text-2xl font-bold text-center text-[#0095e0]">
                    {view === "form" && "Acceso Ayudante"}
                    {view === "waiting" && "Esperando Aprobación"}
                    {view === "error" && "Solicitud Rechazada"}
                </CardTitle>
                <CardDescription className="text-center">
                    {view === "form" && "Ingresa tu nombre y el código de canal de tu administrador"}
                    {view === "waiting" && "El administrador debe aprobar tu solicitud desde su aplicación"}
                    {view === "error" && "No fue posible ingresar al canal"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {view === "form" && (
                    <div className="space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Ayudante</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. Juan Pérez"
                                                    {...field}
                                                    className="focus-visible:ring-[#0095e0]"
                                                    disabled={isSubmitting || isApproved}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="codigoCanal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Código del Canal</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. VERI-9CP1R"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    maxLength={15}
                                                    className="focus-visible:ring-[#0095e0] uppercase tracking-wider font-semibold"
                                                    disabled={isSubmitting || isApproved}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full bg-[#0095e0] hover:bg-[#007bb8] transition-colors mt-2"
                                    disabled={isSubmitting || isApproved}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Solicitando acceso...
                                        </>
                                    ) : (
                                        "Solicitar Acceso"
                                    )}
                                </Button>
                            </form>
                        </Form>

                        {/* Button "Ya tienes acceso" when request is already approved */}
                        {isApproved && (
                            <div className="pt-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    onClick={connectApprovedSession}
                                    disabled={isConnectingApproved}
                                    className="w-full bg-[#2E7D32] hover:bg-[#256629] text-white font-bold h-12 rounded-xl shadow-md transition-all animate-pulse hover:animate-none flex items-center justify-center gap-2"
                                >
                                    {isConnectingApproved ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Conectando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                            <span>Ya tienes acceso</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {view === "waiting" && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
                        <div className="relative flex items-center justify-center w-24 h-24">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-30"></span>
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-sky-50 border-2 border-[#0095e0] text-[#0095e0] shadow-inner">
                                <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                {statusText}
                            </p>
                            <p className="text-xs text-slate-400">
                                Mantén esta pantalla abierta. Te conectaremos automáticamente cuando el administrador responda.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleCancelOrRetry}
                            className="w-full text-slate-600 hover:text-slate-900 border-slate-300"
                        >
                            Cancelar Solicitud
                        </Button>
                    </div>
                )}

                {view === "error" && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                            <AlertCircle className="w-10 h-10" />
                        </div>

                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 font-medium">
                            {errorMessage || "Tu solicitud fue rechazada por el administrador."}
                        </p>

                        <Button
                            onClick={handleCancelOrRetry}
                            className="w-full bg-[#0095e0] hover:bg-[#007bb8] transition-colors"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Intentar de nuevo
                        </Button>
                    </div>
                )}

                <div className="mt-6 text-center text-sm">
                    <Link
                        href="/login/admin"
                        onClick={() => setIsLoading(true)}
                        className="text-[#0095e0] hover:underline font-medium"
                    >
                        Ingresar como Admin &rarr;
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
