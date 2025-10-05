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

  const unitOptions = [
    {
      value: "denier",
      label: "Denier (D)",
      helper: "Weight-based thickness",
    },
    {
      value: "count",
      label: "Count (Ne)",
      helper: "Traditional cotton count",
    },
  ]

  const rateOptions = [
    {
      value: "final",
      label: "Final rate",
      helper: "Use the exact rate entered",
    },
    {
      value: "plus",
      label: "+ GST",
      helper: "Add 5% GST automatically",
    },
    {
      value: "plusplus",
      label: "+ ₹ + GST",
      helper: "Add flat extra ₹ then 5% GST",
    },
  ]

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
          <div className="flex flex-col gap-2">
            <input
              type="number"
              min="0"
              value={warp.denier}
              onChange={handleChange("denier")}
              placeholder="120"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {unitOptions.map((option) => {
                const active = warp.denierUnit === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUnit(option.value)}
                    aria-pressed={active}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="text-[11px] text-slate-500">{option.helper}</span>
                    </span>
                    <span className="text-base">{active ? "✓" : ""}</span>
                  </button>
                )
              })}
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
          <div className="grid gap-2 sm:grid-cols-3">
            {rateOptions.map((option) => {
              const active = warp.rateMode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRateMode(option.value)}
                  aria-pressed={active}
                  className={`flex h-full flex-col justify-between rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-base">{active ? "✓" : ""}</span>
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">{option.helper}</span>
                </button>
              )
            })}
          </div>
          {warp.rateMode === "plusplus" && (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <span>Extra (₹ per kg)</span>
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
