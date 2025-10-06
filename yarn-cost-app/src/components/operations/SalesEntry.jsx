import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useOperationsStore, { computeGstSummary, computeProfitAndLoss } from "../../store/operationsStore"
import Card, { CardSection } from "../ui/Card"
import Button from "../ui/Button"

const gstOptions = [0, 5, 12, 18, 28]

const SalesEntry = () => {
  const { user } = useAuth()
  const addSale = useOperationsStore((state) => state.addSale)
  const sales = useOperationsStore((state) => state.sales)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    party: "",
    quality: "",
    invoiceReference: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    gstRate: "12",
    gstTreatment: "intrastate",
    gstInclusive: "exclusive",
    costOfSale: "",
  })

  const gstSummary = useMemo(() => computeGstSummary(sales), [sales])
  const pnlSummary = useMemo(() => computeProfitAndLoss(sales), [sales])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await addSale({
        userId: user?.id,
        party: form.party.trim(),
        quality: form.quality.trim(),
        invoiceReference: form.invoiceReference.trim(),
        saleDate: form.date,
        amount: form.amount,
        description: form.description.trim(),
        gstRate: form.gstRate,
        gstTreatment: form.gstTreatment,
        gstInclusive: form.gstInclusive === "inclusive",
        costOfSale: form.costOfSale,
      })
      setMessage({ type: "success", text: "Sale recorded." })
      setForm((prev) => ({
        ...prev,
        party: "",
        quality: "",
        invoiceReference: "",
        amount: "",
        description: "",
        costOfSale: "",
      }))
    } catch (error) {
      setMessage({ type: "danger", text: error.message || "Unable to add sale" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardSection
        title="New fabric sale"
        description="Add invoices quickly—terms default to 90 days so ageing stays current."
        actions={[
          <span key="sync" className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {user ? "Synced to Supabase" : "Stored on this device"}
          </span>,
        ]}
      >
        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Party"
            value={form.party}
            onChange={handleChange("party")}
            placeholder="Sunrise Textiles"
            required
          />
          <InputField
            label="Quality / fabric"
            value={form.quality}
            onChange={handleChange("quality")}
            placeholder="Kora 60x60 / 52"
          />
          <InputField
            label="Invoice number"
            value={form.invoiceReference}
            onChange={handleChange("invoiceReference")}
            placeholder="AMB/2025/001"
          />
          <InputField
            label="Invoice date"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            required
          />
          <InputField
            label="Invoice value (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="25000"
            required
          />
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            GST rate
            <select
              value={form.gstRate}
              onChange={handleChange("gstRate")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
            >
              {gstOptions.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <Legend>GST treatment</Legend>
            <RadioGroup>
              <RadioOption
                label="CGST + SGST (within state)"
                value="intrastate"
                name="gst-treatment"
                checked={form.gstTreatment === "intrastate"}
                onChange={handleChange("gstTreatment")}
              />
              <RadioOption
                label="IGST (outside state)"
                value="interstate"
                name="gst-treatment"
                checked={form.gstTreatment === "interstate"}
                onChange={handleChange("gstTreatment")}
              />
            </RadioGroup>
          </fieldset>
          <fieldset className="sm:col-span-2">
            <Legend>Invoice amount represents</Legend>
            <RadioGroup>
              <RadioOption
                label="Before GST"
                value="exclusive"
                name="gst-inclusive"
                checked={form.gstInclusive === "exclusive"}
                onChange={handleChange("gstInclusive")}
              />
              <RadioOption
                label="GST inclusive"
                value="inclusive"
                name="gst-inclusive"
                checked={form.gstInclusive === "inclusive"}
                onChange={handleChange("gstInclusive")}
              />
            </RadioGroup>
          </fieldset>
          <InputField
            label="Cost of sale (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.costOfSale}
            onChange={handleChange("costOfSale")}
            placeholder="19000"
          />
          <InputField
            label="Narration"
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Lot reference, transport, payment terms"
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Saving…" : "Save sale"}
            </Button>
          </div>
        </form>

        {sales.length ? <SalesSummary gstSummary={gstSummary} pnlSummary={pnlSummary} /> : null}
      </CardSection>
    </Card>
  )
}

const SalesSummary = ({ gstSummary, pnlSummary }) => (
  <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
    <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
      Collections snapshot
    </summary>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryItem label="Taxable turnover" value={gstSummary.taxable} />
      <SummaryItem label="GST collected" value={gstSummary.total} accent="indigo" />
      <SummaryItem label="Gross revenue" value={pnlSummary.revenue} />
      <SummaryItem label="Gross profit" value={pnlSummary.grossProfit} accent="emerald" />
    </div>
    <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
      <MiniItem label="CGST" value={gstSummary.cgst} />
      <MiniItem label="SGST" value={gstSummary.sgst} />
      <MiniItem label="IGST" value={gstSummary.igst} />
      <MiniItem
        label="Guidance"
        description={
          gstSummary.total > 0
            ? "Match against yarn input credit before filing GSTR-3B."
            : "Capture invoices to build GST visibility."
        }
      />
    </div>
  </details>
)

const InputField = ({ label, className = "", ...props }) => (
  <label className={`flex flex-col gap-1 text-xs font-semibold text-slate-600 ${className}`}>
    {label}
    <input
      {...props}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
    />
  </label>
)

const Legend = ({ children }) => (
  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>
)

const RadioGroup = ({ children }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-inner sm:flex-row sm:flex-wrap">
    {children}
  </div>
)

const RadioOption = ({ label, className = "", ...props }) => (
  <label className={`flex items-center gap-2 text-xs font-semibold text-slate-600 ${className}`}>
    <input type="radio" {...props} />
    <span>{label}</span>
  </label>
)

const SummaryItem = ({ label, value, accent }) => {
  const tone =
    accent === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : accent === "indigo"
        ? "border-indigo-100 bg-indigo-50 text-indigo-700"
        : "border-slate-200 bg-white text-slate-700"
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold">{currency(value)}</p>
    </div>
  )
}

const MiniItem = ({ label, value, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    {typeof value === "number" ? <p className="text-sm font-semibold text-slate-700">{currency(value)}</p> : null}
    {description ? <p className="mt-1 text-[11px] text-slate-500">{description}</p> : null}
  </div>
)

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default SalesEntry
