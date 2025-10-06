const STORAGE_KEY = "yarn-costing:operations:v1"

const blankState = {
  sales: [],
  payments: [],
  purchases: [],
  machines: [],
  machineRuns: [],
  workers: [],
}

const safeParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const loadLocalOperations = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...blankState }
  }

  const cached = window.localStorage.getItem(STORAGE_KEY)
  if (!cached) {
    return { ...blankState }
  }

  const parsed = safeParse(cached)
  if (!parsed || typeof parsed !== "object") {
    return { ...blankState }
  }

  return {
    ...blankState,
    ...parsed,
    sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
    machines: Array.isArray(parsed.machines) ? parsed.machines : [],
    machineRuns: Array.isArray(parsed.machineRuns) ? parsed.machineRuns : [],
    workers: Array.isArray(parsed.workers) ? parsed.workers : [],
  }
}

export const persistLocalOperations = (state) => {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }

  const payload = {
    sales: state.sales ?? [],
    payments: state.payments ?? [],
    purchases: state.purchases ?? [],
    machines: state.machines ?? [],
    machineRuns: state.machineRuns ?? [],
    workers: state.workers ?? [],
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn("Unable to persist operations locally", error)
  }
}

export const clearLocalOperations = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export const generateLocalId = (prefix) => {
  const base = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return prefix ? `${prefix}_${base}` : base
}
