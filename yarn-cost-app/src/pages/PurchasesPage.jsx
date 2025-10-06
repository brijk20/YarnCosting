import { useMemo, useState } from "react"
import useOperationsStore from "../store/operationsStore"
import Card, { CardSection } from "../components/ui/Card"
import PurchaseEntry from "../components/purchases/PurchaseEntry"

const allColumns = [
  { id: "supplier", label: "Supplier" },
  { id: "brand", label: "Brand" },
  { id: "type", label: "Count / Type" },
  { id: "rate", label: "Rate (₹/kg)" },
  { id: "quantity", label: "Quantity (kg)" },
  { id: "amount", label: "Amount" },
  { id: "date", label: "Date" },
  { id: "notes", label: "Notes" },
]

const PurchasesPage = () => {
  const purchases = useOperationsStore((state) => state.purchases)
  const [query, setQuery] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((column) => column.id))

  const suppliers = useMemo(
    () =>
      Array.from(new Set(purchases.map((row) => row.supplier).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [purchases],
  )

  const brands = useMemo(
    () =>
      Array.from(new Set(purchases.map((row) => row.yarnBrand).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [purchases],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return purchases.filter((row) => {
      if (supplierFilter !== "all" && row.supplier !== supplierFilter) return false
      if (brandFilter !== "all" && row.yarnBrand !== brandFilter) return false
      if (!needle) return true
      return [row.supplier, row.yarnBrand, row.yarnType, row.notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    })
  }, [purchases, query, supplierFilter, brandFilter])

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId) ? prev.filter((column) => column !== columnId) : [...prev, columnId],
    )
  }

  const handleExport = () => {
    if (typeof window === "undefined" || !filtered.length) return
    const activeColumns = allColumns.filter((column) => visibleColumns.includes(column.id))
    const header = activeColumns.map((column) => column.label).join(",")
    const rows = filtered.map((row) =>
      activeColumns.map((column) => escapeCsv(getCellValue(column.id, row))).join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `yarn-purchases-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <PurchaseEntry />

      <Card>
        <CardSection
          title="Recent purchases"
          description="Filter by supplier or brand, choose the columns you need, and export for your accountant."
          actions={[
            <input
              key="search"
              type="search"
              placeholder="Search supplier, yarn, or notes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />,
            <button
              key="export"
              type="button"
              onClick={handleExport}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              disabled={!filtered.length}
            >
              Export CSV
            </button>,
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Supplier
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="all">All</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Brand
            <select
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="all">All</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500">{filtered.length} lots</span>
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
                  {visibleColumns.includes("supplier") ? (
                    <td className="px-3 py-2">
                      <div className="font-semibold">{row.supplier}</div>
                      <div className="text-xs text-slate-500">{row.notes || "—"}</div>
                    </td>
                  ) : null}
                  {visibleColumns.includes("brand") ? <td className="px-3 py-2">{row.yarnBrand || "—"}</td> : null}
                  {visibleColumns.includes("type") ? (
                    <td className="px-3 py-2">{[row.yarnCount, row.yarnType].filter(Boolean).join(" · ") || "—"}</td>
                  ) : null}
                  {visibleColumns.includes("rate") ? (
                    <td className="px-3 py-2">{row.ratePerKg ? currency(row.ratePerKg) : "—"}</td>
                  ) : null}
                  {visibleColumns.includes("quantity") ? (
                    <td className="px-3 py-2">{row.quantityKg ? `${row.quantityKg} kg` : "—"}</td>
                  ) : null}
                  {visibleColumns.includes("amount") ? (
                    <td className="px-3 py-2">{row.amount ? currency(row.amount) : "—"}</td>
                  ) : null}
                  {visibleColumns.includes("date") ? (
                    <td className="px-3 py-2">{new Date(row.purchaseDate).toLocaleDateString("en-IN")}</td>
                  ) : null}
                  {visibleColumns.includes("notes") ? (
                    <td className="px-3 py-2 text-xs text-slate-500">{row.yarnSupplier || row.notes || "—"}</td>
                  ) : null}
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={visibleColumns.length}>
                    No purchases match the current filters.
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

const getCellValue = (columnId, row) => {
  switch (columnId) {
    case "supplier":
      return row.supplier ?? ""
    case "brand":
      return row.yarnBrand ?? ""
    case "type":
      return [row.yarnCount, row.yarnType].filter(Boolean).join(" ")
    case "rate":
      return row.ratePerKg ?? ""
    case "quantity":
      return row.quantityKg ?? ""
    case "amount":
      return row.amount ?? ""
    case "date":
      return row.purchaseDate ?? ""
    case "notes":
      return row.notes ?? row.yarnSupplier ?? ""
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

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default PurchasesPage
