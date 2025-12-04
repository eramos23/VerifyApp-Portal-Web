"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Transaction {
    id: string
    monto: number
    fecha: string
    estado: string
    cliente_id: string
    // Add other fields as needed
}

export function useRealtimeTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [soundEnabled, setSoundEnabled] = useState(false)

    useEffect(() => {
        // Initial fetch
        const fetchTransactions = async () => {
            const { data, error } = await supabase
                .from('transacciones') // Ensure this table exists in 'notificacion' schema or public? User said schema 'notificacion'
                .select('*')
                .order('fecha', { ascending: false })
                .limit(50)

            if (error) {
                console.error("Error fetching transactions:", error)
            } else {
                setTransactions(data || [])
            }
        }

        fetchTransactions()

        // Realtime subscription
        const channel = supabase
            .channel('realtime-transactions')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'notificacion',
                    table: 'transacciones',
                },
                (payload) => {
                    const newTransaction = payload.new as Transaction
                    setTransactions((prev) => [newTransaction, ...prev])

                    if (soundEnabled) {
                        const audio = new Audio('/notification.mp3') // Need to add this file
                        audio.play().catch(e => console.error("Audio play failed", e))
                    }

                    toast.success(`Nueva transacción: ${newTransaction.monto}`)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [soundEnabled])

    return { transactions, soundEnabled, setSoundEnabled }
}
