"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

import { Transaction } from "@/types/transaction"

export function useRealtimeTransactions(adminId: string | undefined, onData: (data: Transaction) => void) {
    const [isConnected, setIsConnected] = useState(false)

    const onDataRef = useRef(onData)

    useEffect(() => {
        onDataRef.current = onData
    }, [onData])

    useEffect(() => {
        if (!adminId) return

        console.log(`Subscribing to channel: transactions-${adminId}`)
        setIsConnected(false)

        const channel = supabase
            .channel(`transactions-${adminId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'notificacion', // Reverted to 'notificacion' per user confirmation
                    table: 'transacciones',
                    filter: `id_usuario=eq.${adminId}`
                },
                (payload) => {
                    console.log("🔥 REALTIME EVENT RECEIVED:", payload)
                    console.log("New transaction payload:", payload.new)
                    if (onDataRef.current) {
                        try {
                            onDataRef.current(payload.new as Transaction)
                        } catch (err) {
                            console.error("Error in onData callback:", err)
                        }
                    } else {
                        console.warn("onDataRef is null")
                    }
                }
            )
            .subscribe((status, err) => {
                console.log(`Subscription status for transactions-${adminId}:`, status)
                if (err) {
                    console.error("Subscription error:", err)
                }
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                    toast.success("Conexión en tiempo real establecida")
                } else {
                    setIsConnected(false)
                }
            })

        return () => {
            console.log(`Unsubscribing from channel: transactions-${adminId}`)
            supabase.removeChannel(channel)
            setIsConnected(false)
        }
    }, [adminId])

    return { isConnected }
}
