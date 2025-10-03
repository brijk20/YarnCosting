import { create } from "zustand"

const randomId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10))

export const createWeftRow = () => ({
  id: randomId(),
  name: "",
  ratio: 1,
  denier: "",
  denierUnit: "denier",
  rate: "",
  rateMode: "final",
  rateExtra: 5,
  shortage: "",
})

const getInitialState = () => ({
  qualityName: "",
  warp: {
    totalEnds: "",
    denier: "",
    denierUnit: "denier",
    rate: "",
    rateMode: "final",
    rateExtra: 5,
  },
  weftConfig: {
    picksPerInch: "",
    pannoInches: "",
    shortage: 10,
  },
  wefts: [createWeftRow()],
  additional: {
    khataKharch: 10,
  },
  pricing: {
    salePrice: "",
  },
  notes: "",
})

const normaliseNumber = (value) => {
  if (value === "" || value === null || value === undefined) return ""
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : ""
}

const useCalculatorStore = create((set, get) => ({
  ...getInitialState(),
  setQualityName: (value) => set({ qualityName: value }),
  updateWarp: (field, value) =>
    set((state) => ({
      warp: {
        ...state.warp,
        [field]: field === "denierUnit" || field === "rateMode"
          ? value
          : normaliseNumber(value),
      },
    })),
  updateWeftConfig: (field, value) =>
    set((state) => ({
      weftConfig: {
        ...state.weftConfig,
        [field]: normaliseNumber(value),
      },
    })),
  addWeft: () =>
    set((state) => ({
      wefts: [...state.wefts, createWeftRow()],
    })),
  updateWeft: (id, updates) =>
    set((state) => ({
      wefts: state.wefts.map((weft) =>
        weft.id === id
          ? {
              ...weft,
              ...Object.fromEntries(
                Object.entries(updates).map(([key, val]) => [
                  key,
                  key === "denierUnit" || key === "rateMode"
                    ? val
                    : normaliseNumber(val),
                ]),
              ),
            }
          : weft,
      ),
    })),
  removeWeft: (id) =>
    set((state) => ({
      wefts: state.wefts.length > 1 ? state.wefts.filter((w) => w.id !== id) : state.wefts,
    })),
  updateAdditional: (field, value) =>
    set((state) => ({
      additional: {
        ...state.additional,
        [field]: normaliseNumber(value),
      },
    })),
  updatePricing: (field, value) =>
    set((state) => ({
      pricing: {
        ...state.pricing,
        [field]: normaliseNumber(value),
      },
    })),
  setNotes: (value) => set({ notes: value }),
  resetCalculator: () => set(getInitialState()),
  getStateForPersistence: () => ({
    qualityName: get().qualityName,
    warp: get().warp,
    weftConfig: get().weftConfig,
    wefts: get().wefts,
    additional: get().additional,
    pricing: get().pricing,
    notes: get().notes,
  }),
  loadFromSaved: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
      wefts:
        payload?.wefts && payload.wefts.length
          ? payload.wefts.map((weft) => ({
              ...createWeftRow(),
              ...weft,
              rateMode: weft?.rateMode ?? weft?.rate_mode ?? "final",
              rateExtra: normaliseNumber(weft?.rateExtra ?? weft?.rate_extra ?? 5),
            }))
          : [createWeftRow()],
      weftConfig: {
        ...getInitialState().weftConfig,
        ...payload?.weftConfig,
      },
      warp: {
        ...getInitialState().warp,
        ...payload?.warp,
        rateMode: payload?.warp?.rateMode ?? payload?.warp?.rate_mode ?? "final",
        rateExtra: normaliseNumber(payload?.warp?.rateExtra ?? payload?.warp?.rate_extra ?? 5),
      },
      additional: {
        ...getInitialState().additional,
        ...payload?.additional,
      },
    })),
}))

export default useCalculatorStore
