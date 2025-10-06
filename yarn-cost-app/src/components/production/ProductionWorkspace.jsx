import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import useOperationsStore, { computeProductionSummary } from "../../store/operationsStore"
import Card, { CardHeader, CardSection } from "../ui/Card"
import Button from "../ui/Button"
import Badge from "../ui/Badge"

const runColumns = [
  { id: "date", label: "Date" },
  { id: "machine", label: "Machine" },
  { id: "quality", label: "Quality" },
  { id: "shift", label: "Shift" },
  { id: "meters", label: "Meters" },
  { id: "efficiency", label: "Efficiency" },
  { id: "accuracy", label: "Accuracy" },
  { id: "dpm", label: "DPM" },
  { id: "operator", label: "Operator" },
  { id: "yarnBrand", label: "Yarn brand" },
  { id: "yarnSupplier", label: "Yarn supplier" },
  { id: "yarnRate", label: "Yarn rate" },
  { id: "notes", label: "Notes" },
]

const ProductionWorkspace = () => {
  const { user } = useAuth()
  const machines = useOperationsStore((state) => state.machines)
  const workers = useOperationsStore((state) => state.workers)
  const machineRuns = useOperationsStore((state) => state.machineRuns)
  const upsertMachine = useOperationsStore((state) => state.upsertMachine)
  const upsertWorker = useOperationsStore((state) => state.upsertWorker)
  const logMachineRun = useOperationsStore((state) => state.logMachineRun)

  const [machineForm, setMachineForm] = useState({ name: "", loomType: "airjet", reedWidthInch: "", rpmTarget: "", shiftPattern: "12h", remarks: "" })
  const [workerForm, setWorkerForm] = useState({ name: "", skillLevel: "", contact: "" })
  const [runForm, setRunForm] = useState({ machineId: "", workerId: "", quality: "", yarnBrand: "", yarnSupplier: "", yarnRate: "", shiftDate: new Date().toISOString().slice(0, 10), shiftType: "12h", metersProduced: "", efficiency: "", accuracy: "", defectsPerMillion: "", notes: "" })
  const [runQuery, setRunQuery] = useState("")
  const [machineFilter, setMachineFilter] = useState("all")
  const [workerFilter, setWorkerFilter] = useState("all")
  const [visibleRunColumns, setVisibleRunColumns] = useState(runColumns.map((column) => column.id))

  const [feedback, setFeedback] = useState(null)
  const [machineBusy, setMachineBusy] = useState(false)
  const [workerBusy, setWorkerBusy] = useState(false)
  const [runBusy, setRunBusy] = useState(false)

  const handleMachineChange = (field) => (event) => setMachineForm((prev) => ({ ...prev, [field]: event.target.value }))
  const handleWorkerChange = (field) => (event) => setWorkerForm((prev) => ({ ...prev, [field]: event.target.value }))
  const handleRunChange = (field) => (event) => setRunForm((prev) => ({ ...prev, [field]: event.target.value }))

  const machineOptions = useMemo(
    () =>
      machines
        .map((machine) => ({
          value: machine.id != null ? String(machine.id) : "",
          label: machine.loomType ? `${machine.name} · ${machine.loomType}` : machine.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [machines],
  )
  const workerOptions = useMemo(
    () =>
      workers
        .map((worker) => ({ value: worker.id != null ? String(worker.id) : "", label: worker.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [workers],
  )

  const filteredRuns = useMemo(() => {
    const needle = runQuery.trim().toLowerCase()
    return machineRuns.filter((run) => {
      if (machineFilter !== "all" && String(run.machineId ?? "") !== machineFilter) return false
      if (workerFilter !== "all" && String(run.workerId ?? "") !== workerFilter) return false
      if (!needle) return true
      return [run.quality, run.notes, run.yarnBrand, run.yarnSupplier, run.machine?.name, run.worker?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    })
  }, [machineRuns, runQuery, machineFilter, workerFilter])

  const summary = useMemo(() => computeProductionSummary(filteredRuns), [filteredRuns])

  const toggleRunColumn = (columnId) => {
    setVisibleRunColumns((prev) =>
      prev.includes(columnId) ? prev.filter((column) => column !== columnId) : [...prev, columnId],
    )
  }

  const submitMachine = async (event) => {
    event.preventDefault()
    setMachineBusy(true)
    setFeedback(null)
    try {
      await upsertMachine({ payload: { ...machineForm } })
      setFeedback({ type: "success", message: "Machine saved." })
      setMachineForm({ name: "", loomType: "airjet", reedWidthInch: "", rpmTarget: "", shiftPattern: "12h", remarks: "" })
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Unable to save machine" })
    } finally {
      setMachineBusy(false)
    }
  }

  const submitWorker = async (event) => {
    event.preventDefault()
    setWorkerBusy(true)
    setFeedback(null)
    try {
      await upsertWorker({ payload: { ...workerForm } })
      setFeedback({ type: "success", message: "Worker saved." })
      setWorkerForm({ name: "", skillLevel: "", contact: "" })
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Unable to save worker" })
    } finally {
      setWorkerBusy(false)
    }
  }

  const submitRun = async (event) => {
    event.preventDefault()
    setRunBusy(true)
    setFeedback(null)
    try {
      await logMachineRun({ payload: { ...runForm } })
      setFeedback({ type: "success", message: "Production run logged." })
      setRunForm({ machineId: "", workerId: "", quality: "", yarnBrand: "", yarnSupplier: "", yarnRate: "", shiftDate: new Date().toISOString().slice(0, 10), shiftType: "12h", metersProduced: "", efficiency: "", accuracy: "", defectsPerMillion: "", notes: "" })
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Unable to log run" })
    } finally {
      setRunBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader
          eyebrow="Loom & shift governance"
          title="Production command centre"
          subtitle="Maintain a single source of truth for machine cadence, operator assignments, and shift output."
          actions={[<Badge key="sync" tone="indigo">Supabase sync active</Badge>]}
        />
        {!user ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Sign in to sync production data so costing & finance stay aligned.
          </div>
        ) : null}
        {feedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="default">
          <CardSection title="Register machine" description="Capture loom specs to benchmark planned vs actual picks per minute.">
            <form onSubmit={submitMachine} className="grid gap-4">
              <InputField label="Machine name / code" value={machineForm.name} onChange={handleMachineChange("name")} placeholder="AJL-01" required />
              <SelectField
                label="Loom type"
                value={machineForm.loomType}
                onChange={handleMachineChange("loomType")}
                options={[
                  { label: "Airjet", value: "airjet" },
                  { label: "Waterjet", value: "waterjet" },
                  { label: "Rapier", value: "rapier" },
                ]}
              />
              <InputField label="Reed width (inch)" value={machineForm.reedWidthInch} onChange={handleMachineChange("reedWidthInch")} type="number" step="0.1" placeholder="73" />
              <InputField label="Target RPM" value={machineForm.rpmTarget} onChange={handleMachineChange("rpmTarget")} type="number" placeholder="820" />
              <SelectField
                label="Shift pattern"
                value={machineForm.shiftPattern}
                onChange={handleMachineChange("shiftPattern")}
                options={[
                  { label: "12 hour", value: "12h" },
                  { label: "24 hour", value: "24h" },
                  { label: "Continuous (3 shift)", value: "continuous" },
                ]}
              />
              <InputField label="Remarks" value={machineForm.remarks} onChange={handleMachineChange("remarks")} placeholder="Humidity set to 60%" />
              <Button type="submit" disabled={machineBusy}>
                {machineBusy ? "Saving…" : "Save machine"}
              </Button>
            </form>
          </CardSection>
        </Card>

        <Card tone="default">
          <CardSection title="Operator roster" description="Maintain contact details and skill levels for loom operators and helpers.">
            <form onSubmit={submitWorker} className="grid gap-4">
              <InputField label="Worker name" value={workerForm.name} onChange={handleWorkerChange("name")} placeholder="Ravi Patel" required />
              <InputField label="Skill level / role" value={workerForm.skillLevel} onChange={handleWorkerChange("skillLevel")} placeholder="Senior airjet operator" />
              <InputField label="Contact" value={workerForm.contact} onChange={handleWorkerChange("contact")} placeholder="98765 43210" />
              <Button type="submit" variant="secondary" disabled={workerBusy}>
                {workerBusy ? "Saving…" : "Save worker"}
              </Button>
            </form>
          </CardSection>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="muted">
          <CardSection title={`Machine roster (${machines.length})`} description="Snapshot of loom configurations for quick assignments.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Reed (in)</th>
                    <th className="px-3 py-2">RPM</th>
                    <th className="px-3 py-2">Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine.id} className="border-t border-slate-100 text-slate-700">
                      <td className="px-3 py-2 font-semibold">{machine.name}</td>
                      <td className="px-3 py-2 capitalize">{machine.loomType}</td>
                      <td className="px-3 py-2">{machine.reedWidthInch ? machine.reedWidthInch.toLocaleString("en-IN", { maximumFractionDigits: 1 }) : "-"}</td>
                      <td className="px-3 py-2">{machine.rpmTarget ? machine.rpmTarget.toLocaleString("en-IN") : "-"}</td>
                      <td className="px-3 py-2">{machine.shiftPattern}</td>
                    </tr>
                  ))}
                  {!machines.length ? (
                    <tr>
                      <td className="px-3 py-4 text-center text-slate-400" colSpan={5}>
                        Register your first loom to unlock production logging.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardSection>
        </Card>

        <Card tone="muted">
          <CardSection title={`Worker roster (${workers.length})`} description="Operator directory for shift planning.">
            <div className="space-y-3">
              {workers.map((worker) => (
                <div key={worker.id} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600">
                  <p className="text-sm font-semibold text-slate-800">{worker.name}</p>
                  <p>{worker.skillLevel || "Role not specified"}</p>
                  {worker.contact ? <p className="text-[11px] text-slate-500">{worker.contact}</p> : null}
                </div>
              ))}
              {!workers.length ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-center text-xs text-slate-500">
                  Add your first operator to start tracking assignments.
                </p>
              ) : null}
            </div>
          </CardSection>
        </Card>
      </div>

      <Card tone="default">
        <CardSection
          title="Log production run"
          description="Daily shift entry to reconcile metres with power & yarn consumption."
          actions={[
            <Badge key="meters" tone="indigo">Total metres: {summary.totalMeters.toLocaleString("en-IN")}</Badge>,
            <Badge key="efficiency" tone="emerald">Avg efficiency: {summary.avgEfficiency.toFixed(1)}%</Badge>,
            <Badge key="accuracy" tone="amber">Avg accuracy: {summary.avgAccuracy.toFixed(1)}%</Badge>,
          ]}
        />
        <form onSubmit={submitRun} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Machine"
            value={runForm.machineId}
            onChange={handleRunChange("machineId")}
            required
            options={[{ label: "Select machine…", value: "" }, ...machineOptions]}
          />
          <SelectField
            label="Worker"
            value={runForm.workerId}
            onChange={handleRunChange("workerId")}
            options={[{ label: "Assign operator…", value: "" }, ...workerOptions]}
          />
          <InputField label="Quality" value={runForm.quality} onChange={handleRunChange("quality")} placeholder="Quality woven" />
          <InputField label="Yarn brand" value={runForm.yarnBrand} onChange={handleRunChange("yarnBrand")} placeholder="e.g. Vardhman" />
          <InputField label="Yarn supplier" value={runForm.yarnSupplier} onChange={handleRunChange("yarnSupplier")} placeholder="Supplier name" />
          <InputField label="Yarn rate (₹/kg)" type="number" step="0.01" value={runForm.yarnRate} onChange={handleRunChange("yarnRate")} placeholder="275" />
          <InputField label="Shift date" type="date" value={runForm.shiftDate} onChange={handleRunChange("shiftDate")} required />
          <SelectField
            label="Shift type"
            value={runForm.shiftType}
            onChange={handleRunChange("shiftType")}
            options={[{ label: "12 hour", value: "12h" }, { label: "24 hour", value: "24h" }, { label: "3 shift", value: "continuous" }]}
          />
          <InputField label="Meters produced" type="number" step="0.1" value={runForm.metersProduced} onChange={handleRunChange("metersProduced")} placeholder="850" required />
          <InputField label="Efficiency (%)" type="number" step="0.1" value={runForm.efficiency} onChange={handleRunChange("efficiency")} placeholder="88" />
          <InputField label="Accuracy (%)" type="number" step="0.1" value={runForm.accuracy} onChange={handleRunChange("accuracy")} placeholder="96" />
          <InputField label="Defects per million" type="number" step="0.1" value={runForm.defectsPerMillion} onChange={handleRunChange("defectsPerMillion")} placeholder="12" />
          <InputField label="Notes" value={runForm.notes} onChange={handleRunChange("notes")} placeholder="Eg. Water pressure drop from 3pm" className="xl:col-span-2" />
          <div className="xl:col-span-1">
            <Button type="submit" disabled={runBusy} className="w-full">
              {runBusy ? "Logging…" : "Log shift"}
            </Button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <input
                type="search"
                placeholder="Search quality, notes, or yarn"
                value={runQuery}
                onChange={(event) => setRunQuery(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <select
                value={machineFilter}
                onChange={(event) => setMachineFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="all">All machines</option>
                {machineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={workerFilter}
                onChange={(event) => setWorkerFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="all">All operators</option>
                {workerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500">{filteredRuns.length} shifts</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {runColumns.map((column) => (
              <label key={column.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleRunColumns.includes(column.id)}
                  onChange={() => toggleRunColumn(column.id)}
                />
                {column.label}
              </label>
            ))}
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  {runColumns
                    .filter((column) => visibleRunColumns.includes(column.id))
                    .map((column) => (
                      <th key={column.id} className="px-4 py-3">
                        {column.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100 text-slate-700">
                    {visibleRunColumns.includes("date") ? (
                      <td className="px-4 py-3">{new Date(run.shiftDate).toLocaleDateString("en-IN")}</td>
                    ) : null}
                    {visibleRunColumns.includes("machine") ? (
                      <td className="px-4 py-3">{run.machine?.name ?? "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("quality") ? (
                      <td className="px-4 py-3">{run.quality || "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("shift") ? <td className="px-4 py-3">{run.shiftType}</td> : null}
                    {visibleRunColumns.includes("meters") ? (
                      <td className="px-4 py-3">{run.metersProduced?.toLocaleString("en-IN") || "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("efficiency") ? (
                      <td className="px-4 py-3">{run.efficiency ? `${run.efficiency}%` : "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("accuracy") ? (
                      <td className="px-4 py-3">{run.accuracy ? `${run.accuracy}%` : "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("dpm") ? (
                      <td className="px-4 py-3">{run.defectsPerMillion || "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("operator") ? (
                      <td className="px-4 py-3">{run.worker?.name ?? "Unassigned"}</td>
                    ) : null}
                    {visibleRunColumns.includes("yarnBrand") ? (
                      <td className="px-4 py-3">{run.yarnBrand || "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("yarnSupplier") ? (
                      <td className="px-4 py-3">{run.yarnSupplier || "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("yarnRate") ? (
                      <td className="px-4 py-3">{run.yarnRate ? currency(run.yarnRate) : "-"}</td>
                    ) : null}
                    {visibleRunColumns.includes("notes") ? (
                      <td className="px-4 py-3 text-xs text-slate-500">{run.notes || "-"}</td>
                    ) : null}
                  </tr>
                ))}
                {!filteredRuns.length ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={visibleRunColumns.length}>
                      Adjust filters or log your first shift to see data here.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

const InputField = ({ label, className = "", ...props }) => (
  <label className={`flex flex-col gap-1 text-xs font-semibold text-slate-600 ${className}`}>
    {label}
    <input
      {...props}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
    />
  </label>
)

const SelectField = ({ label, options = [], className = "", ...props }) => (
  <label className={`flex flex-col gap-1 text-xs font-semibold text-slate-600 ${className}`}>
    {label}
    <select
      {...props}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring"
    >
      {options.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default ProductionWorkspace
