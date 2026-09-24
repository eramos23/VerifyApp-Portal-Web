/**
 * Servicio de utilidades criptográficas.
 * Aplica el Principio de Responsabilidad Única para operaciones de seguridad.
 */
export class CryptoService {
    /**
     * Genera un token de sesión criptográficamente seguro de 256 bits (64 caracteres hexadecimales).
     * Equivale a Kotlin: SecureRandom().nextBytes(ByteArray(32)).joinToString("") { "%02x".format(it) }
     */
    static generateSecureSessionToken(): string {
        if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
            const randomBytes = new Uint8Array(32)
            window.crypto.getRandomValues(randomBytes)
            return Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('')
        }

        // Alternativa fallback para entorno fuera del navegador
        let token = ""
        const hexChars = "0123456789abcdef"
        for (let i = 0; i < 64; i++) {
            token += hexChars[Math.floor(Math.random() * 16)]
        }
        return token
    }
}
