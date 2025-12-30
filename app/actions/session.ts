"use server"

import { cookies } from 'next/headers'
import { createClient } from "@/lib/supabase/server"

export async function checkSession(): Promise<{ isAuthenticated: boolean, role: string | null | undefined }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // If we have a user, check their profile to get the role
        const { data: profile } = await supabase
            .schema('notificacion')
            .from('perfil')
            .select('rol')
            .eq('id', user.id)
            .single()

        return { isAuthenticated: true, role: profile?.rol }
    }

    const cookieStore = await cookies()
    // if (cookieStore.get('ayudante_session')) {
    //     return { isAuthenticated: true, role: 'ayudante' }
    // }

    return { isAuthenticated: false, role: null }
}
