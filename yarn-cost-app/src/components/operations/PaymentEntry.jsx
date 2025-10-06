import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useOperationsStore, { calculateInterestDue, previewPaymentAllocation } from "../../store/operationsStore"
import Button from "../ui/Button"

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const PaymentEntry = () => {
  const { user } = useAuth()
  const addPayment = useOperationsStore((state) => state.addPayment)
  const sales = useOperationsStore((state) => state.sales)
  const [form, setForm] = useState({
    party: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    mode: "online",
    reference: "",
    notes: "",
  })
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const parties = useMemo(
    () => Array.from(new Set(sales.map((sale) => sale.party))).sort(),
    [sales],
  )

  const partyStats = useMemo(() => {
    if (!form.party) return null
    const now = new Date()
    return sales
      .filter((sale) => sale.party === form.party)
      .reduce(
        (acc, sale) => {
          acc.outstanding += sale.balance
          acc.interest += calculateInterestDue(sale, now)
          return acc
        },
        { outstanding: 0, interest: 0 },
      )
  }, [form.party, sales])

  const allocation = useMemo(() => {
    if (!form.party || !form.amount) return null
    return previewPaymentAllocation({
      sales,
      party: form.party,
      amount: form.amount,
      paymentDate: form.date,
    })
  }, [form.amount, form.date, form.party, sales])

  const outstandingPrincipal = partyStats?.outstanding ?? 0
  const outstandingInterest = partyStats?.interest ?? 0
  const projectedPrincipal = allocation
    ? Math.max(0, outstandingPrincipal - allocation.totals.totalPrincipalApplied)
    : outstandingPrincipal
  const projectedInterest = allocation
    ? Math.max(0, outstandingInterest - allocation.totals.totalInterestApplied)
    : outstandingInterest

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await addPayment({
        userId: user?.id,
        party: form.party,
        paymentDate: form.date,
        amount: form.amount,
        mode: form.mode,
        reference: form.reference,
        notes: form.notes.trim(),
      })
      setMessage({ type: "success", text: "Payment recorded. Principal is cleared before interest." })
      setForm((prev) => ({ ...prev, amount: "", reference: "", notes: "" }))
    } catch (error) {
      setMessage({ type: "danger", text: error.message || "Unable to record payment" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,3.5fr)_minmax(0,2fr)]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <header className="mb-6 space-y-1">
            <h3 className="text-base font-semibold text-slate-800">Record payment</h3>
            <p className="text-xs text-slate-500">
              Apply receipts against the newest invoices first. Principal is closed before any outstanding interest.
            </p>
          </header>

          {!user ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Sign in with your Ambrox account to sync receivables and share payment trails with management.
            </div>
          ) : null}

          {message ? (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 md:col-span-2 xl:col-span-2">
              Party name
              <select
                value={form.party}
                onChange={handleChange("party")}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
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
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Payment date
              <input
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 xl:col-span-2">
              Amount received (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange("amount")}
                placeholder="15000"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Mode
              <select
                value={form.mode}
                onChange={handleChange("mode")}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
              >
                <option value="online">Online (RTGS/NEFT/IMPS)</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Reference / instrument no.
              <input
                type="text"
                value={form.reference}
                onChange={handleChange("reference")}
                placeholder="Txn / cheque no"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 xl:col-span-2">
              Notes (optional)
              <input
                type="text"
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="E.g. freight adjustment"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
              />
            </label>
            <div className="xl:col-span-1">
              <Button type="submit" variant="primary" disabled={submitting} className="h-full w-full justify-center">
                {submitting ? "Posting…" : "Record payment"}
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Allocation preview</h4>
              <p className="text-xs text-slate-500">Understand how this receipt distributes across invoices.</p>
            </div>
            {allocation?.totals.unapplied ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Unapplied balance: {currency(allocation.totals.unapplied)}
              </span>
            ) : null}
          </header>

          {allocation ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PreviewStat label="Principal applied" value={currency(allocation.totals.totalPrincipalApplied)} tone="emerald" />
                <PreviewStat label="Interest applied" value={currency(allocation.totals.totalInterestApplied)} />
                <PreviewStat label="Principal after payment" value={currency(projectedPrincipal)} tone="slate" />
                <PreviewStat label="Interest still due" value={currency(projectedInterest)} tone="amber" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/90">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Principal</th>
                      <th className="px-4 py-3">Interest</th>
                      <th className="px-4 py-3">Principal left</th>
                      <th className="px-4 py-3">Interest left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocation.breakdown.map((item) => (
                      <tr key={item.saleId} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3">
                          <p className="font-medium">{new Date(item.saleDate).toLocaleDateString("en-IN")}</p>
                          <p className="text-xs text-slate-500">Due {new Date(item.dueDate).toLocaleDateString("en-IN")}</p>
                        </td>
                        <td className="px-4 py-3">{currency(item.principalApplied)}</td>
                        <td className="px-4 py-3">{currency(item.interestApplied)}</td>
                        <td className="px-4 py-3">{currency(item.principalRemaining)}</td>
                        <td className="px-4 py-3">{currency(item.interestRemaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
              Select a party and enter a receipt amount to preview how it will be applied.
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6">
          <h4 className="text-sm font-semibold text-slate-700">Exposure snapshot</h4>
          <p className="mb-4 text-xs text-slate-500">Live principal and interest position for the selected party.</p>
          {partyStats ? (
            <div className="space-y-3">
              <SnapshotRow
                label="Principal outstanding"
                before={currency(outstandingPrincipal)}
                after={currency(projectedPrincipal)}
                tone="slate"
              />
              <SnapshotRow
                label="Interest due"
                before={currency(outstandingInterest)}
                after={currency(projectedInterest)}
                tone="amber"
              />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
              Choose a party to view outstanding amounts and interest.
            </p>
          )}
          <p className="mt-4 text-[11px] text-slate-400">
            Interest accrues monthly post 90-day credit period. Clearing interest requires allocating payment beyond the principal balance.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-slate-50 to-white p-6 text-sm text-slate-600">
          <h4 className="text-sm font-semibold text-slate-800">Best practice</h4>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed">
            <li>✅ Settle accrued interest separately after clearing principal.</li>
            <li>✅ Use unapplied balances to earmark advances for future invoices.</li>
            <li>⚠️ If interest remains, invoices stay open under "Interest due" status.</li>
          </ul>
        </div>
      </aside>
    </section>
  )
}

const PreviewStat = ({ label, value, tone }) => {
  const toneStyles =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : tone === "slate"
          ? "border-slate-200 bg-white/80 text-slate-700"
          : "border-indigo-100 bg-indigo-50 text-indigo-700"

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneStyles}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  )
}

const SnapshotRow = ({ label, before, after, tone }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/40 px-4 py-3">
    <div>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-[11px] text-slate-400">Before payment</p>
      <p className="text-sm font-semibold text-slate-700">{before}</p>
    </div>
    <div className="text-right">
      <p className="text-[11px] text-slate-400">Projected after</p>
      <p
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          tone === "amber"
            ? "bg-amber-100 text-amber-700"
            : tone === "slate"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {after}
      </p>
    </div>
  </div>
)

export default PaymentEntry
