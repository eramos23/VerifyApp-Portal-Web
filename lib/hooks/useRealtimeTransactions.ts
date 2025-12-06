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
        if (!adminId) {
            console.log("❌ useRealtimeTransactions: adminId is missing")
            return
        }

        let isMounted = true
        let channel: any = null

        const setupRealtime = async () => {
            console.log("🔒 Fetching Admin Session for Realtime")
            const { data: { session } } = await supabase.auth.getSession()

            if (!isMounted) return

            if (session?.access_token) {
                console.log("✅ Admin Token Retrieved - Setting Auth")
                supabase.realtime.setAuth(session.access_token)
            } else {
                console.warn("⚠️ No Admin Session found")
            }

            console.log(`🔌 Subscribing to channel: transactions-${adminId}`)
            setIsConnected(false)

            channel = supabase
                .channel(`transactions-${adminId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'notificacion',
                        table: 'transacciones',
                        filter: `id_usuario=eq.${adminId}`
                    },
                    (payload) => {
                        console.log("🔥 REALTIME EVENT RECEIVED:", payload)
                        if (onDataRef.current) {
                            try {
                                onDataRef.current(payload.new as Transaction)
                            } catch (err) {
                                console.error("Error in onData callback:", err)
                            }
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (!isMounted) return
                    console.log(`📡 Subscription status for transactions-${adminId}:`, status)

                    if (status === 'SUBSCRIBED') {
                        setIsConnected(true)
                        toast.success("Conexión en tiempo real establecida")
                    } else {
                        setIsConnected(false)
                        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                            console.error("❌ Realtime Error:", err)
                        }
                    }
                })
        }

        setupRealtime()

        return () => {
            isMounted = false
            if (channel) {
                console.log(`🔌 Cleaning up subscription for transactions-${adminId}`)
                supabase.removeChannel(channel)
            }
            setIsConnected(false)
        }
    }, [adminId])

    return { isConnected }
}
