import useCalculatorStore from "../../store/calculatorStore"

const WeftSection = () => {
  const weftConfig = useCalculatorStore((state) => state.weftConfig)
  const wefts = useCalculatorStore((state) => state.wefts)
  const updateWeftConfig = useCalculatorStore((state) => state.updateWeftConfig)
  const updateWeft = useCalculatorStore((state) => state.updateWeft)
  const addWeft = useCalculatorStore((state) => state.addWeft)
  const removeWeft = useCalculatorStore((state) => state.removeWeft)

  const handleConfigChange = (field) => (event) => {
    updateWeftConfig(field, event.target.value)
  }

  const handleWeftChange = (id, field) => (event) => {
    updateWeft(id, { [field]: event.target.value })
  }

  const setWeftUnit = (id, unit) => {
    updateWeft(id, { denierUnit: unit })
  }

  const setRateMode = (id, mode) => {
    updateWeft(id, { rateMode: mode })
  }

  const unitOptions = [
    { value: "denier", label: "Denier (D)", helper: "Weight-based thickness" },
    { value: "count", label: "Count (Ne)", helper: "Cotton system" },
  ]

  const rateOptions = [
    { value: "final", label: "Final rate", helper: "Use entered rate" },
    { value: "plus", label: "+ GST", helper: "Add 5% GST" },
    { value: "plusplus", label: "+ ₹ + GST", helper: "Add flat ₹ then GST" },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-800">Weft yarns</h2>
        <p className="text-xs text-slate-500">Quickly add ratios for multiple yarns and keep shortage under control.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Picks per inch
          <input
            type="number"
            min="0"
            value={weftConfig.picksPerInch}
            onChange={handleConfigChange("picksPerInch")}
            placeholder="64"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Panno width (in)
          <input
            type="number"
            min="0"
            value={weftConfig.pannoInches}
            onChange={handleConfigChange("pannoInches")}
            placeholder="44"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Shortage (%)
          <input
            type="number"
            min="0"
            value={weftConfig.shortage ?? ""}
            onChange={handleConfigChange("shortage")}
            placeholder="10"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <span className="text-[10px] font-normal text-slate-400">Applied to every weft. Override inside a yarn if needed.</span>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {wefts.map((weft, index) => (
          <div
            key={weft.id}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition-colors hover:border-indigo-200"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700">
                Weft {index + 1}
                {weft.name ? ` · ${weft.name}` : ""}
              </div>
              {wefts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWeft(weft.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Name / note
                <input
                  type="text"
                  value={weft.name}
                  onChange={handleWeftChange(weft.id, "name")}
                  placeholder="e.g. 30s staple"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Ratio (picks)
                <input
                  type="number"
                  min="0"
                  value={weft.ratio}
                  onChange={handleWeftChange(weft.id, "ratio")}
                  placeholder="1"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <div className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Denier / count
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    min="0"
                    value={weft.denier}
                    onChange={handleWeftChange(weft.id, "denier")}
                    placeholder="100"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <div className="grid gap-2">
                    {unitOptions.map((option) => {
                      const active = weft.denierUnit === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setWeftUnit(weft.id, option.value)}
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
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Base rate (₹/kg)
                <input
                  type="number"
                  min="0"
                  value={weft.rate}
                  onChange={handleWeftChange(weft.id, "rate")}
                  placeholder="610"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-2">
                <span>Rate mode</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {rateOptions.map((option) => {
                    const active = weft.rateMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRateMode(weft.id, option.value)}
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
                {weft.rateMode === "plusplus" && (
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                    <span>Extra (₹ per kg)</span>
                    <input
                      type="number"
                      min="0"
                      value={weft.rateExtra ?? 5}
                      onChange={handleWeftChange(weft.id, "rateExtra")}
                      className="w-20 rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200"
                    />
                  </label>
                )}
              </div>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Shortage (%)
                <input
                  type="number"
                  min="0"
                  value={weft.shortage ?? weftConfig.shortage ?? ""}
                  onChange={handleWeftChange(weft.id, "shortage")}
                  placeholder={String(weftConfig.shortage ?? 10)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addWeft}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          + Add weft yarn
        </button>
        <p className="text-[11px] text-slate-400">
          Ratios are distributed automatically across picks per inch.
        </p>
      </div>
    </section>
  )
}

export default WeftSection
