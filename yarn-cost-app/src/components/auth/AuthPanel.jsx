import { useState } from "react"
import useAuth from "../../hooks/useAuth"

const AuthPanel = ({ onAuthenticated }) => {
  const { user, loading, error, initialising, signIn, signUp, supabaseReady } = useAuth()
  const [mode, setMode] = useState("signin")
  const [formState, setFormState] = useState({ email: "", password: "" })
  const [status, setStatus] = useState("")

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus("")
    if (!formState.email || !formState.password) {
      setStatus("Email and password are required")
      return
    }
    const action = mode === "signin" ? signIn : signUp
    const { error: authError } = await action({
      email: formState.email,
      password: formState.password,
    })
    if (!authError) {
      setStatus(mode === "signin" ? "Signed in" : "Check inbox to confirm account")
      setFormState({ email: "", password: "" })
      if (mode === "signin") {
        onAuthenticated?.()
      }
    }
  }

  if (!supabaseReady) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
        <p className="font-semibold text-amber-800">Supabase not configured</p>
        <p>Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in .env to enable sign-in and saved records.</p>
      </div>
    )
  }

  if (initialising) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
        <p className="font-semibold">You are already signed in as {user.email}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {mode === "signin" ? "Sign in" : "Create account"}
        </p>
        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"))
            setStatus("")
          }}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          {mode === "signin" ? "Need an account?" : "Have an account?"}
        </button>
      </div>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Email
        <input
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={handleChange("email")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ring-slate-400 transition focus:ring"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Password
        <input
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={formState.password}
          onChange={handleChange("password")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ring-slate-400 transition focus:ring"
          placeholder="••••••••"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
      </button>
      {(status || error) && (
        <p className={"text-xs " + (error ? "text-rose-600" : "text-emerald-600")}>{error?.message ?? status}</p>
      )}
    </form>
  )
}

export default AuthPanel
