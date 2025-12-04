"use client"

import { ClientTable } from "@/components/dashboard/ClientTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ClientsPage() {
    // Mock data
    const clients = [
        {
            id: "1",
            nombre: "Restaurante El Buen Sabor",
            telefono_contacto: "987654321",
            tipo_negocio: "Restaurante",
            activo: true,
            fecha_creacion: new Date().toISOString(),
            plan: "Pro"
        },
        {
            id: "2",
            nombre: "Bodega Juanita",
            telefono_contacto: "912345678",
            tipo_negocio: "Tienda",
            activo: false,
            fecha_creacion: new Date(Date.now() - 86400000 * 10).toISOString(),
            plan: "Básico"
        }
    ]

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Mis Clientes</h2>

            </div>
            <ClientTable clients={clients} />
        </div>
    )
}
