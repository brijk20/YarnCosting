import useCalculatorStore from "../../store/calculatorStore"

const WarpSection = () => {
  const warp = useCalculatorStore((state) => state.warp)
  const updateWarp = useCalculatorStore((state) => state.updateWarp)

  const handleChange = (field) => (event) => {
    updateWarp(field, event.target.value)
  }

  const setUnit = (value) => {
    updateWarp("denierUnit", value)
  }

  const setRateMode = (value) => {
    updateWarp("rateMode", value)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-800">Warp yarn</h2>
        <p className="text-xs text-slate-500">Key loom inputs grouped for speed on the shop floor.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Total ends
          <input
            type="number"
            min="0"
            value={warp.totalEnds}
            onChange={handleChange("totalEnds")}
            placeholder="6500"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <div className="flex flex-col gap-1 text-xs font-medium text-slate-600 md:col-span-2">
          Denier / count
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <input
              type="number"
              min="0"
              value={warp.denier}
              onChange={handleChange("denier")}
              placeholder="120"
              className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600 shadow-inner">
              <button
                type="button"
                onClick={() => setUnit("denier")}
                className={`rounded-full px-3 py-1 transition ${
                  warp.denierUnit === "denier"
                    ? "bg-white text-indigo-600 shadow"
                    : "hover:text-indigo-500"
                }`}
              >
                Denier
              </button>
              <button
                type="button"
                onClick={() => setUnit("count")}
                className={`rounded-full px-3 py-1 transition ${
                  warp.denierUnit === "count"
                    ? "bg-white text-indigo-600 shadow"
                    : "hover:text-indigo-500"
                }`}
              >
                Count (Ne)
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Base rate (₹/kg)
          <input
            type="number"
            min="0"
            value={warp.rate}
            onChange={handleChange("rate")}
            placeholder="540"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <div className="flex flex-col gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600 shadow-inner">
            {[
              { value: "final", label: "Final" },
              { value: "plus", label: "+ GST" },
              { value: "plusplus", label: "+₹ + GST" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRateMode(option.value)}
                className={`rounded-full px-3 py-1 transition ${
                  warp.rateMode === option.value
                    ? "bg-white text-indigo-600 shadow"
                    : "hover:text-indigo-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {warp.rateMode === "plusplus" && (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <span>Extra (₹)</span>
              <input
                type="number"
                min="0"
                value={warp.rateExtra ?? 5}
                onChange={handleChange("rateExtra")}
                className="w-20 rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200"
              />
            </label>
          )}
        </div>
      </div>
    </section>
  )
}

export default WarpSection
