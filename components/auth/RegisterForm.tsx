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
import { useState, useEffect } from "react"
import { registerDistribuidor } from "@/app/actions/auth"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"

const formSchema = z.object({
    fullName: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }).max(50, {
        message: "El nombre no puede tener más de 50 caracteres.",
    }),
    email: z.string().email({
        message: "Correo electrónico inválido.",
    }).max(50, {
        message: "El correo no puede tener más de 50 caracteres.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }).max(20, {
        message: "La contraseña no puede tener más de 20 caracteres.",
    }),
})

import { useLoadingStore } from "@/lib/store/useLoadingStore"

export function RegisterForm() {
    const [showPassword, setShowPassword] = useState(false)
    const { isLoading, setIsLoading } = useLoadingStore()
    const router = useRouter()

    // Reset loading state on mount
    useEffect(() => {
        setIsLoading(false)
    }, [setIsLoading])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("fullName", values.fullName)
        formData.append("email", values.email)
        formData.append("password", values.password)

        try {
            const result = await registerDistribuidor(formData)
            if (result?.error) {
                toast.error(result.error)
                setIsLoading(false)
            } else {
                toast.success("Registro exitoso. Por favor inicia sesión.")
                router.push("/login/distribuidor")
            }
        } catch (error) {
            console.error(error)
            toast.error("Ocurrió un error inesperado")
            setIsLoading(false)
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
                <CardTitle className="text-2xl font-bold text-center text-[#0095e0]">Registro Distribuidor</CardTitle>
                <CardDescription className="text-center">
                    Crea tu cuenta para empezar
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Juan Pérez"
                                            {...field}
                                            maxLength={50}
                                            className="focus-visible:ring-[#0095e0]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="usuario@ejemplo.com"
                                            {...field}
                                            maxLength={50}
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
                                    Registrando...
                                </>
                            ) : (
                                "Registrarse"
                            )}
                        </Button>
                        <div className="text-center text-sm">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login/distribuidor" className="text-[#0095e0] hover:underline">
                                Iniciar Sesión
                            </Link>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
