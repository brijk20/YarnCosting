import { useEffect, useMemo, useState } from "react"
import useCalculatorStore from "../../store/calculatorStore"
import Card, { CardSection } from "../ui/Card"
import Button from "../ui/Button"
import { deletePreset, loadPresets, upsertPreset } from "../../lib/presetStorage"

const PresetManager = () => {
  const getStateForPersistence = useCalculatorStore((state) => state.getStateForPersistence)
  const loadFromSaved = useCalculatorStore((state) => state.loadFromSaved)
  const qualityName = useCalculatorStore((state) => state.qualityName)

  const [presets, setPresets] = useState(() => loadPresets())
  const [name, setName] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")

  const orderedPresets = useMemo(
    () => presets.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [presets],
  )

  useEffect(() => {
    if (qualityName && !name) {
      setName(qualityName)
    }
  }, [qualityName, name])

  useEffect(() => {
    const handler = () => setPresets(loadPresets())
    window.addEventListener("yarn-presets:updated", handler)
    return () => window.removeEventListener("yarn-presets:updated", handler)
  }, [])

  const refresh = () => {
    setPresets(loadPresets())
  }

  const handleSaveNew = () => {
    const snapshot = getStateForPersistence()
    const presetName = name.trim() || qualityName.trim() || "Untitled preset"
    setBusyId("new")
    setFeedback(null)
    upsertPreset({ name: presetName, payload: snapshot })
    refresh()
    setFeedback({ type: "success", message: `Saved preset: ${presetName}` })
    setBusyId(null)
  }

  const handleOverwrite = (preset) => {
    const snapshot = getStateForPersistence()
    setBusyId(preset.id)
    setFeedback(null)
    upsertPreset({ id: preset.id, name: preset.name, payload: snapshot })
    refresh()
    setFeedback({ type: "success", message: `Updated ${preset.name}` })
    setBusyId(null)
  }

  const handleUse = (preset) => {
    loadFromSaved(preset.payload)
    setFeedback({ type: "info", message: `Loaded preset: ${preset.name}` })
  }

  const handleDelete = (preset) => {
    setBusyId(preset.id)
    setFeedback(null)
    deletePreset(preset.id)
    refresh()
    setBusyId(null)
    setFeedback({ type: "success", message: `Deleted ${preset.name}` })
  }

  const startRename = (preset) => {
    setEditingId(preset.id)
    setEditingName(preset.name)
  }

  const commitRename = (preset) => {
    const nextName = editingName.trim()
    if (!nextName) {
      setFeedback({ type: "danger", message: "Name cannot be empty." })
      return
    }
    upsertPreset({ id: preset.id, name: nextName, payload: preset.payload })
    refresh()
    setEditingId(null)
    setEditingName("")
    setFeedback({ type: "success", message: `Renamed preset to ${nextName}` })
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingName("")
  }

  return (
    <Card>
      <CardSection
        title="Saved presets"
        description="Store costing states locally, reuse them in a click, and overwrite when yarn rates change."
      />

      {feedback ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : feedback.type === "info"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1 text-xs font-semibold text-slate-600">
          Preset name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Chanderi 63 fresh"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
          />
        </label>
        <Button type="button" onClick={handleSaveNew} disabled={busyId === "new"}>
          {busyId === "new" ? "Saving…" : "Save new preset"}
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {!orderedPresets.length ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No presets yet. Save the current costing state to build your library.
          </p>
        ) : (
          orderedPresets.map((preset) => (
            <div key={preset.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                {editingId === preset.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-900 focus:outline-none"
                    />
                    <div className="flex gap-2 text-sm">
                      <Button type="button" variant="primary" onClick={() => commitRename(preset)}>
                        Save name
                      </Button>
                      <Button type="button" variant="ghost" onClick={cancelRename}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-800">{preset.name}</p>
                    <p className="text-[11px] text-slate-500">Updated {new Date(preset.updatedAt).toLocaleString("en-IN")}</p>
                  </>
                )}
              </div>
              {editingId !== preset.id ? (
                <div className="flex flex-wrap gap-2 text-sm">
                  <Button type="button" variant="primary" onClick={() => handleUse(preset)}>
                    Use
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => handleOverwrite(preset)} disabled={busyId === preset.id}>
                    {busyId === preset.id ? "Saving…" : "Overwrite"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => startRename(preset)}>
                    Rename
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleDelete(preset)} disabled={busyId === preset.id}>
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default PresetManager
