import { supabase } from "@/lib/supabase/client"

export const ProfileRepository = {
    async getAdminName(adminId: string) {
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
}
