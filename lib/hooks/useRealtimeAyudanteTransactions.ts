"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Transaction } from "@/types/transaction"
import { AyudanteAuthService } from "@/lib/services/ayudante-auth.service"

/**
 * Función auxiliar para normalizar el payload de una transacción.
 * Soporta nombres de campos tanto en formato snake_case como en camelCase.
 */
function normalizeTransaction(data: any): Transaction {
    const raw = data?.record || data?.payload || data?.new || data || {}
    return {
        id: raw.id || raw.id_transaccion || raw.idTransaccion || (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now())),
        id_usuario: raw.id_usuario || raw.idUsuario || "",
        id_billetera_catalogo: raw.id_billetera_catalogo || raw.idBilleteraCatalogo || null,
        origen: raw.origen || "Desconocido",
        mensaje_original: raw.mensaje_original || raw.mensajeOriginal || "",
        monto: Number(raw.monto) || 0,
        moneda_texto: raw.moneda_texto || raw.monedaTexto || "S/",
        nombre_remitente: raw.nombre_remitente || raw.nombreRemitente || null,
        codigo_seguridad: raw.codigo_seguridad || raw.codigoSeguridad || null,
        fecha_notificacion: raw.fecha_notificacion || raw.fechaNotificacion || new Date().toISOString(),
        datos_adicionales: raw.datos_adicionales || raw.datosAdicionales || null
    }
}

interface HelperPresence {
    userId: string
    role: string
    onlineAt: number
}

/**
 * Hook personalizado para manejar transacciones en tiempo real del Ayudante.
 * Conecta al canal Broadcast "notificacion_ayudantes-${adminId}" y registra presencia.
 */
export function useRealtimeAyudanteTransactions(
    adminId: string | undefined,
    helperId: string | undefined,
    onData: (data: Transaction) => void,
    onSessionExpired?: () => void
) {
    const [isConnected, setIsConnected] = useState(false)
    const onDataRef = useRef(onData)
    const onSessionExpiredRef = useRef(onSessionExpired)

    useEffect(() => {
        onDataRef.current = onData
    }, [onData])

    useEffect(() => {
        onSessionExpiredRef.current = onSessionExpired
    }, [onSessionExpired])

    useEffect(() => {
        if (!adminId) {
            console.log("❌ useRealtimeAyudanteTransactions: falta adminId")
            return
        }

        let isMounted = true
        let channel: any = null

        const validateSession = async () => {
            if (typeof window === "undefined") return true

            try {
                const res = await AyudanteAuthService.validarSesion()
                if (res && res.sesion_valida === false) {
                    console.warn("⛔ Ayudante fue desactivado o la sesión expiró.")
                    toast.error("Tu usuario fue desactivado por el administrador.")
                    if (onSessionExpiredRef.current) {
                        onSessionExpiredRef.current()
                    }
                    return false
                }
            } catch (err) {
                console.error("Error validando sesión de ayudante:", err)
            }
            return true
        }

        const setupRealtime = async () => {
            const channelId = `notificacion_ayudantes-${adminId}`
            console.log(`🔌 [AYUDANTE] Inicializando canal Broadcast para ayudante: ${channelId}`)
            setIsConnected(false)

            // Crear canal de Supabase Realtime
            channel = supabase.channel(channelId, {
                config: {
                    broadcast: { self: false }
                }
            })

            // 1. Escuchar evento Broadcast "notificacion_ayudantes"
            channel.on(
                'broadcast',
                { event: 'notificacion_ayudantes' },
                async (payload: any) => {
                    console.log("🔔 [AYUDANTE] Broadcast recibido:", payload)

                    const isSessionValid = await validateSession()
                    if (!isSessionValid) return

                    const tx = normalizeTransaction(payload.payload || payload)
                    if (onDataRef.current) {
                        try {
                            onDataRef.current(tx)
                        } catch (err) {
                            console.error("Error en callback de broadcast para ayudante:", err)
                        }
                    }
                }
            )

            // 2. Escuchar eventos INSERT de Postgres en notificacion.transacciones
            channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'notificacion',
                    table: 'transacciones',
                    filter: `id_usuario=eq.${adminId}`
                },
                async (payload: any) => {
                    console.log("🔥 [AYUDANTE] Cambio de Postgres recibido:", payload)

                    const isSessionValid = await validateSession()
                    if (!isSessionValid) return

                    const tx = normalizeTransaction(payload.new || payload)
                    if (onDataRef.current) {
                        try {
                            onDataRef.current(tx)
                        } catch (err) {
                            console.error("Error en callback de cambio de postgres para ayudante:", err)
                        }
                    }
                }
            )

            // 3. Suscribirse y registrar presencia al estar SUBSCRIBED
            channel.subscribe(async (status: string, err: any) => {
                if (!isMounted) return
                console.log(`📊 [AYUDANTE] Estado canal broadcast [${channelId}]:`, status)

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)

                    // Validar inmediatamente la sesión en PostgreSQL al conectarse el canal
                    const isSessionValid = await validateSession()
                    if (!isSessionValid) return

                    if (helperId) {
                        try {
                            const presence: HelperPresence = {
                                userId: helperId,
                                role: "ayudante",
                                onlineAt: Date.now()
                            }
                            await channel.track(presence)
                            console.log("✅ [AYUDANTE] Presencia registrada para ayudante:", helperId)
                        } catch (presenceErr) {
                            console.error("❌ Error registrando presencia para ayudante:", presenceErr)
                        }
                    }
                } else {
                    setIsConnected(false)
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.error("❌ [AYUDANTE] Error en canal Broadcast:", err)
                    }
                }
            })
        }

        setupRealtime()

        return () => {
            isMounted = false
            if (channel) {
                console.log(`🔌 [AYUDANTE] Limpiando canal Broadcast: notificacion_ayudantes-${adminId}`)
                supabase.removeChannel(channel)
            }
            setIsConnected(false)
        }
    }, [adminId, helperId])

    return { isConnected }
}
