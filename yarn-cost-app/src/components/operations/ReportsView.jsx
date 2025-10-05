import { useMemo, useState } from "react"
import { calculateInterest } from "../../store/operationsStore"

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const periods = [
  { id: "current", label: "Current month" },
  { id: "last", label: "Last month" },
  { id: "quarter", label: "This quarter" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
]

const ReportsView = ({ sales }) => {
  const [period, setPeriod] = useState("current")

  const { summary, partyBreakdown, invoiceCount } = useMemo(() => {
    const now = new Date()
    let from
    let to = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (period) {
      case "current":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "last":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3)
        from = new Date(now.getFullYear(), quarter * 3, 1)
        break
      }
      case "year":
        from = new Date(now.getFullYear(), 0, 1)
        break
      case "all":
      default:
        from = new Date(2000, 0, 1)
    }

    const filtered = sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate)
      return saleDate >= from && saleDate <= to
    })

    const totals = filtered.reduce(
      (acc, sale) => {
        acc.totalSales += sale.amount
        acc.totalPaid += sale.paidAmount
        acc.outstanding += sale.balance
        acc.interest += calculateInterest(sale, new Date())
        return acc
      },
      { totalSales: 0, totalPaid: 0, outstanding: 0, interest: 0 },
    )

    const byParty = filtered.reduce((map, sale) => {
      if (!map.has(sale.party)) {
        map.set(sale.party, {
          party: sale.party,
          transactions: 0,
          totalSales: 0,
          totalPaid: 0,
          outstanding: 0,
          interest: 0,
        })
      }
      const record = map.get(sale.party)
      record.transactions += 1
      record.totalSales += sale.amount
      record.totalPaid += sale.paidAmount
      record.outstanding += sale.balance
      record.interest += calculateInterest(sale, new Date())
      return map
    }, new Map())

    return {
      summary: totals,
      partyBreakdown: Array.from(byParty.values()).sort((a, b) => b.totalSales - a.totalSales),
      invoiceCount: filtered.length,
    }
  }, [period, sales])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Interest & exposure report</h3>
          <p className="text-xs text-slate-500">Choose a reporting window to review collections and dues.</p>
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring"
        >
          {periods.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard title="Invoices" value={invoiceCount} subtitle="Count in period" />
        <SummaryCard title="Sales" value={currency(summary.totalSales)} subtitle="Invoices in period" />
        <SummaryCard title="Collected" value={currency(summary.totalPaid)} subtitle="Payments applied" />
        <SummaryCard title="Outstanding" value={currency(summary.outstanding)} subtitle="Pending after payments" />
        <SummaryCard title="Interest due" value={currency(summary.interest)} subtitle="Accrued till today" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/80">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Transactions</th>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Collected</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3">Interest</th>
              <th className="px-4 py-3">Collection %</th>
            </tr>
          </thead>
          <tbody>
            {partyBreakdown.map((row) => {
              const collectionRate = row.totalSales ? ((row.totalPaid / row.totalSales) * 100).toFixed(1) : "0.0"
              return (
                <tr key={row.party} className="border-b border-slate-100 text-slate-700">
                  <td className="px-4 py-3 font-medium">{row.party}</td>
                  <td className="px-4 py-3">{row.transactions}</td>
                  <td className="px-4 py-3">{currency(row.totalSales)}</td>
                  <td className="px-4 py-3">{currency(row.totalPaid)}</td>
                  <td className="px-4 py-3">{currency(row.outstanding)}</td>
                  <td className="px-4 py-3">{currency(row.interest)}</td>
                  <td className="px-4 py-3">{collectionRate}%</td>
                </tr>
              )
            })}
            {!partyBreakdown.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  No data available for the selected period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const SummaryCard = ({ title, value, subtitle }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
    <p className="mt-2 text-2xl font-semibold text-indigo-600">{value}</p>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
)

export default ReportsView
