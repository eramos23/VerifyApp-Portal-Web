/**
 * Servicio de persistencia para la gestión del almacenamiento local del Ayudante (LocalStorage).
 * Aplica el Principio de Responsabilidad Única para las operaciones de almacenamiento en el cliente.
 */
export class AyudanteStorageService {
    private static SESSION_TOKEN_KEY = "helper_session_token"
    private static DEVICE_ID_KEY = "helper_device_id"
    private static ADMIN_ID_KEY = "helper_id_admin"
    private static AYUDANTE_ID_KEY = "helper_ayudante_id"
    private static CANAL_ID_KEY = "helper_id_canal"
    private static NOMBRE_KEY = "helper_nombre"
    private static SESSION_ID_KEY = "helper_session_id"
    private static USER_TYPE_KEY = "user_type"

    /**
     * Obtiene o genera un ID de dispositivo persistente y único para esta instancia del navegador.
     */
    static getDeviceId(): string {
        if (typeof window === "undefined") return ""
        let id = localStorage.getItem(this.DEVICE_ID_KEY)
        if (!id) {
            id = typeof crypto !== "undefined" && crypto.randomUUID 
                ? crypto.randomUUID() 
                : `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            localStorage.setItem(this.DEVICE_ID_KEY, id)
        }
        return id
    }

    /**
     * Obtiene el token de sesión almacenado actualmente.
     * Nota: El token de sesión SOLO se guarda DESPUÉS de un inicio de sesión o validación exitosa.
     */
    static getSessionToken(): string {
        if (typeof window === "undefined") return ""
        return localStorage.getItem(this.SESSION_TOKEN_KEY) || ""
    }

    /**
     * Guarda el token de sesión ÚNICAMENTE tras una verificación o inicio de sesión explícito.
     */
    static saveSessionToken(token: string): void {
        if (typeof window === "undefined" || !token) return
        localStorage.setItem(this.SESSION_TOKEN_KEY, token.trim())
    }

    /**
     * Guarda todas las claves de sesión tras un inicio de sesión exitoso.
     */
    static saveAyudanteSession(data: {
        sessionToken: string
        ayudanteId?: string
        adminId?: string
        canalId?: string
        nombre?: string
        sessionId?: string
    }): void {
        if (typeof window === "undefined") return

        if (data.sessionToken) {
            localStorage.setItem(this.SESSION_TOKEN_KEY, data.sessionToken.trim())
        }
        if (data.ayudanteId) {
            localStorage.setItem(this.AYUDANTE_ID_KEY, data.ayudanteId)
        }
        if (data.adminId) {
            localStorage.setItem(this.ADMIN_ID_KEY, data.adminId)
        }
        if (data.canalId) {
            localStorage.setItem(this.CANAL_ID_KEY, data.canalId)
        }
        if (data.nombre) {
            localStorage.setItem(this.NOMBRE_KEY, data.nombre)
        }
        if (data.sessionId) {
            localStorage.setItem(this.SESSION_ID_KEY, data.sessionId)
        }
        localStorage.setItem(this.USER_TYPE_KEY, "ayudante")
    }

    /**
     * Limpia todas las claves de sesión de LocalStorage al cerrar sesión o revocarse la sesión.
     * Equivale a Kotlin: SecurePrefs.remove(context, "helper_session_token")
     */
    static clearAyudanteSession(): void {
        if (typeof window === "undefined") return
        localStorage.removeItem(this.SESSION_TOKEN_KEY)
        localStorage.removeItem(this.ADMIN_ID_KEY)
        localStorage.removeItem(this.AYUDANTE_ID_KEY)
        localStorage.removeItem(this.CANAL_ID_KEY)
        localStorage.removeItem(this.NOMBRE_KEY)
        localStorage.removeItem(this.SESSION_ID_KEY)
        localStorage.removeItem(this.USER_TYPE_KEY)
    }

    /**
     * Obtiene el ID del administrador asociado al ayudante.
     */
    static getAdminId(): string {
        if (typeof window === "undefined") return ""
        return localStorage.getItem(this.ADMIN_ID_KEY) || ""
    }

    /**
     * Obtiene el ID del ayudante.
     */
    static getAyudanteId(): string {
        if (typeof window === "undefined") return ""
        return localStorage.getItem(this.AYUDANTE_ID_KEY) || ""
    }
}
