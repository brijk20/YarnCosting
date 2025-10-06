import { useMemo, useState } from "react"
import useOperationsStore, { calculateDueDate } from "../store/operationsStore"
import Card, { CardSection } from "../components/ui/Card"
import SalesEntry from "../components/operations/SalesEntry"

const SalesPage = () => {
  const sales = useOperationsStore((state) => state.sales)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query.trim()) return sales
    const needle = query.trim().toLowerCase()
    return sales.filter((sale) =>
      [sale.party, sale.invoiceReference, sale.description, sale.quality]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    )
  }, [query, sales])

  return (
    <div className="space-y-8">
      <SalesEntry />

      <Card>
        <CardSection
          title="Recent invoices"
          description="Search by party, invoice number, or notes."
          actions={[
            <input
              key="search"
              type="search"
              placeholder="Search invoices"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />,
          ]}
        />
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Due date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{sale.invoiceReference || "—"}</div>
                    <div className="text-xs text-slate-500">{new Date(sale.saleDate).toLocaleDateString("en-IN")}</div>
                  </td>
                  <td className="px-3 py-2">{sale.party}</td>
                  <td className="px-3 py-2">{sale.quality || "—"}</td>
                  <td className="px-3 py-2">{currency(sale.amount)}</td>
                  <td className="px-3 py-2">{currency(sale.balance)}</td>
                  <td className="px-3 py-2">{new Date(calculateDueDate(sale.saleDate)).toLocaleDateString("en-IN")}</td>
                  <td className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">{sale.status}</td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={7}>
                    No invoices match the current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default SalesPage
