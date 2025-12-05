"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAdminName(adminId: string) {
    const supabase = await createClient()

    // Get admin name from perfil table
    const { data: adminProfile, error: profileError } = await supabase
        .schema('notificacion')
        .from('perfil')
        .select('nombre')
        .eq('id', adminId)
        .single()

    if (profileError || !adminProfile) {
        console.error("Error fetching admin profile:", profileError)
        return null
    }

    return adminProfile.nombre
}
