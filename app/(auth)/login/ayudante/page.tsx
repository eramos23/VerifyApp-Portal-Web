"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { LoginForm } from "@/components/auth/LoginForm"

import { checkSession } from "@/app/actions/session"

export default function AyudanteLoginPage() {
    const { user, role, logout } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        const verifyAndRedirect = async () => {
            if (user && role) {
                const session = await checkSession()
                // For Ayudante, user might be null in store if we only stored role, but let's assume consistent store usage
                // Actually checkSession returns role 'ayudante' if cookie exists
                if (session.isAuthenticated && session.role === role) {
                    if (role === 'admin' || role === 'ayudante') {
                        router.push('/monitor')
                    } else if (role === 'distribuidor') {
                        router.push('/dashboard/distribuidor')
                    }
                } else {
                    logout()
                }
            }
        }
        verifyAndRedirect()
    }, [user, role, router, logout])

    return (
        <LoginForm
            role="ayudante"
            title="Ayudante"
            description="Ingresa con tu número de teléfono"
            allowedRoles={["ayudante"]}
        />
    )
}
