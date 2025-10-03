import { useMemo } from "react"
import useCalculatorStore from "../../store/calculatorStore"
import { calculateTotals, formatCurrency, formatNumber } from "../../utils/calculations"

const StatChip = ({ label, value, hint, tone = "default" }) => {
  const tones = {
    default: "bg-slate-50 text-slate-700 border-slate-200",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]} shadow-sm`}> 
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  )
}

const ResultsPanel = () => {
  const state = useCalculatorStore((storeState) => storeState)
  const { warp, wefts, summary } = useMemo(() => calculateTotals(state), [state])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/60 backdrop-blur xl:sticky xl:top-24">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-800">Summary</h2>
        <p className="text-xs text-slate-500">Live costing as you adjust picks and rates.</p>
      </header>

      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatChip
            tone="primary"
            label="Total with GST"
            value={formatCurrency(summary.totalWithGst)}
            hint={`Net: ${formatCurrency(summary.costBeforeGst)} • GST ₹${formatNumber(summary.gstAmount, 2)}`}
          />
          <StatChip
            label="Cost / meter"
            value={formatCurrency(summary.costBeforeGst)}
            hint={`Yarn ₹${formatCurrency(summary.yarnCostPerMeter)} + Khata ₹${formatCurrency(summary.khataKharch)}`}
          />
          <StatChip
            label="Cost / pick"
            value={formatCurrency(summary.costPerPick)}
            hint={`${formatNumber(summary.picksPerMeter, 1)} picks per meter`}
          />
          <StatChip
            tone={summary.profitPerMeter >= 0 ? "success" : "default"}
            label="Profit / meter"
            value={formatCurrency(summary.profitPerMeter)}
            hint={summary.salePrice ? `Sale price: ${formatCurrency(summary.salePrice)} • Margin ${formatNumber(summary.marginPercent, 2)}%` : "Add sale price to see margin"}
          />
        </div>

        <details className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm" open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Warp breakdown</summary>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Final rate</span>
              <span>{formatCurrency(warp.finalRate)} / kg</span>
            </div>
            <div className="flex justify-between">
              <span>Weight per meter</span>
              <span>{formatNumber(warp.weightPerMeter, 4)} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Cost per meter</span>
              <span>{formatCurrency(warp.costPerMeter)}</span>
            </div>
            <div className="flex justify-between">
              <span>Weight per 100 m</span>
              <span>{formatNumber(warp.weightPer100m, 3)} kg</span>
            </div>
          </div>
        </details>

        <details className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm" open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Weft breakdown ({wefts.length})
          </summary>
          <div className="mt-3 space-y-3">
            {wefts.map((weft, index) => (
              <div key={weft.id} className="rounded-xl border border-slate-100 bg-white/70 p-3 text-sm shadow-inner">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-slate-700">
                  <span className="font-semibold">
                    {weft.name ? weft.name : `Weft ${index + 1}`}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Ratio {formatNumber(weft.ratio, 2)}</span>
                </div>
                <div className="grid gap-2 text-slate-600 sm:grid-cols-2">
                  <div className="flex justify-between">
                    <span>Effective picks / inch</span>
                    <span>{formatNumber(weft.effectivePick, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final rate</span>
                    <span>{formatCurrency(weft.finalRate)} / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight per meter</span>
                    <span>{formatNumber(weft.weightPerMeter, 4)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per meter</span>
                    <span>{formatCurrency(weft.costPerMeter)}</span>
                  </div>
                </div>
              </div>
            ))}
            {!wefts.length && <p className="text-xs text-slate-500">Add at least one weft to calculate.</p>}
          </div>
        </details>
      </div>
    </section>
  )
}

export default ResultsPanel
