"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Copy, User, Phone, CreditCard, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"

export default function CuentaPage() {
    const { user } = useAuthStore()

    // Mock data - in a real app this would come from the database based on the user ID
    const distributorData = {
        fullName: "Juan Pérez Distribuidor",
        phone: user?.phone || "999999999",
        bankAccount: "BCP: 191-12345678-0-99",
        referralUrl: `https://yape-app.com/ref/${user?.id?.substring(0, 8) || "ref123"}`
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(distributorData.referralUrl)
        toast.success("URL copiada al portapapeles")
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-[#0f172a]">Mi Cuenta</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="h-5 w-5 text-[#0095e0]" />
                            Información Personal
                        </CardTitle>
                        <CardDescription>Tus datos de contacto y perfil</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                            <p className="text-lg font-semibold">{distributorData.fullName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Número de Contacto
                            </p>
                            <p className="text-lg font-semibold">{distributorData.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-[#0095e0]" />
                            Datos Bancarios
                        </CardTitle>
                        <CardDescription>Cuenta para depósitos de comisiones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Cuenta Bancaria</p>
                            <p className="text-lg font-semibold font-mono bg-slate-100 p-2 rounded-md">
                                {distributorData.bankAccount}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-[#0095e0]" />
                            Link de Referido
                        </CardTitle>
                        <CardDescription>Comparte este enlace para que tus clientes descarguen la app</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-slate-100 p-3 rounded-md font-mono text-sm truncate border border-slate-200">
                                {distributorData.referralUrl}
                            </div>
                            <Button onClick={copyToClipboard} className="bg-[#0095e0] hover:bg-[#007bb8]">
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
