"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/useAuthStore"

import { Transaction } from "@/types/transaction"

import { createClient } from '@supabase/supabase-js'

// ... imports

export function useRealtimeTransactions(adminId: string | undefined, onData: (data: Transaction) => void) {
    const [isConnected, setIsConnected] = useState(false)
    const onDataRef = useRef(onData)

    useEffect(() => {
        onDataRef.current = onData
    }, [onData])

    const { user, role } = useAuthStore()

    useEffect(() => {
        if (!adminId) {
            console.log("❌ useRealtimeTransactions: adminId is missing")
            return
        }

        let client = supabase // Default to global client

        // If Ayudante, create a dedicated client with the token
        if (role === 'ayudante' && user && 'token' in user) {
            console.log("🔐 Creating dedicated Supabase client for Ayudante")
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

            client = createClient(supabaseUrl, supabaseAnonKey, {
                db: {
                    schema: 'notificacion',
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Accept-Profile': 'notificacion',
                        'Content-Profile': 'notificacion',
                        apikey: supabaseAnonKey,
                    }
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                        apikey: supabaseAnonKey,
                    },
                },
            })
            // Explicitly set auth for realtime socket
            client.realtime.setAuth(user.token)
        } else {
            // For Admin, ensure we are using the global client's auth state
            // The global client automatically handles auth state for Realtime if logged in properly via supabase.auth
            console.log("🔒 Admin using Global Client")
        }

        console.log(`🔌 Subscribing to channel: transactions-${adminId} with auth: ${role === 'ayudante' ? 'Custom Client' : 'Global Client'}`)
        setIsConnected(false)

        const channel = client
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
                console.log(`📡 Subscription status for transactions-${adminId}:`, status)
                if (err) {
                    console.error("❌ Subscription error:", err)
                }
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                    toast.success("Conexión en tiempo real establecida")
                } else {
                    setIsConnected(false)
                }
            })

        return () => {
            console.log(`🔌 Unsubscribing from channel: transactions-${adminId}`)
            client.removeChannel(channel)
            setIsConnected(false)
        }
    }, [adminId, role, user])

    return { isConnected }
}
