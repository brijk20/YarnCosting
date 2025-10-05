import { useMemo, useState } from "react"
import useOperationsStore, { calculateDueDate, calculateInterest } from "../../store/operationsStore"
import OperationsDashboard from "./OperationsDashboard"
import SalesEntry from "./SalesEntry"
import PaymentEntry from "./PaymentEntry"
import TransactionsView from "./TransactionsView"
import ReportsView from "./ReportsView"
import ExcelPlaceholder from "./ExcelPlaceholder"

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "sales", label: "Sales Entry" },
  { id: "payments", label: "Payment Entry" },
  { id: "transactions", label: "Transactions" },
  { id: "reports", label: "Reports" },
  { id: "excel", label: "Excel" },
]

const OperationsWorkspace = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const sales = useOperationsStore((state) => state.sales)
  const payments = useOperationsStore((state) => state.payments)

  const summary = useOperationsStore((state) => state.getDashboardSnapshot())
  const parties = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.party))).sort(),
    [sales],
  )

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm md:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 md:text-xl">Business Operations</h2>
          <p className="text-xs text-slate-500">
            Track sales, payments, and interest for yarn & fabric transactions.
          </p>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow"
                : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-indigo-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "dashboard" && <OperationsDashboard parties={parties} summary={summary} />}
      {activeTab === "sales" && <SalesEntry />}
      {activeTab === "payments" && <PaymentEntry />}
      {activeTab === "transactions" && (
        <TransactionsView sales={sales} calculateInterest={calculateInterest} calculateDueDate={calculateDueDate} />
      )}
      {activeTab === "reports" && <ReportsView sales={sales} />}
      {activeTab === "excel" && <ExcelPlaceholder sales={sales} payments={payments} />}
    </section>
  )
}

export default OperationsWorkspace
