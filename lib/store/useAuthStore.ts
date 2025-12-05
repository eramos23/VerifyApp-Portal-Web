import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    role: 'admin' | 'ayudante' | 'distribuidor' | null
    isLoading: boolean
    setUser: (user: User | null) => void
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
