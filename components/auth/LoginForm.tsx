"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { useAuthStore } from "@/lib/store/useAuthStore"
import { loginUser, loginAyudante } from "@/app/actions/auth"

const formSchema = z.object({
    identifier: z.string().min(1, "Campo requerido"), // Email or Phone
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

interface LoginFormProps {
    role: "admin" | "ayudante" | "distribuidor"
    title: string
    description: string
}

export function LoginForm({ role, title, description }: LoginFormProps) {
    const router = useRouter()
    const { setUser, setRole } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("password", values.password)
            console.log("values login ", values)
            if (role === "ayudante") {
                formData.append("phone", values.identifier)
                const result = await loginAyudante(formData)

                if (result.error) throw new Error(result.error)

                setRole("ayudante")
                // setUser(result.user) // Map if needed
                router.push("/monitor")
                toast.success("Bienvenido Ayudante")

            } else {
                formData.append("email", values.identifier)
                formData.append("role", role)

                const result = await loginUser(formData)

                if (result.error) throw new Error(result.error)

                setUser(result.user as any)
                setRole(result.role as any)

                if (role === "admin") router.push("/monitor")
                if (role === "distribuidor") router.push("/distribuidor")

                toast.success(`Bienvenido ${role}`)
            }
        } catch (error: any) {
            toast.error(error.message || "Error al iniciar sesión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="identifier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{role === "ayudante" ? "Teléfono" : "Correo Electrónico"}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={role === "ayudante" ? "999999999" : "usuario@ejemplo.com"} {...field} />
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
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ingresar
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
