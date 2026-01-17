'use client'
import { useState, useEffect } from 'react'
import {createClient} from "@/lib/supabase/client";
import { User } from '@supabase/supabase-js'
import {developers} from "@/lib/developers";

type UserRole = 'user' | 'admin' | 'super_admin' | null;

export interface UseUserRoleReturn {
    user: User | null
    role: UserRole
    loading: boolean
    isSuperAdmin: boolean
    isDeveloper: boolean
}

const supabase = createClient();

export function useUserRole(): UseUserRoleReturn {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser()
            if (error) {
                console.error('Error fetching user:', error)
                setLoading(false)
                return
            }

            const currentUser = data?.user ?? null
            setUser(currentUser)

            // Extract role from user_metadata or default to "user"
            const currentRole = (currentUser?.user_metadata?.role as UserRole) || 'user'
            setRole(currentRole)

            setLoading(false)
        }

        void getUser()

        // Listen for auth changes (login/logout)
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            const currentRole = (currentUser?.user_metadata?.role as UserRole) || 'user'
            setRole(currentRole)
            setLoading(false)
        })

        return () => {
            subscription.subscription.unsubscribe()
        }
    }, [])

    return { user, role, loading, isSuperAdmin: role === 'super_admin', isDeveloper: developers.includes(user?.email ?? "") }
}