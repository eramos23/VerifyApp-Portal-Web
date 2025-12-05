import { supabase } from "@/lib/supabase/client"
import { Transaction } from "@/types/transaction"

export const TransactionRepository = {
    async getTransactionsByDate(userId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .rpc('get_transactions_by_date', {
                p_user_id: userId,
                p_start_date: startDate,
                p_end_date: endDate
            })

        if (error) {
            throw error
        }

        return (data || []) as Transaction[]
    }
}
