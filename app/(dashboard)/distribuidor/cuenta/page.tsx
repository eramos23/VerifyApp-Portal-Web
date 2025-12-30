"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, User, Phone, CreditCard, Link as LinkIcon, Save, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { ProfileRepository } from "@/lib/repositories/profile.repository"
import { DistribuidorRepository } from "@/lib/repositories/distribuidor.repository"

export default function CuentaPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)

    // Form States
    const [profileData, setProfileData] = useState({
        nombre: "",
        telefono_contacto: ""
    })

    // Original profile data to check for changes
    const [originalProfileData, setOriginalProfileData] = useState({
        nombre: "",
        telefono_contacto: ""
    })

    const [referralCode, setReferralCode] = useState("")
    const [originalReferralCode, setOriginalReferralCode] = useState("")

    // Loading States for actions
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isSavingReferral, setIsSavingReferral] = useState(false)
    const [isCheckingCode, setIsCheckingCode] = useState(false)

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (user as any)?.id
            if (!userId) return

            setIsLoading(true)
            try {
                // Fetch Profile
                const profile = await ProfileRepository.getProfile(userId)
                if (profile) {
                    setProfileData({
                        nombre: profile.nombre || "",
                        telefono_contacto: profile.telefono_contacto || ""
                    })
                    setOriginalProfileData({
                        nombre: profile.nombre || "",
                        telefono_contacto: profile.telefono_contacto || ""
                    })
                }

                // Fetch Config
                const config = await DistribuidorRepository.getConfig(userId)
                if (config) {
                    setReferralCode(config.codigo_referido || "")
                    setOriginalReferralCode(config.codigo_referido || "")
                }
            } catch (error) {
                console.error("Error loading account data:", error)
                toast.error("Error al cargar los datos de la cuenta")
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, [(user as any)?.id])

    // Validation Logic
    const validateProfile = () => {
        if (!profileData.nombre.trim()) {
            toast.error("El nombre es obligatorio")
            return false
        }
        if (profileData.nombre.length > 50) {
            toast.error("El nombre no puede exceder 50 caracteres")
            return false
        }

        if (!profileData.telefono_contacto.trim()) {
            toast.error("El teléfono es obligatorio")
            return false
        }
        if (profileData.telefono_contacto.length > 12) {
            toast.error("El teléfono no puede exceder 12 caracteres")
            return false
        }
        if (!/^\d+$/.test(profileData.telefono_contacto)) {
            toast.error("El teléfono debe contener solo números")
            return false
        }

        return true
    }

    const validateReferralCode = () => {
        const code = referralCode.trim()
        if (!code) {
            toast.error("El código de referido es obligatorio")
            return false
        }
        if (code.length < 4 || code.length > 16) {
            toast.error("El código debe tener entre 4 y 16 caracteres")
            return false
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
            toast.error("El código solo puede contener letras, números, - y _")
            return false
        }
        return true
    }

    // Handlers
    const handleSaveProfile = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (user as any)?.id
        if (!userId) return
        if (!validateProfile()) return

        // Check if changed
        if (profileData.nombre === originalProfileData.nombre &&
            profileData.telefono_contacto === originalProfileData.telefono_contacto) {
            toast.info("No hay cambios para guardar")
            return
        }

        setIsSavingProfile(true)
        try {
            await ProfileRepository.updateProfile(userId, profileData)
            setOriginalProfileData({ ...profileData })
            toast.success("Perfil actualizado correctamente")
        } catch (error) {
            console.error("Error saving profile:", error)
            toast.error("Error al actualizar el perfil")
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleSaveReferral = async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (user as any)?.id
        if (!userId) return
        if (!validateReferralCode()) return

        // Check if changed
        if (referralCode === originalReferralCode) {
            toast.info("El código no ha cambiado")
            return
        }

        setIsSavingReferral(true)
        try {
            // First check availability
            setIsCheckingCode(true)
            const isAvailable = await DistribuidorRepository.checkCodeAvailability(referralCode)
            setIsCheckingCode(false)

            if (!isAvailable) {
                toast.error("Este código ya está en uso, por favor elige otro")
                return
            }

            await DistribuidorRepository.updateReferralCode(userId, referralCode)
            setOriginalReferralCode(referralCode)
            toast.success("Código de referido actualizado")
        } catch (error: any) {
            console.error("Error saving referral:", error)
            // Handle RPC error gracefully if thrown
            if (error.message?.includes("Error al verificar")) {
                toast.error(error.message)
            } else {
                toast.error("Error al actualizar el código")
            }
        } finally {
            setIsSavingReferral(false)
            setIsCheckingCode(false) // Ensure reset
        }
    }

    const referralUrl = `https://yape-app.com/ref/${referralCode || "..."}`

    const copyToClipboard = () => {
        if (!referralCode) return
        navigator.clipboard.writeText(referralUrl)
        toast.success("Link copiado al portapapeles")
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0095e0]" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-[#0f172a]">Mi Cuenta</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information Card */}
                <Card className="shadow-md border-0 ring-1 ring-slate-100">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                            <User className="h-5 w-5 text-[#0095e0]" />
                            Información Personal
                        </CardTitle>
                        <CardDescription>
                            Tus datos de contacto y perfil público
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo <span className="text-red-500">*</span></Label>
                            <Input
                                id="fullName"
                                value={profileData.nombre}
                                onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                                maxLength={50}
                                className="bg-slate-50 border-slate-200 focus:ring-[#0095e0]"
                            />
                            <p className="text-xs text-muted-foreground text-right">{profileData.nombre.length}/50</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Número de Contacto <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={profileData.telefono_contacto}
                                    onChange={(e) => {
                                        // Only allow numeric input
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setProfileData({ ...profileData, telefono_contacto: val })
                                        }
                                    }}
                                    placeholder="999888777"
                                    maxLength={12}
                                    className="pl-9 bg-slate-50 border-slate-200 focus:ring-[#0095e0]"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{profileData.telefono_contacto.length}/12</p>
                        </div>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="w-full mt-2 bg-[#0095e0] hover:bg-[#007bb8] text-white"
                        >
                            {isSavingProfile ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Bank Data (Hidden as requested) */}
                {/* 
                <Card>
                    <CardHeader>
                       ...
                    </CardHeader>
                    ...
                </Card>
                */}

                {/* Referral Link Card */}
                <Card className="shadow-md border-0 ring-1 ring-slate-100">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                            <LinkIcon className="h-5 w-5 text-[#0095e0]" />
                            Link de Referido
                        </CardTitle>
                        <CardDescription>
                            Personaliza tu código para compartir la app
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="referralCode">Código de Referido</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground select-none">ref/</span>
                                    <Input
                                        id="referralCode"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        placeholder="micodigo123"
                                        maxLength={16}
                                        className="pl-10 font-mono bg-slate-50 border-slate-200 focus:ring-[#0095e0]"
                                    />
                                </div>
                                <Button
                                    onClick={handleSaveReferral}
                                    disabled={isSavingReferral || isCheckingCode || referralCode === originalReferralCode}
                                    variant="secondary"
                                    className="shrink-0"
                                >
                                    {isSavingReferral || isCheckingCode ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>4-16 caracteres (A-Z, 0-9, -, _)</span>
                                {referralCode === originalReferralCode && referralCode && (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Actual
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-slate-100 p-4 border border-slate-200">
                            <p className="text-sm font-medium text-slate-500 mb-2">Tu enlace para compartir:</p>
                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                                <code className="flex-1 text-sm text-[#0095e0] truncate">
                                    {referralUrl}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={copyToClipboard}
                                >
                                    <Copy className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
