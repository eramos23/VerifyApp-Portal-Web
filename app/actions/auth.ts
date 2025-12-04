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

    if (error || !data) {
        return { error: "Credenciales inválidas" }
    }

    // Set custom session cookie for Ayudante
    const cookieStore = await cookies()
    cookieStore.set('ayudante_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
    })

    return { success: true, role: 'ayudante', user: data }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('ayudante_session')

    redirect("/login/admin") // Or a general login page
}
