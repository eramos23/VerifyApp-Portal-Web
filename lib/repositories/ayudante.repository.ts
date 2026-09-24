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

/**
 * Capa de Repositorio para la ejecución de funciones RPC del backend de Ayudante.
 * Objeto de Acceso a Datos (DAO) puro siguiendo los principios SOLID.
 */
export const AyudanteRepository = {
    /**
     * Invoca la función RPC 'fn_solicitar_ingreso_canal'.
     */
    async solicitarIngresoCanal(codigoCanal: string, nombre: string, deviceId: string): Promise<SolicitarIngresoResponse> {
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

    /**
     * Invoca la función RPC 'fn_consultar_solicitud_ayudante'.
     */
    async consultarEstadoSolicitud(deviceId: string): Promise<EstadoSolicitudAyudanteResponse> {
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

    /**
     * Invoca la función RPC 'fn_iniciar_sesion_ayudante'.
     */
    async iniciarSesionAyudante(solicitudId: string, deviceId: string, sessionToken: string): Promise<IniciarSesionAyudanteResponse> {
        const { data, error } = await publicSupabase
            .rpc('fn_iniciar_sesion_ayudante', {
                p_solicitud_id: solicitudId.trim(),
                p_device_id: deviceId.trim(),
                p_session_token: sessionToken.trim()
            })

        if (error) {
            console.error("Error al iniciar sesión de ayudante:", error)
            throw error
        }

        const res = Array.isArray(data) ? data[0] : data
        return res as IniciarSesionAyudanteResponse
    },

    /**
     * Invoca la función RPC 'fn_validar_sesion_ayudante'.
     */
    async validarSesionAyudante(deviceId: string, sessionToken: string): Promise<ValidarSesionAyudanteResponse> {
        const { data, error } = await publicSupabase
            .rpc('fn_validar_sesion_ayudante', {
                p_device_id: deviceId.trim(),
                p_session_token: sessionToken.trim()
            })

        if (error) {
            console.error("Error al validar sesión de ayudante:", error)
            throw new Error(error.message || error.hint || "Sesión de ayudante no válida")
        }

        const res = Array.isArray(data) ? data[0] : data
        return res as ValidarSesionAyudanteResponse
    }
}
