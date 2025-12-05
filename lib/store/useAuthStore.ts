import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

export interface AyudanteUser {
    success: boolean
    message: string
    token: string
    ayudante_id: string
    id_admin: string
    zona_horaria: string
}

interface AuthState {
    user: User | AyudanteUser | null
    role: 'admin' | 'ayudante' | 'distribuidor' | null
    isLoading: boolean
    setUser: (user: User | AyudanteUser | null) => void
    setRole: (role: 'admin' | 'ayudante' | 'distribuidor' | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            role: null,
            isLoading: true,
            setUser: (user) => set({ user }),
            setRole: (role) => set({ role }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => set({ user: null, role: null, isLoading: false }),
        }),
        {
            name: 'auth-storage',
        }
    )
)
