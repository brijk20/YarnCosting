import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { useEffect } from "react"
import AppShell from "./components/layout/AppShell"
import CalculatorPage from "./pages/CalculatorPage"
import SalesPage from "./pages/SalesPage"
import PurchasesPage from "./pages/PurchasesPage"
import ProductionPage from "./pages/ProductionPage"
import LedgerPage from "./pages/LedgerPage"
import useAuth from "./hooks/useAuth"
import useOperationsStore from "./store/operationsStore"

const App = () => {
  const { user, supabaseReady, initialising } = useAuth()
  const hydrate = useOperationsStore((state) => state.hydrate)
  const reset = useOperationsStore((state) => state.reset)

  useEffect(() => {
    if (!supabaseReady) {
      reset()
      return
    }
    if (user?.id) {
      hydrate({ userId: user.id })
    } else {
      reset()
    }
  }, [hydrate, reset, supabaseReady, user?.id])

  if (initialising && supabaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Initialising Ambrox workspace…
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<CalculatorPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="*" element={<Navigate to="/planner" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
