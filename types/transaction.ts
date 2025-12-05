export interface Transaction {
    id: string | null;
    id_usuario: string;
    id_billetera_catalogo: string | null;
    origen: string;
    mensaje_original: string;
    monto: number;
    moneda_texto: string;
    nombre_remitente: string | null;
    codigo_seguridad: string | null;
    fecha_notificacion: string;
    datos_adicionales: Record<string, any> | null;
}
