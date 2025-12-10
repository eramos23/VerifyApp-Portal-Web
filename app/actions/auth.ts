"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from 'next/headers'

export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const requiredRole = formData.get("role") as string

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }


    // Check role in 'perfil' table
    const { data: profile, error: profileError } = await supabase
        .schema('notificacion')
        .from('perfil')
        .select('rol')
        .eq('id', data.user.id)
        .single()

    if (profileError || !profile) {
        await supabase.auth.signOut()
        return { error: "No se pudo verificar el perfil" }
    }

    // Strict role check
    if (profile.rol !== requiredRole) {
        await supabase.auth.signOut()
        return { error: `No tienes permisos de ${requiredRole}` }
    }

    return { success: true, user: data.user, role: profile.rol }
}

export async function loginAyudante(formData: FormData) {
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string

    const supabase = await createClient()

    // Custom Auth for Ayudante
    const { data, error } = await supabase.rpc("fn_login_ayudante", {
        _telefono: phone,
        _password: password
    });

    console.log("[AYUDANTE] Datos de Ayudante", data)
    if (error || !data) {
        return { error: "Credenciales inválidas" }
    }

    await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: ""
    })

    // Set custom session cookie for Ayudante
    const cookieStore = await cookies()
    cookieStore.set('ayudante_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
    })


    return { success: true, role: 'ayudante', user: data }
}

export async function registerDistribuidor(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nombre: fullName,
                codigo_iso2: 'PE',
                rol: 'distribuidor'
            }
        }
    })

    if (error) {
        console.log(error)
        if (error.code === 'user_already_exists') {
            return { error: "El correo electrónico ya está registrado" }
        }
        return { error: error.message }
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: "El usuario ya existe" }
    }

    // Auto-generate Distributor Config
    if (data.user) {
        try {
            let uniqueCode = ""
            let isAvailable = false
            let attempts = 0
            debugger
            while (!isAvailable && attempts < 5) {
                uniqueCode = generateReferralCode()
                const { data: available, error: rpcError } = await supabase
                    .schema('notificacion')
                    .rpc('fn_codigo_distribuidor_disponible', { _codigo: uniqueCode })

                if (!rpcError && available) {
                    isAvailable = true
                }
                attempts++
            }

            if (isAvailable) {
                const { error: configError } = await supabase
                    .schema('notificacion')
                    .from('distribuidor_config')
                    .insert({
                        id_perfil: data.user.id,
                        codigo_referido: uniqueCode
                    })

                if (configError) {
                    console.error("Error creating distributor config:", configError)
                    // We don't fail registration if config fails, but log it. 
                    // Manual fix might be needed or retry logic could be more robust.
                } else {
                    console.log(`[AUTH] Distributor config created for ${data.user.id} with code ${uniqueCode}`)
                }
            } else {
                console.error("Failed to generate unique code after 5 attempts")
            }

        } catch (err) {
            console.error("Unexpected error creating config:", err)
        }
    }

    return { success: true, user: data.user }
}

function generateReferralCode(length: number = 5): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('ayudante_session')
}
