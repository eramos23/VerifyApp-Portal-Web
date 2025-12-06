"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { LoginForm } from "@/components/auth/LoginForm"

import { checkSession } from "@/app/actions/session"

export default function AdminLoginPage() {
    const { user, role, logout } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        const verifyAndRedirect = async () => {
            const session = await checkSession()
            if (session.isAuthenticated && session.role) {
                if (session.role === 'admin') {
                    router.push('/monitor')
                } else if (session.role === 'distribuidor') {
                    router.push('/distribuidor')
                }
                // Ayudante logic disabled
            }
        }
        verifyAndRedirect()
    }, [router])

    return (
        <LoginForm
            role="admin"
            title="Administrador"
            description="Ingresa tus credenciales de administrador"
            allowedRoles={["admin"]}
        />
    )
}
