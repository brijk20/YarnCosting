import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { FiBookOpen, FiBarChart2, FiShoppingBag, FiActivity, FiList } from "react-icons/fi"
import AccountButton from "../auth/AccountButton"
import useAuth from "../../hooks/useAuth"
import useOperationsStore from "../../store/operationsStore"

const navItems = [
  {
    key: "planner",
    to: "/planner",
    label: "Cost planner",
    caption: "Preset yarn mixes",
    icon: FiBookOpen,
  },
  {
    key: "sales",
    to: "/sales",
    label: "Fabric sales",
    caption: "Invoices & receipts",
    icon: FiBarChart2,
  },
  {
    key: "purchases",
    to: "/purchases",
    label: "Yarn buying",
    caption: "Suppliers & rates",
    icon: FiShoppingBag,
  },
  {
    key: "production",
    to: "/production",
    label: "Production",
    caption: "Shifts & usage",
    icon: FiActivity,
  },
  {
    key: "ledger",
    to: "/ledger",
    label: "Ledger",
    caption: "Transactions",
    icon: FiList,
  },
]

const sectionMeta = {
  planner: {
    title: "Cost planner",
    subTitle: "Build repeatable costing presets for your qualities.",
  },
  sales: {
    title: "Fabric sales",
    subTitle: "Raise invoices and follow up on payments without leaving the loom floor.",
  },
  purchases: {
    title: "Yarn buying",
    subTitle: "Track supplier rates, quantities, and notes for every lot.",
  },
  production: {
    title: "Production log",
    subTitle: "Record shift output alongside the yarn used so costing stays accurate.",
  },
  ledger: {
    title: "Ledger",
    subTitle: "Searchable day book covering sales, purchases, and receipts.",
  },
}

const AppShell = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const payments = useOperationsStore((state) => state.payments)
  const lastSyncedAt = useOperationsStore((state) => state.lastSyncedAt)

  const activeItem = navItems.find((item) => location.pathname.startsWith(item.to)) ?? navItems[0]
  const section = sectionMeta[activeItem.key] ?? sectionMeta.planner

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:flex-row lg:px-10">
        <aside className="hidden w-60 flex-shrink-0 flex-col justify-between lg:flex">
          <div className="space-y-8">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-900">Yarn costing</h1>
              <p className="text-xs text-slate-500">Plan costs, update ledgers, and log production without juggling apps.</p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname.startsWith(item.to)
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-slate-100"}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold capitalize">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.caption}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">
              {user ? (
                <>
                  Signed in as <span className="font-semibold text-slate-700">{user.email}</span>
                </>
              ) : (
                "Using local storage. Sign in later to sync with Supabase."
              )}
            </p>
            <div className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span>Payments logged: {payments.length.toLocaleString("en-IN")}</span>
              <span>
                {lastSyncedAt
                  ? `Last sync ${new Date(lastSyncedAt).toLocaleString("en-IN")}`
                  : "Sync pending"
                }
              </span>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{activeItem.label}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{section.subTitle}</p>
            </div>
            <AccountButton />
          </header>

          <div className="space-y-8 pb-24 lg:pb-12">{children}</div>
        </main>
      </div>

      <MobileDock currentPath={location.pathname} />
    </div>
  )
}

const MobileDock = ({ currentPath }) => (
  <div className="lg:hidden">
    <div className="fixed inset-x-6 bottom-6 z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/10">
      <nav className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = currentPath.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100"
                }`}
              >
                <Icon size={16} />
              </span>
              {item.label.split(" ")[0]}
            </NavLink>
          )
        })}
      </nav>
    </div>
    <div className="h-24" />
  </div>
)

export default AppShell
