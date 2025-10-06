import { useMemo, useState } from "react"
import { daysBetween } from "../../store/operationsStore"
import Button from "../ui/Button"

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const statusClasses = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  pending: "bg-slate-200 text-slate-600",
  interest_due: "bg-indigo-100 text-indigo-700",
  overdue: "bg-rose-500 text-white",
}

const TransactionsView = ({ sales, calculateInterestDue }) => {
  const [filters, setFilters] = useState({ party: "", status: "", from: "", to: "" })

  const parties = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.party))).sort(),
    [sales],
  )

  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        if (filters.party && sale.party !== filters.party) return false
        if (filters.status) {
          const isOverdue = sale.balance > 0 && new Date(sale.dueDate) < new Date()
          if (filters.status === "overdue" && !isOverdue) return false
          if (filters.status !== "overdue" && sale.status !== filters.status) return false
        }
        if (filters.from && sale.saleDate < filters.from) return false
        if (filters.to && sale.saleDate > filters.to) return false
        return true
      })
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
  }, [filters, sales])

  const resetFilters = () => setFilters({ party: "", status: "", from: "", to: "" })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Receivables ledger</h3>
        <p className="text-xs text-slate-500">Slice by party, status, and sale date to reconcile quickly.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Party
          <select
            value={filters.party}
            onChange={(event) => setFilters((prev) => ({ ...prev, party: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring"
          >
            <option value="">All parties</option>
            {parties.map((party) => (
              <option key={party} value={party}>
                {party}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring"
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="interest_due">Interest only</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          From date
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          To date
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring"
          />
        </label>
        <div className="flex items-end">
          <Button type="button" variant="outline" size="pill" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Sale date</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Interest</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Days overdue</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => {
              const today = new Date()
              const isOverdue = sale.balance > 0 && new Date(sale.dueDate) < today
              const statusKey = isOverdue ? "overdue" : sale.status
              const interest = calculateInterestDue(sale, today)
              const overdueDays = isOverdue ? Math.max(0, daysBetween(sale.dueDate, today)) : 0
              const interestOnly = statusKey === "interest_due"

              return (
                <tr key={sale.id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-4 py-3 font-medium">{sale.party}</td>
                  <td className="px-4 py-3">{sale.invoiceReference || "-"}</td>
                  <td className="px-4 py-3">{new Date(sale.saleDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">{new Date(sale.dueDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">{currency(sale.amount)}</td>
                  <td className="px-4 py-3">{currency(sale.paidAmount)}</td>
                  <td className="px-4 py-3">{currency(sale.balance)}</td>
                  <td className="px-4 py-3">{currency(interest)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[statusKey] ?? statusClasses.pending}`}>
                      {statusKey === "interest_due" ? "Interest due" : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{overdueDays ? `${overdueDays} days` : interestOnly ? "Interest pending" : "-"}</td>
                </tr>
              )
            })}
            {!filteredSales.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={10}>
                  No transactions match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionsView
