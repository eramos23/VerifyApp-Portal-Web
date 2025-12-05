"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { LoginForm } from "@/components/auth/LoginForm"

import { checkSession } from "@/app/actions/session"

export default function DistribuidorLoginPage() {
    const { user, role, logout } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        const verifyAndRedirect = async () => {
            if (user && role) {
                const session = await checkSession()
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
            role="distribuidor"
            title="Distribuidor"
            description="Acceso para distribuidores autorizados"
            allowedRoles={["distribuidor"]}
        />
    )
}
