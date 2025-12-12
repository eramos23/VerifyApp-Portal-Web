import { supabase } from "@/lib/supabase/client"

export const ProfileRepository = {
    async getAdminName(adminId: string) {
        const { data: adminProfile, error: profileError } = await supabase
            .schema('notificacion')
            .from('perfil')
            .select('nombre, filtro_busqueda_web')
            .eq('id', adminId)
            .single()

        if (profileError || !adminProfile) {
            console.error("Error fetching admin profile:", profileError)
            return null
        }

        return {
            nombre: adminProfile.nombre,
            filtro_busqueda_web: adminProfile.filtro_busqueda_web
        }
    },

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .schema('notificacion')
            .from('perfil')
            .select('nombre, telefono_contacto')
            .eq('id', userId)
            .single()

        if (error) {
            console.error("Error getting profile:", error)
            return null
        }

        return data
    },

    async updateProfile(userId: string, data: { nombre: string, telefono_contacto: string }) {
        const { error } = await supabase
            .schema('notificacion')
            .from('perfil')
            .update(data)
            .eq('id', userId)

        if (error) {
            throw error
        }
    },

    async checkSubscription(userId: string) {
        const { data, error } = await supabase
            .schema('public')
            .rpc('fn_validar_suscripcion_usuario', { p_user_id: userId })

        if (error) {
            console.error("Error checking subscription:", error)
            // Return failure by default on error to be safe, or handle differently
            return { success: false, message: 'Error de conexión' }
        }

        return data as { success: boolean, message: string }
    }
}
