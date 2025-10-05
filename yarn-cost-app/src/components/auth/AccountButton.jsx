import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import AuthPanel from "./AuthPanel"
import Modal from "../ui/Modal"

const AccountButton = () => {
  const { user, loading, initialising, supabaseReady, signOut, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)

  const initials = useMemo(() => {
    if (!user?.email) return "👤"
    return user.email.charAt(0).toUpperCase()
  }, [user?.email])

  if (!supabaseReady) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-400 shadow-sm"
        disabled
      >
        Account
      </button>
    )
  }

  if (user) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-indigo-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white">
            {initials}
          </span>
          <span className="hidden flex-col text-left text-xs leading-tight text-slate-600 sm:flex">
            <span className="font-semibold text-slate-700">{user.email}</span>
            {isSuperAdmin ? <span className="text-[10px] font-semibold text-emerald-600">Super admin</span> : null}
          </span>
        </button>
        {open ? (
          <Modal title="Account" onClose={handleClose} widthClass="max-w-md">
            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
                {isSuperAdmin ? (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Super admin access
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut()
                  handleClose()
                }}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                disabled={loading}
              >
                {loading ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </Modal>
        ) : null}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        disabled={initialising}
      >
        {initialising ? "Loading…" : "Sign in"}
      </button>
      {open ? (
        <Modal title="Sign in" onClose={handleClose} widthClass="max-w-md">
          <AuthPanel onAuthenticated={handleClose} />
        </Modal>
      ) : null}
    </>
  )
}

export default AccountButton
