import { useMemo } from "react"
import useCalculatorStore from "../../store/calculatorStore"
import { calculateTotals, formatCurrency, formatNumber } from "../../utils/calculations"

const PricingSection = () => {
  const state = useCalculatorStore((s) => s)
  const updatePricing = useCalculatorStore((s) => s.updatePricing)

  const { summary } = useMemo(() => calculateTotals(state), [state])

  const hasSalePrice = Number(state.pricing.salePrice) > 0

  const quickApply = (multiplier) => {
    if (!summary.costBeforeGst) return
    const suggestion = (summary.costBeforeGst * multiplier).toFixed(2)
    updatePricing("salePrice", suggestion)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Pricing & margin</h2>
          <button
            type="button"
            onClick={() => updatePricing("salePrice", hasSalePrice ? "" : summary.totalWithGst.toFixed(2))}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            {hasSalePrice ? "Clear" : "Match GST total"}
          </button>
        </div>
        <p className="text-xs text-slate-500">Set a target price to see profit instantly.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_1fr]">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sale price (₹ / meter)
          <input
            type="number"
            min="0"
            value={state.pricing.salePrice}
            onChange={(event) => updatePricing("salePrice", event.target.value)}
            placeholder="Enter sale price"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-700">
          <div className="flex justify-between font-semibold text-emerald-800">
            <span>Profit / meter</span>
            <span>{formatCurrency(summary.profitPerMeter)}</span>
          </div>
          <div className="flex justify-between">
            <span>Margin %</span>
            <span>{formatNumber(summary.marginPercent, 2)}%</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[1.05, 1.08, 1.1].map((multiplier) => (
              <button
                key={multiplier}
                type="button"
                onClick={() => quickApply(multiplier)}
                className="rounded-full border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                +{Math.round((multiplier - 1) * 100)}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection
