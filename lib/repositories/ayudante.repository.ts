import { publicSupabase } from "@/lib/supabase/client"

export interface SolicitarIngresoResponse {
    solicitud_id?: string
    id_admin?: string
    id_canal?: string
    codigo_canal?: string
    estado?: string
    mensaje?: string
}

export interface EstadoSolicitudAyudanteResponse {
    solicitud_id?: string
    id_admin?: string
    id_canal?: string
    nombre?: string
    estado?: string
    fecha_solicitud?: string
    fecha_respuesta?: string
    mensaje?: string
}

export interface IniciarSesionAyudanteResponse {
    ayudante_id?: string
    id_admin?: string
    id_canal?: string
    nombre?: string
    activo?: boolean
    session_id?: string
    fecha_expiracion?: string
    zona_horaria?: string
    mensaje?: string
}

export interface ValidarSesionAyudanteResponse {
    sesion_valida: boolean
    ayudante_id?: string
    id_admin?: string
    id_canal?: string
    nombre?: string
    mensaje?: string
}

export function generateSecureSessionToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
    }
    return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`
}

export const AyudanteRepository = {
    async solicitarIngresoCanal(codigoCanal: string, nombre: string, deviceId: string) {
        const { data, error } = await publicSupabase
            .rpc('fn_solicitar_ingreso_canal', {
                p_codigo: codigoCanal.trim(),
                p_nombre: nombre.trim(),
                p_device_id: deviceId.trim()
            })

        if (error) {
            console.error("Error al solicitar ingreso al canal:", error)
            throw new Error(error.message || error.hint || "El código de canal no existe o está inactivo")
        }

        const res = Array.isArray(data) ? data[0] : data
        return res as SolicitarIngresoResponse
    },

    async consultarEstadoSolicitud(deviceId: string) {
        const { data, error } = await publicSupabase
            .rpc('fn_consultar_solicitud_ayudante', {
                p_device_id: deviceId.trim()
            })

        if (error) {
            console.error("Error al consultar estado de solicitud:", error)
            throw new Error(error.message || error.hint || "Error al consultar estado de la solicitud")
        }

        const res = Array.isArray(data) ? data[0] : data
        return res as EstadoSolicitudAyudanteResponse
    },

    async iniciarSesionAyudante(solicitudId: string, deviceId: string, sessionToken: string) {
        let currentToken = sessionToken.trim() || generateSecureSessionToken()
        let attempts = 0
        let result: IniciarSesionAyudanteResponse | null = null

        while (result === null && attempts < 3) {
            attempts++
            const { data, error } = await publicSupabase
                .rpc('fn_iniciar_sesion_ayudante', {
                    p_solicitud_id: solicitudId.trim(),
                    p_device_id: deviceId.trim(),
                    p_session_token: currentToken
                })

            if (!error && data) {
                const res = Array.isArray(data) ? data[0] : data
                result = res as IniciarSesionAyudanteResponse

                if (typeof window !== 'undefined') {
                    localStorage.setItem("helper_session_token", currentToken)
                }
            } else if (error) {
                const errMsg = (error.message || "") + " " + (error.details || "")
                const isDuplicateToken =
                    errMsg.toLowerCase().includes("token_hash") ||
                    errMsg.toLowerCase().includes("duplicate key") ||
                    errMsg.toLowerCase().includes("already exists") ||
                    error.code === '23505'

                if (isDuplicateToken && attempts < 3) {
                    currentToken = generateSecureSessionToken()
                    console.warn(`[AUTH] Token duplicado en DB (${error.code}). Regenerando nuevo token (intento ${attempts}/3)...`)
                } else {
                    console.error("Error al iniciar sesión de ayudante:", error)
                    throw new Error(error.message || error.hint || "No se pudo iniciar sesión de ayudante")
                }
            }
        }

        if (!result) {
            throw new Error("No se recibió respuesta al iniciar sesión de ayudante")
        }

        return result
    },

    async validarSesionAyudante(deviceId: string, sessionToken: string) {
        const tokenToValidate = sessionToken.trim() || (typeof window !== 'undefined' ? localStorage.getItem("helper_session_token") || "" : "")

        const { data, error } = await publicSupabase
            .rpc('fn_validar_sesion_ayudante', {
                p_device_id: deviceId.trim(),
                p_session_token: tokenToValidate.trim()
            })

        if (error) {
            console.error("Error al validar sesión de ayudante:", error)
            throw new Error(error.message || error.hint || "Sesión de ayudante no válida")
        }

        const res = Array.isArray(data) ? data[0] : data
        return res as ValidarSesionAyudanteResponse
    }
}
