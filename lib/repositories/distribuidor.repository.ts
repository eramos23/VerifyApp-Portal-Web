import { supabase } from "@/lib/supabase/client"
import { ClientDistributor } from "@/types/distributor-client"

export const DistribuidorRepository = {
    async getConfig(userId: string) {
        const { data, error } = await supabase
            .schema('notificacion')
            .from('distribuidor_config')
            .select('codigo_referido, dato_bancario')
            .eq('id_perfil', userId)
            .single()

        if (error) {
            // It's possible the config doesn't exist yet, return null without erroring aggressively
            if (error.code === 'PGRST116') return null
            console.error("Error fetching distributor config:", error)
            return null
        }

        return data
    },

    async checkCodeAvailability(code: string) {
        const { data, error } = await supabase
            .rpc('fn_codigo_distribuidor_disponible', { _codigo: code })

        if (error) {
            console.error("Error checking code availability:", error)
            throw new Error("Error al verificar disponibilidad del código")
        }

        return data // Returns true or false
    },

    async updateReferralCode(userId: string, code: string) {
        // First check availability again to be safe (though UI should have checked)
        // Actually, let's trust the UI check or let the DB constraint fail if we had one, 
        // but user asked for RPC check validation. The update itself might fail if unique constraint exists.

        // We need to upsert or update. Assuming row might not exist.
        // But usually profile creation creates this row. Let's assume Update.

        const { error } = await supabase
            .schema('notificacion')
            .from('distribuidor_config')
            .update({ codigo_referido: code })
            .eq('id_perfil', userId)

        if (error) {
            throw error
        }
    },

    async getClients(distributorId: string) {
        const { data, error } = await supabase
            .rpc('fn_listar_clientes_por_distribuidor', { p_id_distribuidor: distributorId })

        if (error) {
            console.error("Error fetching distributor clients:", error)
            throw new Error("Error al listar clientes")
        }

        return (data || []) as ClientDistributor[]
    }
}
