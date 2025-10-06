const STORAGE_KEY = "yarn-costing:presets:v1"

const safeParse = (payload) => {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

const normalisePreset = (preset) => {
  if (!preset) return null
  return {
    id: preset.id,
    name: preset.name ?? "Untitled preset",
    notes: preset.notes ?? "",
    createdAt: preset.createdAt ?? preset.created_at ?? new Date().toISOString(),
    updatedAt: preset.updatedAt ?? preset.updated_at ?? new Date().toISOString(),
    payload: preset.payload ?? preset.inputs ?? {},
  }
}

const readStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return []
  }
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  const parsed = safeParse(stored)
  if (!Array.isArray(parsed)) return []
  return parsed
    .map(normalisePreset)
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

const writeStorage = (presets) => {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
    window.dispatchEvent(new Event("yarn-presets:updated"))
  } catch (error) {
    console.warn("Unable to persist presets", error)
  }
}

export const loadPresets = () => readStorage()

export const upsertPreset = ({ id, name, notes = "", payload }) => {
  const presets = readStorage()
  const now = new Date().toISOString()
  if (id) {
    const index = presets.findIndex((preset) => preset.id === id)
    if (index >= 0) {
      presets[index] = {
        ...presets[index],
        name: name?.trim() || presets[index].name || "Untitled preset",
        notes: notes ?? presets[index].notes ?? "",
        payload: payload ?? presets[index].payload,
        updatedAt: now,
      }
      writeStorage(presets)
      return presets[index]
    }
  }

  const preset = {
    id: id ?? generatePresetId(),
    name: name?.trim() || "Untitled preset",
    notes: notes ?? "",
    payload: payload ?? {},
    createdAt: now,
    updatedAt: now,
  }
  presets.unshift(preset)
  writeStorage(presets)
  return preset
}

export const deletePreset = (id) => {
  const presets = readStorage().filter((preset) => preset.id !== id)
  writeStorage(presets)
  return presets
}

export const generatePresetId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `preset_${Math.random().toString(36).slice(2, 10)}`
