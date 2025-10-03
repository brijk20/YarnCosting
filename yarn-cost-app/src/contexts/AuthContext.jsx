import { createContext, useContext, useEffect, useState } from "react"
import supabase, { isSupabaseConfigured } from "../lib/supabaseClient"

const AuthContext = createContext(undefined)

const missingConfigError = new Error("Supabase credentials are not configured")

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [initialising, setInitialising] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitialising(false)
      return undefined
    }

    let active = true

    const loadSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (!active) return
        if (sessionError) throw sessionError
        setSession(data?.session ?? null)
        setUser(data?.session?.user ?? null)
      } catch (err) {
        console.error("Failed to load Supabase session", err)
        setError(err)
      } finally {
        if (active) setInitialising(false)
      }
    }

    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
    })

    return () => {
      active = false
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  const guard = () => {
    if (!isSupabaseConfigured) {
      setError(missingConfigError)
      return false
    }
    return true
  }

  const signIn = async ({ email, password }) => {
    if (!guard()) return { error: missingConfigError }
    setLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      setSession(data.session)
      setUser(data.user)
      return { data }
    } catch (err) {
      setError(err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password }) => {
    if (!guard()) return { error: missingConfigError }
    setLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      return { data }
    } catch (err) {
      setError(err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!guard()) return { error: missingConfigError }
    setLoading(true)
    setError(null)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setSession(null)
      setUser(null)
      return {}
    } catch (err) {
      setError(err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    session,
    user,
    loading,
    error,
    initialising: initialising && isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    supabaseReady: isSupabaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
