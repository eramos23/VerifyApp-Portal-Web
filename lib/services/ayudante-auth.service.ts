import { AyudanteRepository, IniciarSesionAyudanteResponse, ValidarSesionAyudanteResponse, EstadoSolicitudAyudanteResponse, SolicitarIngresoResponse } from "@/lib/repositories/ayudante.repository"
import { CryptoService } from "@/lib/services/crypto.service"
import { AyudanteStorageService } from "@/lib/services/ayudante-storage.service"

export interface AyudanteSessionData {
    success: boolean
    message: string
    token: string
    ayudante_id: string
    id_admin: string
    id_canal?: string
    nombre?: string
    zona_horaria?: string
}

/**
 * Servicio de Autenticación de alto nivel para Ayudante.
 * Implementa la lógica de negocio, sincronización de tokens de sesión y actualización de almacenamiento según los principios SOLID.
 */
export class AyudanteAuthService {
    /**
     * Envía una solicitud de ingreso al canal con el código y nombre especificados.
     */
    static async solicitarIngreso(codigoCanal: string, nombre: string): Promise<SolicitarIngresoResponse> {
        const deviceId = AyudanteStorageService.getDeviceId()
        return await AyudanteRepository.solicitarIngresoCanal(codigoCanal, nombre, deviceId)
    }

    /**
     * Consulta el estado de la solicitud actual para este dispositivo.
     */
    static async consultarEstadoSolicitud(): Promise<EstadoSolicitudAyudanteResponse> {
        const deviceId = AyudanteStorageService.getDeviceId()
        return await AyudanteRepository.consultarEstadoSolicitud(deviceId)
    }

    /**
     * Inicia sesión para una solicitud aprobada ejecutando la validación en dos pasos de Kotlin:
     * 1. Llama a 'fn_iniciar_sesion_ayudante' con el token generado.
     * 2. Llama inmediatamente a 'fn_validar_sesion_ayudante' para verificar si el ayudante sigue activo.
     * Solo guarda credenciales en LocalStorage si 'sesion_valida' es true.
     */
    static async iniciarSesion(solicitudId: string): Promise<AyudanteSessionData> {
        const deviceId = AyudanteStorageService.getDeviceId()
        let currentToken = AyudanteStorageService.getSessionToken()
        if (!currentToken) {
            currentToken = CryptoService.generateSecureSessionToken()
        }

        let attempts = 0
        let loginRes: IniciarSesionAyudanteResponse | null = null

        // 1. Iniciar sesión mediante 'fn_iniciar_sesion_ayudante'
        while (loginRes === null && attempts < 3) {
            attempts++
            try {
                loginRes = await AyudanteRepository.iniciarSesionAyudante(
                    solicitudId,
                    deviceId,
                    currentToken
                )
            } catch (error: any) {
                const errMsg = (error.message || "") + " " + (error.details || "")
                const isDuplicateToken =
                    errMsg.toLowerCase().includes("token_hash") ||
                    errMsg.toLowerCase().includes("duplicate key") ||
                    errMsg.toLowerCase().includes("already exists") ||
                    error.code === '23505'

                if (isDuplicateToken && attempts < 3) {
                    console.warn(`[AUTH] Token duplicado en DB (${error.code}). Regenerando nuevo token (intento ${attempts}/3)...`)
                    currentToken = CryptoService.generateSecureSessionToken()
                } else {
                    console.error("Error al iniciar sesión de ayudante:", error)
                    throw new Error(error.message || error.hint || "No se pudo iniciar sesión de ayudante")
                }
            }
        }

        if (!loginRes || (!loginRes.ayudante_id && !loginRes.session_id)) {
            throw new Error("No se pudo iniciar la sesión del ayudante")
        }

        // Guardar temporalmente el token enviado para validar
        AyudanteStorageService.saveSessionToken(currentToken)

        // 2. Validar inmediatamente el estado activo del ayudante mediante 'fn_validar_sesion_ayudante'
        const valRes = await this.validarSesion(currentToken)

        if (!valRes.sesion_valida) {
            const errorMsg = valRes.mensaje || "Tu cuenta no está activa o fue desactivada por el administrador."
            console.warn(`⛔ Sesión de ayudante no válida tras login: ${errorMsg}`)
            AyudanteStorageService.clearAyudanteSession()
            throw new Error(errorMsg)
        }

        // 3. Confirmar datos en LocalStorage si 'sesion_valida' es true
        const helperId = valRes.ayudante_id || loginRes.ayudante_id || ""
        const adminId = valRes.id_admin || loginRes.id_admin || ""
        const canalId = valRes.id_canal || loginRes.id_canal || ""
        const nombre = valRes.nombre || loginRes.nombre || ""

        AyudanteStorageService.saveAyudanteSession({
            sessionToken: currentToken,
            ayudanteId: helperId,
            adminId: adminId,
            canalId: canalId,
            nombre: nombre,
            sessionId: loginRes.session_id
        })

        console.log(`✅ Sesión validada exitosamente para ayudante: ${nombre}`)

        return {
            success: true,
            message: valRes.mensaje || loginRes.mensaje || "Sesión iniciada correctamente",
            token: currentToken,
            ayudante_id: helperId,
            id_admin: adminId,
            id_canal: canalId,
            nombre: nombre,
            zona_horaria: loginRes.zona_horaria || "America/Lima"
        }
    }

    /**
     * Valida el token de sesión existente contra PostgreSQL.
     * Equivale a Kotlin: repoNotification.validateUserState() / validarSesionAyudante()
     */
    static async validarSesion(sessionTokenOverride?: string): Promise<ValidarSesionAyudanteResponse> {
        const deviceId = AyudanteStorageService.getDeviceId()
        const sessionToken = (sessionTokenOverride || AyudanteStorageService.getSessionToken()).trim()

        if (!deviceId || !sessionToken) {
            AyudanteStorageService.clearAyudanteSession()
            return { sesion_valida: false, mensaje: "Device ID o Token de sesión inválido" }
        }

        try {
            const res = await AyudanteRepository.validarSesionAyudante(deviceId, sessionToken)

            if (res && res.sesion_valida) {
                // Actualizar datos en Secure Storage (AyudanteStorageService)
                // Equivale a Kotlin: SecurePrefs.saveString(...)
                AyudanteStorageService.saveAyudanteSession({
                    sessionToken: sessionToken,
                    ayudanteId: res.ayudante_id,
                    adminId: res.id_admin,
                    canalId: res.id_canal,
                    nombre: res.nombre
                })
                console.log(`✅ fn_validar_sesion_ayudante exitoso: ayudanteId=${res.ayudante_id}, msg=${res.mensaje}`)
            } else {
                console.warn(`❌ fn_validar_sesion_ayudante falló: ${res?.mensaje}`)
                AyudanteStorageService.clearAyudanteSession()
            }

            return res
        } catch (err: any) {
            console.error("Error al validar sesión del ayudante:", err)
            AyudanteStorageService.clearAyudanteSession()
            return { sesion_valida: false, mensaje: err.message || "Error al validar la sesión del ayudante" }
        }
    }

    /**
     * Cierra la sesión eliminando todas las credenciales locales.
     */
    static logout(): void {
        AyudanteStorageService.clearAyudanteSession()
    }
}
