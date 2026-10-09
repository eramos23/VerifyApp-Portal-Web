/**
 * Servicio modular para la síntesis de voz (Text-to-Speech / Web Speech API).
 * Permite la lectura en voz alta de notificaciones de pago recibidas en tiempo real.
 */
export class SpeechService {
    /**
     * Verificamos que el navegador soporte la API de voz (SpeechSynthesis).
     */
    static isSupported(): boolean {
        return typeof window !== "undefined" && "speechSynthesis" in window
    }

    /**
     * Solicita y valida la habilitación de audio/voz del navegador.
     * Retorna { success: true } si el sonido del navegador está desbloqueado y funcional.
     */
    static async requestAudioPermission(): Promise<{ success: boolean; message?: string }> {
        if (!this.isSupported()) {
            return {
                success: false,
                message: "Su navegador no soporta la síntesis de voz."
            }
        }

        try {
            // Cancelar lecturas previas
            window.speechSynthesis.cancel()

            // Utterance de prueba durante el clic del usuario para autorizar audio
            const testUtterance = new SpeechSynthesisUtterance("Lector de voz habilitado")
            testUtterance.lang = 'es-PE'
            testUtterance.rate = 1.0
            testUtterance.pitch = 1.0

            const voces = window.speechSynthesis.getVoices()
            const vozEspanol = voces.find(v => v.lang.startsWith('es-PE') || v.lang.startsWith('es'))
            if (vozEspanol) {
                testUtterance.voice = vozEspanol
            }

            window.speechSynthesis.speak(testUtterance)

            return { success: true }
        } catch (error: any) {
            console.error("Error al solicitar permiso de audio/voz del navegador:", error)
            return {
                success: false,
                message: "Debe habilitar los permisos de sonido en su navegador para activar el Lector de voz."
            }
        }
    }

    /**
     * Anuncia el pago recibido mediante síntesis de voz.
     * Estructura: "Te llegó un pago de {monto} {monedaTexto} de {remitente}"
     * Ejemplo de uso: SpeechService.anunciarPago("Ely Ramos", "2.00", "soles")
     */
    static anunciarPago(remitente?: string | null, monto?: string | number | null, monedaTexto?: string | null): void {
        if (!this.isSupported()) {
            console.warn("Este navegador no soporta la síntesis de voz.")
            return
        }

        const montoTexto = typeof monto === "number" ? monto.toFixed(2) : (monto || "0.00")

        // Limpiar el texto de la moneda para una pronunciación natural (ej: "S/" -> "soles")
        let monedaLimpia = (monedaTexto || "soles").trim()
        if (monedaLimpia === "S/" || monedaLimpia === "S/." || monedaLimpia === "PEN") {
            monedaLimpia = "soles"
        }

        const nombreRemitente = (remitente || "").trim() || "Cliente"

        const textoAVoz = `Te llegó un pago de ${montoTexto} ${monedaLimpia} de ${nombreRemitente}`

        try {
            // Cancelar lecturas previas si existen para evitar solapamientos
            window.speechSynthesis.cancel()

            const utterance = new SpeechSynthesisUtterance(textoAVoz)
            utterance.lang = 'es-PE' // Configurado con acento/español de Perú o latinoamérica
            utterance.rate = 1.0   // Velocidad normal (1.0)
            utterance.pitch = 1.0  // Tono normal

            // Seleccionar una voz en español si está disponible en el dispositivo
            const voces = window.speechSynthesis.getVoices()
            const vozEspanol = voces.find(v => v.lang.startsWith('es-PE') || v.lang.startsWith('es'))
            if (vozEspanol) {
                utterance.voice = vozEspanol
            }

            // Ejecuta la lectura en voz alta
            window.speechSynthesis.speak(utterance)
        } catch (error) {
            console.error("Error al ejecutar la lectura de voz del pago:", error)
        }
    }
}
