import CalculatorWorkspace from "./components/calculator/CalculatorWorkspace"
import SavedItemsPanel from "./components/saved/SavedItemsPanel"
import AuthPanel from "./components/auth/AuthPanel"

const App = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900">
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Ambrox Labs</p>
          <h1 className="text-2xl font-semibold text-slate-800">Yarn Cost Calculator</h1>
          <p className="text-sm text-slate-500">Plan yarn requirements, estimate cost per meter, and track profitability.</p>
        </div>
        <AuthPanel />
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <CalculatorWorkspace />
      <SavedItemsPanel />
    </main>
  </div>
)

export default App
