import { Transaction } from "@/types/transaction";
import { DateTime } from "luxon";

export interface NotificationItem {
    id: string;
    nombre: string;
    monto: string; // formateado
    fecha: string; // formateada
    moneda: string;
    codigoPago: string;
    origen?: string;
}

export function formatCurrency(amount: number): string {
    return amount.toFixed(2);
}

export function transactionToNotificationItem(t: Transaction): NotificationItem {
    const monto = formatCurrency(t.monto);

    let fecha = "Fecha inválida";

    try {
        // Use setZone: true to preserve the offset/zone provided in the string (or local if missing).
        // This matches OffsetDateTime.parse behavior in Kotlin, ensuring we display the time "as is".
        const dt = DateTime.fromISO(t.fecha_notificacion, { setZone: true })
            .setLocale("es");

        fecha = dt.toFormat("dd MMM yyyy - hh:mm a").toLowerCase();
    } catch { }

    return {
        id: t.id ?? crypto.randomUUID(),
        nombre: t.nombre_remitente ?? "Desconocido",
        monto,
        fecha,
        moneda: t.moneda_texto,
        codigoPago: t.codigo_seguridad ?? "",
        origen: t.origen,
    };
}

export function realtimeTransactionToNotificationItem(
    t: Transaction,
    zonaHoraria: string = "America/Lima"
): NotificationItem {
    const monto = formatCurrency(t.monto);

    let fecha = "Fecha inválida";

    try {
        // Use the provided timezone (default America/Lima)
        const dt = DateTime.fromISO(t.fecha_notificacion, { zone: zonaHoraria })
            .setLocale("es");

        fecha = dt.toFormat("dd MMM yyyy - hh:mm a").toLowerCase();
    } catch { }

    return {
        id: t.id ?? crypto.randomUUID(),
        nombre: t.nombre_remitente ?? "Desconocido",
        monto,
        fecha,
        moneda: t.moneda_texto,
        codigoPago: t.codigo_seguridad ?? "",
        origen: t.origen,
    };
}
