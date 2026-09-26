"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { checkSession } from "@/app/actions/session"
import { AyudanteStorageService } from "@/lib/services/ayudante-storage.service"
import { setAyudanteSessionCookie } from "@/app/actions/auth"

export default function AdminLoginPage() {
    const router = useRouter()

    useEffect(() => {
        const verifyAndRedirect = async () => {
            const helperToken = AyudanteStorageService.getSessionToken()
            if (helperToken) {
                await setAyudanteSessionCookie()
                router.replace('/monitor')
                return
            }

            const session = await checkSession()
            if (session.isAuthenticated) {
                router.replace('/monitor')
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
