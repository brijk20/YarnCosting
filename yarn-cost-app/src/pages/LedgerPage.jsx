import { useMemo, useState } from "react"
import useOperationsStore from "../store/operationsStore"
import Card, { CardSection } from "../components/ui/Card"
import Badge from "../components/ui/Badge"

const allColumns = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "party", label: "Party / Supplier" },
  { id: "reference", label: "Reference" },
  { id: "amount", label: "Amount" },
  { id: "balance", label: "Balance / Qty" },
  { id: "notes", label: "Notes" },
]

const LedgerPage = () => {
  const sales = useOperationsStore((state) => state.sales)
  const payments = useOperationsStore((state) => state.payments)
  const purchases = useOperationsStore((state) => state.purchases)

  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((column) => column.id))

  const ledgerRows = useMemo(() => {
    const base = [
      ...sales.map((sale) => ({
        id: `sale-${sale.id}`,
        date: sale.saleDate,
        type: "sale",
        party: sale.party,
        reference: sale.invoiceReference || "",
        amount: sale.amount,
        balance: sale.balance,
        notes: sale.description || sale.quality || "",
      })),
      ...payments.map((payment) => ({
        id: `payment-${payment.id}`,
        date: payment.paymentDate,
        type: "payment",
        party: payment.party,
        reference: payment.reference || "",
        amount: -payment.amount,
        balance: payment.appliedTo?.map((entry) => `₹${entry.principal}`).join(", ") || "",
        notes: payment.notes || "",
      })),
      ...purchases.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        date: purchase.purchaseDate,
        type: "purchase",
        party: purchase.supplier,
        reference: `${purchase.yarnBrand || ""} ${purchase.yarnCount || ""}`.trim(),
        amount: purchase.amount ? -purchase.amount : 0,
        balance: purchase.quantityKg ? `${purchase.quantityKg} kg` : "",
        notes: purchase.yarnType || purchase.notes || "",
      })),
    ]

    return base.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [sales, payments, purchases])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ledgerRows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false
      if (!needle) return true
      return [row.party, row.reference, row.notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    })
  }, [ledgerRows, query, typeFilter])

  const ledgerSummary = useMemo(() => {
    const outstanding = sales.reduce((acc, sale) => acc + (sale.balance ?? 0), 0)
    const interest = sales.reduce((acc, sale) => acc + (sale.interestAccrued ?? 0), 0)
    const purchaseSpend = purchases.reduce((acc, purchase) => acc + (purchase.amount ?? 0), 0)
    const paymentCollected = payments.reduce((acc, payment) => acc + (payment.amount ?? 0), 0)
    return { outstanding, interest, purchaseSpend, paymentCollected }
  }, [sales, purchases, payments])

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId) ? prev.filter((col) => col !== columnId) : [...prev, columnId],
    )
  }

  const handleExport = () => {
    if (typeof window === "undefined" || !filtered.length) return
    const activeColumns = allColumns.filter((column) => visibleColumns.includes(column.id))
    const header = activeColumns.map((column) => column.label).join(",")
    const rows = filtered.map((row) =>
      activeColumns
        .map((column) => escapeCsv(getLedgerCellValue(column.id, row)))
        .join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <Card>
      <CardSection
        title="Ledger"
        description="All sales, purchases, and payments in one view."
        actions={[
          <button
            key="export"
            type="button"
            onClick={handleExport}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            disabled={!filtered.length}
          >
            Export CSV
          </button>,
          <Badge key="count" tone="indigo">{filtered.length} entries</Badge>,
        ]}
      />
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <label className="font-semibold" htmlFor="ledger-type-filter">
              Type
            </label>
            <select
              id="ledger-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 focus:border-slate-900 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="sale">Sales</option>
              <option value="purchase">Purchases</option>
              <option value="payment">Payments</option>
            </select>
          </div>
          <input
            type="search"
            placeholder="Search party, reference, or notes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 focus:border-slate-900 focus:outline-none"
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Outstanding" value={ledgerSummary.outstanding} tone="indigo" />
          <SummaryCard label="Interest accrued" value={ledgerSummary.interest} tone="amber" />
          <SummaryCard label="Payments received" value={ledgerSummary.paymentCollected} tone="emerald" />
          <SummaryCard label="Purchase spend" value={ledgerSummary.purchaseSpend} tone="slate" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {allColumns.map((column) => (
            <label key={column.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.id)}
                onChange={() => toggleColumn(column.id)}
              />
              {column.label}
            </label>
          ))}
        </div>

        <div className="mt-6 max-h-[420px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                {allColumns
                  .filter((column) => visibleColumns.includes(column.id))
                  .map((column) => (
                    <th key={column.id} className="px-3 py-2">
                      {column.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                  {visibleColumns.includes("date") ? (
                    <td className="px-3 py-2">{new Date(row.date).toLocaleDateString("en-IN")}</td>
                  ) : null}
                  {visibleColumns.includes("type") ? (
                    <td className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">{titleCase(row.type)}</td>
                  ) : null}
                  {visibleColumns.includes("party") ? <td className="px-3 py-2">{row.party || "—"}</td> : null}
                  {visibleColumns.includes("reference") ? <td className="px-3 py-2">{row.reference || "—"}</td> : null}
                  {visibleColumns.includes("amount") ? <td className="px-3 py-2">{currency(row.amount)}</td> : null}
                  {visibleColumns.includes("balance") ? <td className="px-3 py-2">{row.balance || "—"}</td> : null}
                  {visibleColumns.includes("notes") ? <td className="px-3 py-2 text-xs text-slate-500">{row.notes || "—"}</td> : null}
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={visibleColumns.length}>
                    No ledger entries match the current filters.
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

const currency = (value) => {
  const number = Number(value || 0)
  const formatted = Math.abs(number).toLocaleString("en-IN", { maximumFractionDigits: 0 })
  const prefix = number < 0 ? "-₹" : "₹"
  return `${prefix}${formatted}`
}

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1)

const SummaryCard = ({ label, value, tone }) => {
  const toneStyles = {
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-white text-slate-700",
    default: "border-slate-200 bg-white text-slate-700",
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneStyles[tone] ?? toneStyles.default}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold">{currency(value)}</p>
    </div>
  )
}

const getLedgerCellValue = (columnId, row) => {
  switch (columnId) {
    case "date":
      return row.date ?? ""
    case "type":
      return row.type ?? ""
    case "party":
      return row.party ?? ""
    case "reference":
      return row.reference ?? ""
    case "amount":
      return row.amount ?? 0
    case "balance":
      return row.balance ?? ""
    case "notes":
      return row.notes ?? ""
    default:
      return ""
  }
}

const escapeCsv = (value) => {
  if (value === undefined || value === null) return ""
  const stringValue = String(value)
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export default LedgerPage
