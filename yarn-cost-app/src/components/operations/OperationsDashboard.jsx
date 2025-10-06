import { useMemo, useState } from "react"
import { calculateInterestDue, computePartySummary } from "../../store/operationsStore"

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const OperationsDashboard = ({ parties, summary, sales }) => {
  const [selectedParty, setSelectedParty] = useState("")

  const overdueSales = useMemo(
    () =>
      sales.filter((sale) => {
        if (sale.balance <= 0) return false
        const due = new Date(sale.dueDate)
        return new Date() > due
      }),
    [sales],
  )

  const partySummary = useMemo(() => computePartySummary(sales, selectedParty), [sales, selectedParty])

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Outstanding" value={currency(summary.totalOutstanding)} subtitle="Across all parties" />
        <DashboardCard title="Total Interest" value={currency(summary.totalInterest)} subtitle="1.5% monthly after 90 days" />
        <DashboardCard title="Overdue Payments" value={summary.overdueCount} subtitle="Invoices past credit terms" />
        <DashboardCard title="Sales (This Month)" value={currency(summary.monthlySales)} subtitle="Invoices raised this month" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Quick party summary</h3>
            <p className="text-xs text-slate-500">Select a party to view outstanding, interest, and dues.</p>
          </div>
          <select
            value={selectedParty}
            onChange={(event) => setSelectedParty(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring"
          >
            <option value="">Choose party…</option>
            {parties.map((party) => (
              <option key={party} value={party}>
                {party}
              </option>
            ))}
          </select>
        </header>

        {selectedParty && partySummary ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryTile label="Total Sales" value={currency(partySummary.totalSales)} />
            <SummaryTile label="Total Paid" value={currency(partySummary.totalPaid)} />
            <SummaryTile label="Outstanding" value={currency(partySummary.outstanding)} accent="warning" />
            <SummaryTile label="Interest due" value={currency(partySummary.interest)} accent="emerald" />
            <SummaryTile label="Overdue invoices" value={partySummary.overdue} />
            <SummaryTile label="Total transactions" value={partySummary.transactions} />
            <SummaryTile label="GST collected" value={currency(partySummary.gst)} />
            <SummaryTile label="Taxable turnover" value={currency(partySummary.taxable)} />
            <SummaryTile label="Cost of goods" value={currency(partySummary.cost)} />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
            Choose a party to view performance.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Upcoming & overdue</h3>
        {overdueSales.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Party</th>
                  <th className="px-3 py-2">Sale date</th>
                  <th className="px-3 py-2">Due date</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Interest</th>
                  <th className="px-3 py-2">Days overdue</th>
                </tr>
              </thead>
              <tbody>
                {overdueSales.map((sale) => {
                  const interest = calculateInterestDue(sale)
                  const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(sale.dueDate)) / (1000 * 60 * 60 * 24)))
                  return (
                    <tr key={sale.id} className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-2 font-medium">{sale.party}</td>
                      <td className="px-3 py-2">{new Date(sale.saleDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-2">{new Date(sale.dueDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-2">{currency(sale.balance)}</td>
                      <td className="px-3 py-2">{currency(interest)}</td>
                      <td className="px-3 py-2">{overdueDays} days</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm text-slate-500">
            No invoices are currently overdue. Great job keeping collections sharp!
          </p>
        )}
      </section>
    </div>
  )
}

const DashboardCard = ({ title, value, subtitle }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
    <p className="mt-2 text-2xl font-semibold text-indigo-600">{value}</p>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
)

const SummaryTile = ({ label, value, accent }) => (
  <div
    className={`rounded-xl border px-4 py-3 text-center ${
      accent === "warning"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : accent === "emerald"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white/80 text-slate-700"
    }`}
  >
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-base font-semibold">{value}</p>
  </div>
)

export default OperationsDashboard
