import { useMemo, useState } from "react"
import useOperationsStore, { calculateInterest } from "../../store/operationsStore"

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const PaymentEntry = () => {
  const addPayment = useOperationsStore((state) => state.addPayment)
  const sales = useOperationsStore((state) => state.sales)
  const [form, setForm] = useState({ party: "", date: new Date().toISOString().slice(0, 10), amount: "" })
  const [message, setMessage] = useState(null)

  const parties = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.party))).sort(),
    [sales],
  )

  const partyStats = useMemo(() => {
    if (!form.party) return null
    const now = new Date()
    return sales
      .filter((sale) => sale.party === form.party && sale.balance > 0)
      .reduce(
        (acc, sale) => {
          acc.outstanding += sale.balance
          acc.interest += calculateInterest(sale, now)
          return acc
        },
        { outstanding: 0, interest: 0 },
      )
  }, [form.party, sales])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    try {
      addPayment({
        party: form.party,
        paymentDate: form.date,
        amount: form.amount,
      })
      setMessage({ type: "success", text: "Payment applied using LIFO" })
      setForm((prev) => ({ ...prev, amount: "" }))
    } catch (error) {
      setMessage({ type: "danger", text: error.message || "Unable to record payment" })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Record payment</h3>
        <p className="text-xs text-slate-500">Payments are applied to the latest invoices first.</p>
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
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 md:col-span-2">
          Party name
          <select
            value={form.party}
            onChange={handleChange("party")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          >
            <option value="">Select party…</option>
            {parties.map((party) => (
              <option key={party} value={party}>
                {party}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Payment date
          <input
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 md:col-span-2">
          Amount received (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="15000"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring"
            required
          />
        </label>
        <div className="md:col-span-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Record payment
          </button>
        </div>
      </form>

      {partyStats ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Current exposure</p>
          <p>Outstanding: {currency(partyStats.outstanding)}</p>
          <p>Interest (to date): {currency(partyStats.interest)}</p>
          <p className="text-xs text-slate-400">Interest uses 1.5% monthly rate after 90 days.</p>
        </div>
      ) : null}
    </div>
  )
}

export default PaymentEntry
