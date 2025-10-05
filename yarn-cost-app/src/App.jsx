import CalculatorWorkspace from "./components/calculator/CalculatorWorkspace"
import SavedItemsPanel from "./components/saved/SavedItemsPanel"
import AccountButton from "./components/auth/AccountButton"
import { OperationsWorkspace } from "./components/operations"

const App = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-slate-100 to-slate-300 px-4 py-6 text-slate-900">
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-2xl shadow-indigo-200/40 backdrop-blur">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/80 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-600">Ambrox Labs</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-600">Weaving Companion</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 md:text-3xl">Yarn Cost Planner</h1>
              <p className="text-sm text-slate-500">
                Calculate warp & weft usage, GST inclusive costing, and plan profitable fabric runs.
              </p>
            </div>
          </div>
          <AccountButton />
        </header>

        <main className="space-y-10 p-6 md:p-10">
          <CalculatorWorkspace />
          <SavedItemsPanel />
          <OperationsWorkspace />
        </main>
      </div>
    </div>
  </div>
)

export default App
