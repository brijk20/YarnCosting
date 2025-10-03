import useCalculatorStore from "../../store/calculatorStore"

const AdditionalCostsSection = () => {
  const additional = useCalculatorStore((state) => state.additional)
  const updateAdditional = useCalculatorStore((state) => state.updateAdditional)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-800">Additional charges</h2>
        <p className="text-xs text-slate-500">Defaults to ₹10/m. Update if finishing or transport varies.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Khata kharch (₹ / meter)
          <input
            type="number"
            min="0"
            value={additional.khataKharch}
            onChange={(event) => updateAdditional("khataKharch", event.target.value)}
            placeholder="10"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      </div>
    </section>
  )
}

export default AdditionalCostsSection
