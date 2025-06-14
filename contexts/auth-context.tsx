'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext useEffect: Initializing Supabase auth listeners');
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Error getting initial session:', error);
      } else {
        console.log('AuthContext: Initial session data fetched:', session);
      }
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      console.log('AuthContext: Initial state set. User:', session?.user?.email, 'Session:', session ? 'present' : 'absent', 'isLoading:', false);
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state changed. Event:', _event, 'Session:', session);
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false) // Set isLoading to false after any auth state change
      console.log('AuthContext: State updated from auth change. User:', session?.user?.email, 'Session:', session ? 'present' : 'absent', 'isLoading:', false);
    })

    return () => {
      console.log('AuthContext: Unsubscribing from auth changes');
      subscription.unsubscribe();
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 