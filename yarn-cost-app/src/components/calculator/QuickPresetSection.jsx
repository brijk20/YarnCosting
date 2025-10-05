import { useEffect, useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useCalculatorStore from "../../store/calculatorStore"
import { fetchQualities } from "../../lib/dataService"

const staticPresets = [
  {
    key: "pv_chanderi_63",
    label: "Chanderi 63",
    notes: "PV warp, single staple weft",
    payload: {
      qualityName: "Chanderi 63",
      warp: {
        totalEnds: 9240,
        denier: 21,
        denierUnit: "denier",
        rate: "",
        rateMode: "final",
        rateExtra: 5,
      },
      weftConfig: {
        picksPerInch: 62,
        pannoInches: 63,
        shortage: 10,
      },
      wefts: [
        {
          id: "static-weft-1",
          name: "30 Staple",
          ratio: 1,
          denier: 30,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
      ],
      additional: {
        khataKharch: 10,
      },
      pricing: {
        salePrice: "",
      },
      notes: "Preset: PV Chanderi | picks 62, panno 63",
    },
  },
  {
    key: "pv_chanderi_54",
    label: "Chanderi 54",
    notes: "PV warp, 54\" panno",
    payload: {
      qualityName: "Chanderi 54",
      warp: {
        totalEnds: 7975,
        denier: 21,
        denierUnit: "denier",
        rate: "",
        rateMode: "final",
        rateExtra: 5,
      },
      weftConfig: {
        picksPerInch: 54,
        pannoInches: 54,
        shortage: 10,
      },
      wefts: [
        {
          id: "static-weft-1",
          name: "30 Staple",
          ratio: 1,
          denier: 30,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
      ],
      additional: {
        khataKharch: 10,
      },
      pricing: {
        salePrice: "",
      },
      notes: "Preset: PV Chanderi | picks 54, panno 54",
    },
  },
  {
    key: "pv_vartican_63",
    label: "Vartical 63",
    notes: "Dual weft pattern 1:1",
    payload: {
      qualityName: "Vartical 63",
      warp: {
        totalEnds: 7502,
        denier: 21,
        denierUnit: "denier",
        rate: "",
        rateMode: "final",
        rateExtra: 5,
      },
      weftConfig: {
        picksPerInch: 48,
        pannoInches: 63,
        shortage: 10,
      },
      wefts: [
        {
          id: "static-weft-1",
          name: "12 Staple",
          ratio: 1,
          denier: 12,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
        {
          id: "static-weft-2",
          name: "27 Staple",
          ratio: 1,
          denier: 27,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
      ],
      additional: {
        khataKharch: 10,
      },
      pricing: {
        salePrice: "",
      },
      notes: "Preset: Vartical 63 with 12s/27s pattern",
    },
  },
  {
    key: "berlin",
    label: "Berlin",
    notes: "Pattern 4:2 twin weft",
    payload: {
      qualityName: "Berlin",
      warp: {
        totalEnds: 7800,
        denier: 21,
        denierUnit: "denier",
        rate: "",
        rateMode: "final",
        rateExtra: 5,
      },
      weftConfig: {
        picksPerInch: 54,
        pannoInches: 63,
        shortage: 10,
      },
      wefts: [
        {
          id: "static-weft-1",
          name: "30 Staple",
          ratio: 4,
          denier: 30,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
        {
          id: "static-weft-2",
          name: "12 Staple",
          ratio: 2,
          denier: 12,
          denierUnit: "count",
          rate: "",
          rateMode: "final",
          rateExtra: 5,
          shortage: "",
        },
      ],
      additional: {
        khataKharch: 10,
      },
      pricing: {
        salePrice: 41,
      },
      notes: "Preset: Berlin pattern 4/2",
    },
  },
]

const QuickPresetSection = () => {
  const loadFromSaved = useCalculatorStore((state) => state.loadFromSaved)
  const resetCalculator = useCalculatorStore((state) => state.resetCalculator)
  const { supabaseReady } = useAuth()

  const [publicPresets, setPublicPresets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let abort = false

    const load = async () => {
      if (!supabaseReady) {
        setPublicPresets([])
        return
      }

      setLoading(true)
      const { data, error } = await fetchQualities({})
      if (abort) return

      if (error) {
        console.warn("Unable to fetch shared qualities", error)
        setPublicPresets([])
      } else {
        setPublicPresets((data ?? []).filter((row) => row.is_public))
      }
      setLoading(false)
    }

    load()

    return () => {
      abort = true
    }
  }, [supabaseReady])

  const handleSelect = (presetPayload) => {
    if (!presetPayload) return
    resetCalculator()
    loadFromSaved(presetPayload)
  }

  const library = useMemo(() => {
    const builtin = staticPresets.map((preset) => ({
      key: `builtin-${preset.key}`,
      label: preset.label,
      notes: preset.notes,
      payload: preset.payload,
      origin: "default",
    }))

    const shared = publicPresets.map((row) => ({
      key: row.id,
      label: row.name || "Shared quality",
      notes: row.notes || "Published by super admin",
      payload: {
        qualityName: row.name ?? "",
        warp: row.warp ?? {},
        weftConfig: row.weft_config ?? {},
        wefts: row.wefts ?? [],
        additional: row.additional ?? {},
        pricing: row.pricing ?? {},
        notes: row.notes ?? "",
      },
      origin: "shared",
    }))

    return [...builtin, ...shared]
  }, [publicPresets])

  if (!library.length && !loading) {
    return null
  }

  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-indigo-100/40 p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Quick select quality</h2>
          <p className="text-xs text-slate-500">
            Tap a preset to prefill warp, weft, and costing inputs (rates stay editable).
          </p>
        </div>
        {loading ? <span className="text-[11px] text-slate-400">Loading shared presets…</span> : null}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {library.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handleSelect(preset.payload)}
            className={`group flex h-full flex-col justify-between rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              preset.origin === "shared"
                ? "border-emerald-100 bg-white/80 hover:border-emerald-200 hover:shadow-emerald-200/40"
                : "border-indigo-100 bg-white/80 hover:border-indigo-200 hover:shadow-indigo-200/40"
            }`}
          >
            <span>
              <span className="text-sm font-semibold text-indigo-700">{preset.label}</span>
              <span className="mt-1 block text-[11px] text-slate-500">{preset.notes}</span>
            </span>
            <span
              className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold ${
                preset.origin === "shared" ? "text-emerald-500 group-hover:text-emerald-600" : "text-indigo-500 group-hover:text-indigo-600"
              }`}
            >
              Use preset
              <span aria-hidden>→</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickPresetSection
