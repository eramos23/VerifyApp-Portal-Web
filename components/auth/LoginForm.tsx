"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { loginUser, loginAyudante } from "@/app/actions/auth"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import { useLoadingStore } from "@/lib/store/useLoadingStore"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useRouter } from "next/navigation"
import Link from "next/link"

const formSchema = z.object({
    identifier: z.string().min(1, {
        message: "Este campo es requerido.",
    }).refine((val) => !/[;'"`]/.test(val) && !/\/\*/.test(val) && !/--/.test(val), {
        message: "Caracteres no permitidos detectados.",
    }),
    password: z.string().min(1, {
        message: "La contraseña es requerida.",
    }).max(20, {
        message: "La contraseña no puede tener más de 20 caracteres.",
    }).refine((val) => !/[;'"`]/.test(val) && !/\/\*/.test(val) && !/--/.test(val), {
        message: "Caracteres no permitidos detectados.",
    }),
})

interface LoginFormProps {
    role?: "admin" | "ayudante" | "distribuidor"
    title?: string
    description?: string
    allowedRoles?: ("admin" | "ayudante" | "distribuidor")[]
}

export function LoginForm({ role: initialRole = "admin", title, description, allowedRoles }: LoginFormProps) {
    // Default to showing all roles if not specified
    const rolesToShow = allowedRoles || ["admin", "ayudante", "distribuidor"]

    // Initialize state with the passed role or the first allowed role
    const [role, setRole] = useState(initialRole)
    const [showPassword, setShowPassword] = useState(false)
    const { setIsLoading, isLoading } = useLoadingStore()
    const { setRole: setAuthRole, setUser: setAuthUser } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        setIsLoading(false)
    }, [setIsLoading])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        console.log("values login ", values)
        const formData = new FormData()

        // Validation logic based on role
        if (role === 'admin' || role === 'distribuidor') {
            // Email validation
            if (values.identifier.length > 50) {
                form.setError("identifier", { type: "manual", message: "El correo no puede tener más de 50 caracteres" })
                setIsLoading(false)
                return
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.identifier)) {
                form.setError("identifier", { type: "manual", message: "Formato de correo inválido" })
                setIsLoading(false)
                return
            }
            formData.append("email", values.identifier)
        } else {
            // Phone validation for Ayudante
            if (values.identifier.length > 12) {
                form.setError("identifier", { type: "manual", message: "El teléfono no puede tener más de 12 caracteres" })
                setIsLoading(false)
                return
            }
            if (!/^\d+$/.test(values.identifier)) {
                form.setError("identifier", { type: "manual", message: "El teléfono solo debe contener números" })
                setIsLoading(false)
                return
            }
            formData.append("phone", values.identifier)
        }

        formData.append("password", values.password)
        formData.append("role", role) // Pass the selected role to the server action

        try {
            if (role === 'ayudante') {
                const result = await loginAyudante(formData)
                if (result?.error) {
                    toast.error(result.error)
                    setIsLoading(false)
                } else {
                    toast.success("Bienvenido Ayudante")
                    setAuthRole('ayudante')
                    setAuthUser(result.user || null)
                    router.push("/monitor")
                }
            } else {
                const result = await loginUser(formData)
                if (result?.error) {
                    toast.error(result.error)
                    setIsLoading(false)
                } else {
                    toast.success(`Bienvenido ${role}`)
                    setAuthRole(role)
                    setAuthUser(result.user || null)
                    if (role === 'admin') {
                        router.push("/monitor")
                    } else if (role === 'distribuidor') {
                        router.push("/distribuidor")
                    }
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Ocurrió un error inesperado")
            setIsLoading(false)
        }
    }

    const handleRoleChange = (newRole: string) => {
        setRole(newRole as "admin" | "ayudante" | "distribuidor")
        form.reset()
    }

    const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (role === 'ayudante') {
            // Only allow numbers for Ayudante
            if (/^\d*$/.test(value)) {
                form.setValue('identifier', value)
            }
        } else {
            form.setValue('identifier', value)
        }
    }

    return (
        <Card className="w-[400px] border-none shadow-xl bg-white">
            <CardHeader className="space-y-1 flex flex-col items-center">
                <div className="relative w-40 h-40 mb-1">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <CardTitle className="text-2xl font-bold text-center text-[#0095e0]">{title || "Iniciar Sesión"}</CardTitle>
                <CardDescription className="text-center">
                    {description || "Selecciona tu rol para ingresar al sistema"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Only show tabs if there is more than one role allowed */}
                {rolesToShow.length > 1 && (
                    <Tabs key={rolesToShow.join('-')} defaultValue={role} onValueChange={handleRoleChange} className="w-full mb-4">
                        <TabsList className={`grid w-full grid-cols-${rolesToShow.length}`}>
                            {rolesToShow.includes("admin") && <TabsTrigger value="admin">Admin</TabsTrigger>}
                            {rolesToShow.includes("ayudante") && <TabsTrigger value="ayudante">Ayudante</TabsTrigger>}
                            {rolesToShow.includes("distribuidor") && <TabsTrigger value="distribuidor">Distribuidor</TabsTrigger>}
                        </TabsList>
                    </Tabs>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="identifier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{role === 'ayudante' ? 'Teléfono' : 'Correo Electrónico'}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={role === 'ayudante' ? '999999999' : 'usuario@ejemplo.com'}
                                            {...field}
                                            onChange={handleIdentifierChange}
                                            maxLength={role === 'ayudante' ? 12 : 50}
                                            className="focus-visible:ring-[#0095e0]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="******"
                                                {...field}
                                                maxLength={20}
                                                className="focus-visible:ring-[#0095e0] pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0095e0] transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-[#0095e0] hover:bg-[#007bb8] transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                "Ingresar"
                            )}
                        </Button>
                    </form>
                </Form>
                {/* Register Link for Distributor */}
                {(role === 'distribuidor' || (rolesToShow.includes('distribuidor') && rolesToShow.length === 1)) && (
                    <div className="mt-4 text-center text-sm">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/register/distribuidor" className="text-[#0095e0] hover:underline">
                            Créalo aquí
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
