import useCalculatorStore from "../../store/calculatorStore"

const QualitySection = () => {
  const qualityName = useCalculatorStore((state) => state.qualityName)
  const setQualityName = useCalculatorStore((state) => state.setQualityName)
  const notes = useCalculatorStore((state) => state.notes)
  const setNotes = useCalculatorStore((state) => state.setNotes)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-800">Quality overview</h2>
          <p className="text-xs text-slate-500">Short labels work best for saved entries.</p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_1fr]">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Quality name
          <input
            type="text"
            value={qualityName}
            onChange={(event) => setQualityName(event.target.value)}
            placeholder="e.g. Chanderi border"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Internal notes
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Buyer, loom, yarn house…"
            className="min-h-[48px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      </div>
    </section>
  )
}

export default QualitySection
