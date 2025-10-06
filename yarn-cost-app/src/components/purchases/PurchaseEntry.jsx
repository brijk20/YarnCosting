import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useOperationsStore from "../../store/operationsStore"
import Card, { CardSection } from "../ui/Card"
import Button from "../ui/Button"
import Badge from "../ui/Badge"

const PurchaseEntry = () => {
  const { user } = useAuth()
  const purchases = useOperationsStore((state) => state.purchases)
  const addPurchase = useOperationsStore((state) => state.addPurchase)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    supplier: "",
    yarnBrand: "",
    yarnCount: "",
    yarnType: "",
    ratePerKg: "",
    quantityKg: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  const suppliers = useMemo(
    () => Array.from(new Set(purchases.map((row) => row.supplier))).filter(Boolean),
    [purchases],
  )

  const amount = toCurrency(
    Number(form.ratePerKg || 0) * Number(form.quantityKg || 0),
  )

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await addPurchase({
        userId: user?.id,
        supplier: form.supplier.trim(),
        yarnBrand: form.yarnBrand.trim(),
        yarnCount: form.yarnCount.trim(),
        yarnType: form.yarnType.trim(),
        ratePerKg: form.ratePerKg,
        quantityKg: form.quantityKg,
        purchaseDate: form.purchaseDate,
        notes: form.notes.trim(),
      })
      setMessage({ type: "success", text: "Purchase recorded." })
      setForm({
        supplier: "",
        yarnBrand: "",
        yarnCount: "",
        yarnType: "",
        ratePerKg: "",
        quantityKg: "",
        purchaseDate: new Date().toISOString().slice(0, 10),
        notes: "",
      })
    } catch (error) {
      setMessage({ type: "danger", text: error.message || "Unable to record purchase" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardSection
        title="Log yarn purchase"
        description="Key in supplier, yarn, and rates without leaving the warehouse floor."
        actions={[
          <span key="status" className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {user ? "Synced to Supabase" : "Stored on this device"}
          </span>,
          <Badge key="amount" tone="indigo">Amount: {amount}</Badge>,
        ]}
      />
      {message ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Supplier / company
          <input
            list="supplier-list"
            value={form.supplier}
            onChange={handleChange("supplier")}
            placeholder="e.g. Reliable Yarn Traders"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
            required
          />
          <datalist id="supplier-list">
            {suppliers.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Purchase date
          <input
            type="date"
            value={form.purchaseDate}
            onChange={handleChange("purchaseDate")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Yarn brand / company
          <input
            type="text"
            value={form.yarnBrand}
            onChange={handleChange("yarnBrand")}
            placeholder="e.g. Vardhman"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Count (Ne)
          <input
            type="text"
            value={form.yarnCount}
            onChange={handleChange("yarnCount")}
            placeholder="30/1"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Yarn type / fibre
          <input
            type="text"
            value={form.yarnType}
            onChange={handleChange("yarnType")}
            placeholder="100% Cotton"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Rate (₹/kg)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ratePerKg}
              onChange={handleChange("ratePerKg")}
              placeholder="275"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Quantity (kg)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.quantityKg}
              onChange={handleChange("quantityKg")}
              placeholder="520"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Notes
          <input
            type="text"
            value={form.notes}
            onChange={handleChange("notes")}
            placeholder="Optional remarks"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
          />
        </label>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save purchase"}
        </Button>
      </form>
    </Card>
  )
}

const toCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default PurchaseEntry
