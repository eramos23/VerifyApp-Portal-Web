export interface ClientDistributor {
    id: string;
    nombre: string;
    telefono_contacto: string;
    tipo_negocio: string;
    nombre_negocio: string;
    suscripcion_estado: 'activa' | 'vencida' | 'cancelada' | 'Inactivo';
    suscripcion_fecha_inicio: string;
    suscripcion_fecha_fin: string;
    plan_nombre: string;
}
