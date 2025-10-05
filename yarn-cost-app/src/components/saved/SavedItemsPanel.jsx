import { useCallback, useEffect, useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useCalculatorStore from "../../store/calculatorStore"
import {
  deleteCalculation,
  deleteQuality,
  fetchCalculations,
  fetchQualities,
  mapCalculationToCalculatorState,
  mapQualityToCalculatorState,
  saveCalculation,
  saveQuality,
} from "../../lib/dataService"
import { calculateTotals, formatCurrency, formatNumber } from "../../utils/calculations"

const TabButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-1 text-sm font-medium transition ${
      active
        ? "bg-indigo-600 text-white shadow"
        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
    }`}
  >
    {children}
  </button>
)

const Badge = ({ tone, children }) => {
  const tones = {
    public: "bg-emerald-100 text-emerald-700",
    private: "bg-slate-100 text-slate-600",
    shared: "bg-indigo-100 text-indigo-700",
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

const SavedItemsPanel = () => {
  const { user, supabaseReady, loading: authLoading, isSuperAdmin } = useAuth()
  const getStateForPersistence = useCalculatorStore((s) => s.getStateForPersistence)
  const loadFromSaved = useCalculatorStore((s) => s.loadFromSaved)
  const [activeTab, setActiveTab] = useState("qualities")
  const [qualities, setQualities] = useState([])
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(false)
  const [saveBusy, setSaveBusy] = useState(null)
  const [deleteBusyId, setDeleteBusyId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [shareQualityPublic, setShareQualityPublic] = useState(false)
  const [shareCalculationPublic, setShareCalculationPublic] = useState(false)

  const allowPrivateActions = supabaseReady && Boolean(user)

  useEffect(() => {
    if (isSuperAdmin) {
      setShareQualityPublic(true)
      setShareCalculationPublic(true)
    } else {
      setShareQualityPublic(false)
      setShareCalculationPublic(false)
    }
  }, [isSuperAdmin])

  const refreshData = useCallback(async () => {
    if (!supabaseReady) return
    setLoading(true)
    setFeedback(null)
    try {
      const [{ data: qualitiesData, error: qualitiesError }, { data: calculationsData, error: calculationsError }] =
        await Promise.all([
          fetchQualities({ userId: user?.id }),
          fetchCalculations({ userId: user?.id }),
        ])

      if (qualitiesError || calculationsError) {
        throw qualitiesError ?? calculationsError
      }

      setQualities(qualitiesData ?? [])
      setCalculations(calculationsData ?? [])
    } catch (error) {
      console.error("Failed to load saved records", error)
      setFeedback({ type: "error", message: error.message ?? "Unable to load saved records" })
    } finally {
      setLoading(false)
    }
  }, [supabaseReady, user?.id])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const handleSaveQuality = async () => {
    if (!allowPrivateActions) {
      setFeedback({ type: "error", message: "Sign in to save qualities" })
      return
    }
    const snapshot = getStateForPersistence()
    const qualityName = snapshot.qualityName?.trim() || "Untitled quality"

    setSaveBusy("quality")
    setFeedback(null)
    try {
      const { error } = await saveQuality({
        userId: user.id,
        qualityName,
        payload: snapshot,
        isPublic: isSuperAdmin && shareQualityPublic,
      })
      if (error) throw error
      setFeedback({ type: "success", message: "Quality saved" })
      await refreshData()
    } catch (error) {
      console.error("Failed to save quality", error)
      setFeedback({ type: "error", message: error.message ?? "Unable to save quality" })
    } finally {
      setSaveBusy(null)
    }
  }

  const handleSaveCalculation = async () => {
    if (!allowPrivateActions) {
      setFeedback({ type: "error", message: "Sign in to save calculations" })
      return
    }
    const snapshot = getStateForPersistence()
    const totals = calculateTotals(snapshot)
    const label = snapshot.qualityName?.trim() || "Untitled calculation"

    setSaveBusy("calculation")
    setFeedback(null)
    try {
      const { error } = await saveCalculation({
        userId: user.id,
        qualityName: label,
        payload: snapshot,
        results: totals,
        isPublic: isSuperAdmin && shareCalculationPublic,
      })
      if (error) throw error
      setFeedback({ type: "success", message: "Calculation snapshot saved" })
      await refreshData()
    } catch (error) {
      console.error("Failed to save calculation", error)
      setFeedback({ type: "error", message: error.message ?? "Unable to save calculation" })
    } finally {
      setSaveBusy(null)
    }
  }

  const handleLoadQuality = (row) => {
    loadFromSaved(mapQualityToCalculatorState(row))
    setFeedback({ type: "info", message: `Loaded quality: ${row.name || "Untitled"}` })
  }

  const handleLoadCalculation = (row) => {
    loadFromSaved(mapCalculationToCalculatorState(row))
    setFeedback({ type: "info", message: `Loaded calculation from ${new Date(row.created_at).toLocaleString()}` })
  }

  const handleDelete = async (row, type) => {
    if (!allowPrivateActions || row.user_id !== user.id) return
    setDeleteBusyId(row.id)
    setFeedback(null)
    try {
      const { error } =
        type === "quality" ? await deleteQuality(row.id) : await deleteCalculation(row.id)
      if (error) throw error
      setFeedback({ type: "success", message: `${type === "quality" ? "Quality" : "Calculation"} deleted` })
      await refreshData()
    } catch (error) {
      console.error("Failed to delete saved record", error)
      setFeedback({ type: "error", message: error.message ?? "Unable to delete saved record" })
    } finally {
      setDeleteBusyId(null)
    }
  }

  const qualityList = useMemo(
    () =>
      qualities.map((row) => ({
        id: row.id,
        name: row.name || "Untitled quality",
        createdAt: row.created_at,
        owned: row.user_id === user?.id,
        isPublic: row.is_public,
        row,
      })),
    [qualities, user?.id],
  )

  const calculationList = useMemo(
    () =>
      calculations.map((row) => ({
        id: row.id,
        name: row.quality_name || "Untitled calculation",
        createdAt: row.created_at,
        owned: row.user_id === user?.id,
        isPublic: row.is_public,
        summary: row.results?.summary,
        row,
      })),
    [calculations, user?.id],
  )

  const publicQualities = useMemo(() => qualityList.filter((item) => item.isPublic), [qualityList])
  const personalQualities = useMemo(
    () => qualityList.filter((item) => !item.isPublic || item.owned),
    [qualityList],
  )

  const publicCalculations = useMemo(
    () => calculationList.filter((item) => item.isPublic),
    [calculationList],
  )
  const personalCalculations = useMemo(
    () => calculationList.filter((item) => !item.isPublic || item.owned),
    [calculationList],
  )

  const renderFeedback = () => {
    if (!feedback) return null
    const tone =
      feedback.type === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : feedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-indigo-200 bg-indigo-50 text-indigo-700"
    return (
      <div className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
        {feedback.message}
      </div>
    )
  }

  if (!supabaseReady) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
        <h2 className="text-lg font-semibold text-slate-800">Saved qualities & calculations</h2>
        <p className="mt-2 max-w-2xl">
          Supabase credentials are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable syncing
          your qualities and make them accessible across devices.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Saved qualities & calculations</h2>
          <p className="text-sm text-slate-500">
            {user
              ? "Store private records or share them with your team."
              : "Browse public templates. Sign in to save your own snapshots."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={activeTab === "qualities"} onClick={() => setActiveTab("qualities")}>
            Qualities
          </TabButton>
          <TabButton active={activeTab === "calculations"} onClick={() => setActiveTab("calculations")}>
            Calculations
          </TabButton>
        </div>
      </header>

      {renderFeedback()}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={refreshData}
          disabled={loading || authLoading}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {user && (
          <>
            <button
              type="button"
              onClick={handleSaveQuality}
              disabled={Boolean(saveBusy) || loading}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {saveBusy === "quality" ? "Saving…" : "Save as quality"}
            </button>
            {isSuperAdmin ? (
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={shareQualityPublic}
                  onChange={(event) => setShareQualityPublic(event.target.checked)}
                  className="h-3 w-3"
                />
                Share with everyone
              </label>
            ) : null}
            <button
              type="button"
              onClick={handleSaveCalculation}
              disabled={Boolean(saveBusy) || loading}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saveBusy === "calculation" ? "Saving…" : "Save calculation"}
            </button>
            {isSuperAdmin ? (
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={shareCalculationPublic}
                  onChange={(event) => setShareCalculationPublic(event.target.checked)}
                  className="h-3 w-3"
                />
                Share with everyone
              </label>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-6">
        {activeTab === "qualities" ? (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public library</h3>
              {publicQualities.length === 0 && !loading ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Once a super admin publishes templates, they will appear here.
                </p>
              ) : (
                publicQualities.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="min-w-[220px] flex-1">
                      <p className="text-sm font-semibold text-emerald-800">{item.name}</p>
                      <p className="text-xs text-emerald-600">Updated {new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone="public">Shared with everyone</Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleLoadQuality(item.row)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Load
                      </button>
                      {item.owned && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.row, "quality")}
                          disabled={deleteBusyId === item.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deleteBusyId === item.id ? "Deleting" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">My qualities</h3>
              {personalQualities.length === 0 && !loading ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No private qualities yet.
                </p>
              ) : (
                personalQualities.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="min-w-[220px] flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">Saved {new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {item.isPublic ? <Badge tone="public">Public</Badge> : <Badge tone="private">Private</Badge>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleLoadQuality(item.row)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Load
                      </button>
                      {item.owned && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.row, "quality")}
                          disabled={deleteBusyId === item.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deleteBusyId === item.id ? "Deleting" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public snapshots</h3>
              {publicCalculations.length === 0 && !loading ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Saved calculations published by a super admin will appear here.
                </p>
              ) : (
                publicCalculations.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="min-w-[240px] flex-1">
                      <p className="text-sm font-semibold text-emerald-800">{item.name}</p>
                      <p className="text-xs text-emerald-600">Captured {new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-2 grid gap-1 text-xs text-emerald-700 sm:grid-cols-2">
                        <span>Cost/m: {formatCurrency(item.summary?.costBeforeGst ?? 0)}</span>
                        <span>Total with GST: {formatCurrency(item.summary?.totalWithGst ?? 0)}</span>
                        <span>Profit/m: {formatCurrency(item.summary?.profitPerMeter ?? 0)}</span>
                        <span>Margin: {formatNumber(item.summary?.marginPercent ?? 0, 1)}%</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone="public">Shared with everyone</Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleLoadCalculation(item.row)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Load
                      </button>
                      {item.owned && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.row, "calculation")}
                          disabled={deleteBusyId === item.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deleteBusyId === item.id ? "Deleting" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">My snapshots</h3>
              {personalCalculations.length === 0 && !loading ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Save a calculation to see it here.
                </p>
              ) : (
                personalCalculations.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="min-w-[240px] flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">Captured {new Date(item.createdAt).toLocaleString()}</p>
                      <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                        <span>Cost/m: {formatCurrency(item.summary?.costBeforeGst ?? 0)}</span>
                        <span>Total with GST: {formatCurrency(item.summary?.totalWithGst ?? 0)}</span>
                        <span>Profit/m: {formatCurrency(item.summary?.profitPerMeter ?? 0)}</span>
                        <span>Margin: {formatNumber(item.summary?.marginPercent ?? 0, 1)}%</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {item.isPublic ? <Badge tone="public">Public</Badge> : <Badge tone="private">Private</Badge>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleLoadCalculation(item.row)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Load
                      </button>
                      {item.owned && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.row, "calculation")}
                          disabled={deleteBusyId === item.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deleteBusyId === item.id ? "Deleting" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SavedItemsPanel
