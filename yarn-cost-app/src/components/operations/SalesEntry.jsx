import { useState } from "react"
import useOperationsStore from "../../store/operationsStore"

const SalesEntry = () => {
  const addSale = useOperationsStore((state) => state.addSale)
  const [form, setForm] = useState({ party: "", date: new Date().toISOString().slice(0, 10), amount: "", description: "" })
  const [message, setMessage] = useState(null)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    try {
      addSale({
        party: form.party.trim(),
        saleDate: form.date,
        amount: form.amount,
        description: form.description.trim(),
      })
      setMessage({ type: "success", text: "Sale recorded successfully" })
      setForm({ party: "", date: new Date().toISOString().slice(0, 10), amount: "", description: "" })
    } catch (error) {
      setMessage({ type: "danger", text: error.message || "Unable to add sale" })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Add new sale</h3>
        <p className="text-xs text-slate-500">Capture sales with built-in 90-day payment terms.</p>
      </div>
      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Party name
          <input
            type="text"
            value={form.party}
            onChange={handleChange("party")}
            placeholder="e.g. Sunrise Textiles"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sale date
          <input
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Amount (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="25000"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Description
          <input
            type="text"
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Fabric lot / loom reference"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Save sale
          </button>
        </div>
      </form>
    </div>
  )
}

export default SalesEntry
