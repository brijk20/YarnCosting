import { create } from "zustand"
import { isSupabaseConfigured } from "../lib/supabaseClient"
import { generateLocalId, loadLocalOperations, persistLocalOperations } from "../lib/localOperations"
import {
  createPayment,
  createPurchase,
  createSale,
  fetchMachines,
  fetchMachineRuns,
  fetchPayments,
  fetchPurchases,
  fetchSales,
  fetchWorkers,
  logMachineRun,
  updateSale,
  upsertMachine,
  upsertWorker,
} from "../lib/operationsService"

const MONTHLY_INTEREST_RATE = 0.015
const CREDIT_DAYS = 90
const MS_PER_DAY = 1000 * 60 * 60 * 24

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normaliseDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const calculateDueDate = (isoDate) => {
  const base = normaliseDate(isoDate)
  if (!base) return isoDate
  const clone = new Date(base)
  clone.setDate(clone.getDate() + CREDIT_DAYS)
  return clone.toISOString().slice(0, 10)
}

const daysBetween = (from, to) => {
  const start = normaliseDate(from)
  const end = normaliseDate(to)
  if (!start || !end) return 0
  return Math.floor((end - start) / MS_PER_DAY)
}

const computeAdditionalInterest = (sale, referenceDate = new Date()) => {
  if (!sale || sale.balance <= 0) return 0

  const dueDate = normaliseDate(sale.dueDate)
  const reference = normaliseDate(referenceDate)
  if (!dueDate || !reference || reference <= dueDate) return 0

  const lastComputed = normaliseDate(sale.lastInterestComputed)
  const start = lastComputed && lastComputed > dueDate ? lastComputed : dueDate
  if (reference <= start) return 0

  const days = Math.floor((reference - start) / MS_PER_DAY)
  if (days < 30) return 0

  const months = Math.floor(days / 30)
  return sale.balance * MONTHLY_INTEREST_RATE * months
}

const accrueInterestToDate = (sale, referenceDate = new Date()) => {
  const extra = computeAdditionalInterest(sale, referenceDate)
  if (extra <= 0) return 0

  const dueDate = normaliseDate(sale.dueDate)
  const lastComputed = normaliseDate(sale.lastInterestComputed)
  const start = lastComputed && lastComputed > (dueDate ?? lastComputed) ? lastComputed : dueDate
  const reference = normaliseDate(referenceDate) || new Date()

  const days = Math.floor((reference - (start || reference)) / MS_PER_DAY)
  const months = Math.max(0, Math.floor(days / 30))

  sale.interestAccrued = (sale.interestAccrued ?? 0) + extra
  const advanced = new Date((start || reference).getTime() + months * 30 * MS_PER_DAY)
  sale.lastInterestComputed = advanced.toISOString()

  return extra
}

const calculateInterestDue = (sale, referenceDate = new Date()) => {
  const accrued = sale?.interestAccrued ?? 0
  const extra = computeAdditionalInterest(sale, referenceDate)
  return accrued + extra
}

const buildSaleDraft = ({
  party,
  saleDate,
  amount,
  description,
  gstRate = 0,
  gstTreatment = "intrastate",
  gstInclusive = false,
  costOfSale = 0,
  quality = "",
  invoiceReference = "",
}) => {
  const saleAmount = toNumber(amount)
  if (!party || !saleDate || saleAmount <= 0) {
    throw new Error("Invalid sale parameters")
  }

  const rate = toNumber(gstRate)
  const taxable = gstInclusive ? saleAmount / (1 + rate / 100) : saleAmount
  const gst = taxable * (rate / 100)
  const total = gstInclusive ? saleAmount : taxable + gst
  const dueDate = calculateDueDate(saleDate)
  const cgst = gstTreatment === "intrastate" ? gst / 2 : 0
  const sgst = gstTreatment === "intrastate" ? gst / 2 : 0
  const igst = gstTreatment === "interstate" ? gst : 0

  return {
    id: null,
    party,
    quality,
    saleDate,
    invoiceReference,
    amount: Number(total.toFixed(2)),
    description: description ?? "",
    dueDate,
    paidAmount: 0,
    balance: Number(total.toFixed(2)),
    status: "pending",
    interestAccrued: 0,
    lastInterestComputed: null,
    gstRate: rate,
    gstTreatment,
    gstInclusive,
    taxableValue: Number(taxable.toFixed(2)),
    gstAmount: Number(gst.toFixed(2)),
    cgstAmount: Number(cgst.toFixed(2)),
    sgstAmount: Number(sgst.toFixed(2)),
    igstAmount: Number(igst.toFixed(2)),
    costOfSale: Number(toNumber(costOfSale).toFixed(2)),
  }
}


const buildPurchaseDraft = ({
  supplier,
  yarnBrand,
  yarnCount,
  yarnType,
  ratePerKg = 0,
  quantityKg = 0,
  purchaseDate,
  notes = "",
}) => {
  if (!supplier || !purchaseDate) {
    throw new Error("Supplier and purchase date are required")
  }

  const rate = toNumber(ratePerKg)
  const quantity = toNumber(quantityKg)
  const amount = rate > 0 && quantity > 0 ? Number((rate * quantity).toFixed(2)) : 0

  return {
    id: null,
    supplier,
    yarnBrand: yarnBrand ?? "",
    yarnCount: yarnCount ?? "",
    yarnType: yarnType ?? "",
    ratePerKg: rate,
    quantityKg: quantity,
    amount,
    purchaseDate,
    notes,
  }
}

const mapPurchaseFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  supplier: row.supplier,
  yarnBrand: row.yarn_brand ?? "",
  yarnCount: row.yarn_count ?? "",
  yarnType: row.yarn_type ?? "",
  ratePerKg: toNumber(row.rate_per_kg),
  quantityKg: toNumber(row.quantity_kg),
  amount: toNumber(row.amount),
  purchaseDate: row.purchase_date,
  notes: row.notes ?? "",
})

const mapSaleFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  party: row.party,
  quality: row.quality ?? "",
  saleDate: row.sale_date,
  invoiceReference: row.invoice_reference ?? "",
  amount: toNumber(row.amount),
  description: row.description ?? "",
  dueDate: row.due_date ?? calculateDueDate(row.sale_date),
  paidAmount: toNumber(row.paid_amount),
  balance: toNumber(row.balance, toNumber(row.amount)),
  status: row.status ?? "pending",
  interestAccrued: toNumber(row.interest_accrued),
  lastInterestComputed: row.last_interest_computed,
  gstRate: toNumber(row.gst_rate),
  gstTreatment: row.gst_treatment ?? "intrastate",
  gstInclusive: Boolean(row.gst_inclusive),
  taxableValue: toNumber(row.taxable_value, toNumber(row.amount)),
  gstAmount: toNumber(row.gst_amount),
  cgstAmount: toNumber(row.cgst_amount),
  sgstAmount: toNumber(row.sgst_amount),
  igstAmount: toNumber(row.igst_amount),
  costOfSale: toNumber(row.cost_of_sale),
})

const serialiseSaleForInsert = (sale) => ({
  party: sale.party,
  quality: sale.quality,
  sale_date: sale.saleDate,
  invoice_reference: sale.invoiceReference,
  amount: sale.amount,
  description: sale.description,
  due_date: sale.dueDate,
  paid_amount: sale.paidAmount,
  balance: sale.balance,
  status: sale.status,
  interest_accrued: sale.interestAccrued,
  last_interest_computed: sale.lastInterestComputed,
  gst_rate: sale.gstRate,
  gst_treatment: sale.gstTreatment,
  gst_inclusive: sale.gstInclusive,
  taxable_value: sale.taxableValue,
  gst_amount: sale.gstAmount,
  cgst_amount: sale.cgstAmount,
  sgst_amount: sale.sgstAmount,
  igst_amount: sale.igstAmount,
  cost_of_sale: sale.costOfSale,
})

const serialiseSaleForUpdate = (sale) => ({
  paid_amount: sale.paidAmount,
  balance: sale.balance,
  status: sale.status,
  interest_accrued: sale.interestAccrued,
  last_interest_computed: sale.lastInterestComputed,
})

const mapPaymentFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  party: row.party,
  paymentDate: row.payment_date,
  amount: toNumber(row.amount),
  mode: row.mode ?? "online",
  reference: row.reference ?? "",
  appliedTo: row.applied_to ?? [],
  notes: row.notes ?? "",
})

const serialisePaymentForInsert = (payment) => ({
  party: payment.party,
  payment_date: payment.paymentDate,
  amount: payment.amount,
  mode: payment.mode,
  reference: payment.reference,
  applied_to: payment.appliedTo,
  notes: payment.notes,
})

const mapWorkerFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  skillLevel: row.skill_level ?? "",
  contact: row.contact ?? "",
})

const mapMachineFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  loomType: row.loom_type ?? "airjet",
  reedWidthInch: toNumber(row.reed_width_inch),
  rpmTarget: toNumber(row.rpm_target),
  shiftPattern: row.shift_pattern ?? "12h",
  remarks: row.remarks ?? "",
})

const mapRunFromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  machineId: row.machine_id,
  quality: row.quality,
  shiftDate: row.shift_date,
  shiftType: row.shift_type,
  metersProduced: toNumber(row.meters_produced),
  efficiency: toNumber(row.efficiency),
  accuracy: toNumber(row.accuracy),
  defectsPerMillion: toNumber(row.defects_per_million),
  workerId: row.worker_id,
  yarnBrand: row.yarn_brand ?? "",
  yarnSupplier: row.yarn_supplier ?? "",
  yarnRate: toNumber(row.yarn_rate),
  notes: row.notes ?? "",
  machine: row.machine ?? null,
  worker: row.worker ?? null,
})

const initialState = {
  sales: [],
  payments: [],
  purchases: [],
  machines: [],
  machineRuns: [],
  workers: [],
  loading: false,
  error: null,
  lastSyncedAt: null,
  activeUserId: null,
  mode: isSupabaseConfigured ? "cloud" : "offline",
}

const startingState = isSupabaseConfigured
  ? initialState
  : {
      ...initialState,
      ...loadLocalOperations(),
      mode: "offline",
    }

const useOperationsStore = create((set, get) => ({
  ...startingState,
  reset: () => {
    if (!isSupabaseConfigured || !get().activeUserId) {
      const local = loadLocalOperations()
      set({
        ...initialState,
        ...local,
        loading: false,
        error: null,
        activeUserId: null,
        lastSyncedAt: null,
        mode: "offline",
      })
      return
    }
    set({ ...initialState, mode: "cloud" })
  },

  hydrate: async ({ userId } = {}) => {
    if (!isSupabaseConfigured || !userId) {
      const local = loadLocalOperations()
      set({
        ...initialState,
        ...local,
        loading: false,
        error: null,
        activeUserId: null,
        lastSyncedAt: null,
        mode: "offline",
      })
      return
    }
    set({ loading: true, error: null, activeUserId: userId, mode: "cloud" })
    try {
      const [salesRes, paymentsRes, purchasesRes, machinesRes, runsRes, workersRes] = await Promise.all([
        fetchSales({ userId }),
        fetchPayments({ userId }),
        fetchPurchases({ userId }),
        fetchMachines({ userId }),
        fetchMachineRuns({ userId }),
        fetchWorkers({ userId }),
      ])

      const possibleError =
        salesRes.error || paymentsRes.error || purchasesRes.error || machinesRes.error || runsRes.error || workersRes.error

      if (possibleError) {
        throw possibleError
      }

      set({
        sales: (salesRes.data ?? []).map(mapSaleFromRow),
        payments: (paymentsRes.data ?? []).map(mapPaymentFromRow),
        purchases: (purchasesRes.data ?? []).map(mapPurchaseFromRow),
        machines: (machinesRes.data ?? []).map(mapMachineFromRow),
        machineRuns: (runsRes.data ?? []).map(mapRunFromRow),
        workers: (workersRes.data ?? []).map(mapWorkerFromRow),
        loading: false,
        error: null,
        lastSyncedAt: new Date().toISOString(),
        activeUserId: userId,
        mode: "cloud",
      })
    } catch (error) {
      console.error("Failed to hydrate operations data", error)
      set({ loading: false, error, mode: "cloud" })
    }
  },

  addSale: async (payload) => {
    const state = get()
    const userId = payload?.userId ?? state.activeUserId
    const draft = buildSaleDraft(payload)
    if (!isSupabaseConfigured || !userId) {
      const localSale = {
        ...draft,
        id: generateLocalId("sale"),
        userId: null,
        createdAt: new Date().toISOString(),
      }
      set((prev) => ({
        sales: [localSale, ...prev.sales],
        mode: "offline",
      }))
      persistLocalOperations(get())
      return localSale
    }
    try {
      const { data, error } = await createSale({ userId, payload: serialiseSaleForInsert(draft) })
      if (error) throw error
      const mapped = mapSaleFromRow(data)
      set((prev) => ({ sales: [mapped, ...prev.sales], mode: "cloud" }))
      return mapped
    } catch (error) {
      console.error("Unable to add sale", error)
      throw error
    }
  },

  addPurchase: async (payload) => {
    const state = get()
    const userId = payload?.userId ?? state.activeUserId
    const draft = buildPurchaseDraft(payload)
    if (!isSupabaseConfigured || !userId) {
      const localPurchase = {
        ...draft,
        id: generateLocalId("purchase"),
        userId: null,
        createdAt: new Date().toISOString(),
      }
      set((prev) => ({
        purchases: [localPurchase, ...prev.purchases],
        mode: "offline",
      }))
      persistLocalOperations(get())
      return localPurchase
    }
    try {
      const { data, error } = await createPurchase({ userId, payload: {
        supplier: draft.supplier,
        yarn_brand: draft.yarnBrand,
        yarn_count: draft.yarnCount,
        yarn_type: draft.yarnType,
        rate_per_kg: draft.ratePerKg,
        quantity_kg: draft.quantityKg,
        amount: draft.amount,
        purchase_date: draft.purchaseDate,
        notes: draft.notes,
      } })
      if (error) throw error
      const mapped = mapPurchaseFromRow(data)
      set((prev) => ({ purchases: [mapped, ...prev.purchases], mode: "cloud" }))
      return mapped
    } catch (error) {
      console.error("Unable to record purchase", error)
      throw error
    }
  },

  addPayment: async (payload) => {
    const state = get()
    const userId = payload?.userId ?? state.activeUserId
    const paymentAmount = toNumber(payload.amount)
    if (!payload.party || !payload.paymentDate || paymentAmount <= 0) {
      throw new Error("Invalid payment parameters")
    }

    const paymentDateObj = normaliseDate(payload.paymentDate) || new Date()
    const sales = [...state.sales]
      .filter((sale) => sale.party === payload.party && (sale.balance > 0 || (sale.interestAccrued ?? 0) > 0))
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))

    if (!sales.length) {
      throw new Error("No open invoices for this party")
    }

    let remaining = paymentAmount
    const touched = []
    const appliedTo = []

    for (const sale of sales) {
      if (remaining <= 0) break

      accrueInterestToDate(sale, paymentDateObj)

      let principalApplied = 0
      if (remaining > 0 && sale.balance > 0) {
        principalApplied = Math.min(remaining, sale.balance)
        sale.balance -= principalApplied
        sale.paidAmount += principalApplied
        remaining -= principalApplied
      }

      const interestOutstanding = sale.interestAccrued ?? 0
      const interestApplied = remaining > 0 ? Math.min(remaining, interestOutstanding) : 0
      sale.interestAccrued = interestOutstanding - interestApplied
      remaining -= interestApplied

      if (sale.balance === 0) {
        sale.status = sale.interestAccrued > 0 ? "interest_due" : "paid"
      } else {
        sale.status = sale.balance < sale.amount ? "partial" : "pending"
      }

      appliedTo.push({
        saleId: sale.id,
        interest: Number(interestApplied.toFixed(2)),
        principal: Number(principalApplied.toFixed(2)),
        balanceRemaining: Number(sale.balance.toFixed(2)),
        interestRemaining: Number(sale.interestAccrued.toFixed(2)),
      })

      touched.push({ saleId: sale.id, patch: serialiseSaleForUpdate(sale) })
    }

    const paymentRecord = {
      party: payload.party,
      paymentDate: payload.paymentDate,
      amount: paymentAmount,
      mode: payload.mode ?? "online",
      reference: payload.reference ?? "",
      appliedTo,
      notes: payload.notes ?? "",
    }

    if (!isSupabaseConfigured || !userId) {
      const localPayment = {
        ...paymentRecord,
        id: generateLocalId("payment"),
        userId: null,
        createdAt: new Date().toISOString(),
      }

      set((prev) => ({
        sales: prev.sales.map((sale) => {
          const updated = sales.find((candidate) => candidate.id === sale.id)
          return updated ? { ...sale, ...updated } : sale
        }),
        payments: [localPayment, ...prev.payments],
        mode: "offline",
      }))
      persistLocalOperations(get())

      return { payment: localPayment, unapplied: Number(Math.max(0, remaining).toFixed(2)) }
    }

    try {
      const updateResults = await Promise.all(touched.map((entry) => updateSale(entry)))
      const updateError = updateResults.find((result) => result?.error)
      if (updateError?.error) {
        throw updateError.error
      }

      const { data, error } = await createPayment({
        userId,
        payload: serialisePaymentForInsert(paymentRecord),
      })
      if (error) throw error

      const mappedPayment = mapPaymentFromRow(data)

      set((prev) => ({
        sales: prev.sales.map((sale) => {
          const touchedSale = touched.find((entry) => entry.saleId === sale.id)
          if (!touchedSale) return sale
          const match = sales.find((candidate) => candidate.id === sale.id)
          return match ? { ...sale, ...match } : sale
        }),
        payments: [mappedPayment, ...prev.payments],
        mode: "cloud",
      }))

      return { payment: mappedPayment, unapplied: Number(Math.max(0, remaining).toFixed(2)) }
    } catch (error) {
      console.error("Unable to record payment", error)
      throw error
    }
  },

  upsertMachine: async ({ userId, payload }) => {
    const state = get()
    const targetUser = userId ?? state.activeUserId
    const serialised = {
      name: payload.name,
      loom_type: payload.loomType,
      reed_width_inch: toNumber(payload.reedWidthInch),
      rpm_target: toNumber(payload.rpmTarget),
      shift_pattern: payload.shiftPattern,
      remarks: payload.remarks,
      id: payload.id ?? undefined,
    }

    if (!isSupabaseConfigured || !targetUser) {
      const machineId = payload.id ?? generateLocalId("machine")
      const localMachine = {
        id: machineId,
        userId: null,
        name: payload.name,
        loomType: payload.loomType ?? "airjet",
        reedWidthInch: toNumber(payload.reedWidthInch) || null,
        rpmTarget: toNumber(payload.rpmTarget) || null,
        shiftPattern: payload.shiftPattern ?? "12h",
        remarks: payload.remarks ?? "",
      }
      set((prev) => ({
        machines: prev.machines.some((machine) => machine.id === machineId)
          ? prev.machines.map((machine) => (machine.id === machineId ? localMachine : machine))
          : [...prev.machines, localMachine].sort((a, b) => a.name.localeCompare(b.name)),
        mode: "offline",
      }))
      persistLocalOperations(get())
      return localMachine
    }

    try {
      const { data, error } = await upsertMachine({ userId: targetUser, payload: serialised })
      if (error) throw error
      const mapped = mapMachineFromRow(data)
      set((prev) => ({
        machines: prev.machines.some((machine) => machine.id === mapped.id)
          ? prev.machines.map((machine) => (machine.id === mapped.id ? mapped : machine))
          : [...prev.machines, mapped].sort((a, b) => a.name.localeCompare(b.name)),
        mode: "cloud",
      }))
      return mapped
    } catch (error) {
      console.error("Unable to upsert machine", error)
      throw error
    }
  },

  logMachineRun: async ({ userId, payload }) => {
    const state = get()
    const targetUser = userId ?? state.activeUserId
    const serialised = {
      machine_id: payload.machineId,
      quality: payload.quality,
      shift_date: payload.shiftDate,
      shift_type: payload.shiftType,
      meters_produced: toNumber(payload.metersProduced),
      efficiency: toNumber(payload.efficiency),
      accuracy: toNumber(payload.accuracy),
      defects_per_million: toNumber(payload.defectsPerMillion),
      worker_id: payload.workerId,
      yarn_brand: payload.yarnBrand,
      yarn_supplier: payload.yarnSupplier,
      yarn_rate: toNumber(payload.yarnRate),
      notes: payload.notes,
    }

    if (!isSupabaseConfigured || !targetUser) {
      const runId = generateLocalId("run")
      const machine = state.machines.find((entry) => entry.id === payload.machineId) ?? null
      const worker = state.workers.find((entry) => entry.id === payload.workerId) ?? null
      const localRun = {
        id: runId,
        userId: null,
        machineId: payload.machineId ?? null,
        quality: payload.quality ?? "",
        shiftDate: payload.shiftDate,
        shiftType: payload.shiftType ?? "12h",
        metersProduced: toNumber(payload.metersProduced),
        efficiency: toNumber(payload.efficiency),
        accuracy: toNumber(payload.accuracy),
        defectsPerMillion: toNumber(payload.defectsPerMillion),
        workerId: payload.workerId ?? null,
        yarnBrand: payload.yarnBrand ?? "",
        yarnSupplier: payload.yarnSupplier ?? "",
        yarnRate: toNumber(payload.yarnRate),
        notes: payload.notes ?? "",
        machine,
        worker,
      }
      set((prev) => ({
        machineRuns: [localRun, ...prev.machineRuns],
        mode: "offline",
      }))
      persistLocalOperations(get())
      return localRun
    }

    try {
      const { data, error } = await logMachineRun({ userId: targetUser, payload: serialised })
      if (error) throw error
      const mapped = mapRunFromRow(data)
      set((prev) => ({ machineRuns: [mapped, ...prev.machineRuns], mode: "cloud" }))
      return mapped
    } catch (error) {
      console.error("Unable to log machine run", error)
      throw error
    }
  },

  upsertWorker: async ({ userId, payload }) => {
    const state = get()
    const targetUser = userId ?? state.activeUserId
    const serialised = {
      id: payload.id ?? undefined,
      name: payload.name,
      skill_level: payload.skillLevel,
      contact: payload.contact,
    }

    if (!isSupabaseConfigured || !targetUser) {
      const workerId = payload.id ?? generateLocalId("worker")
      const localWorker = {
        id: workerId,
        userId: null,
        name: payload.name,
        skillLevel: payload.skillLevel ?? "",
        contact: payload.contact ?? "",
      }
      set((prev) => ({
        workers: prev.workers.some((worker) => worker.id === workerId)
          ? prev.workers.map((worker) => (worker.id === workerId ? localWorker : worker))
          : [...prev.workers, localWorker].sort((a, b) => a.name.localeCompare(b.name)),
        mode: "offline",
      }))
      persistLocalOperations(get())
      return localWorker
    }

    try {
      const { data, error } = await upsertWorker({ userId: targetUser, payload: serialised })
      if (error) throw error
      const mapped = mapWorkerFromRow(data)
      set((prev) => ({
        workers: prev.workers.some((worker) => worker.id === mapped.id)
          ? prev.workers.map((worker) => (worker.id === mapped.id ? mapped : worker))
          : [...prev.workers, mapped].sort((a, b) => a.name.localeCompare(b.name)),
        mode: "cloud",
      }))
      return mapped
    } catch (error) {
      console.error("Unable to upsert worker", error)
      throw error
    }
  },
}))

export default useOperationsStore
export {
  CREDIT_DAYS,
  MONTHLY_INTEREST_RATE,
  accrueInterestToDate,
  calculateDueDate,
  calculateInterestDue,
  daysBetween,
}

export const computeDashboardSnapshot = (sales = []) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return sales.reduce(
    (acc, sale) => {
      acc.totalOutstanding += sale.balance
      acc.totalInterest += calculateInterestDue(sale, now)
      if (sale.balance > 0 && new Date(sale.dueDate) < now) acc.overdueCount += 1
      const date = new Date(sale.saleDate)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        acc.monthlySales += sale.amount
      }
      acc.totalGst += sale.gstAmount ?? 0
      acc.taxableValue += sale.taxableValue ?? sale.amount
      acc.totalCost += sale.costOfSale ?? 0
      return acc
    },
    { totalOutstanding: 0, totalInterest: 0, overdueCount: 0, monthlySales: 0, totalGst: 0, taxableValue: 0, totalCost: 0 },
  )
}

export const computePartySummary = (sales = [], party) => {
  if (!party) return null
  const filtered = sales.filter((sale) => sale.party === party)
  if (!filtered.length) return null
  const now = new Date()
  return filtered.reduce(
    (acc, sale) => {
      acc.totalSales += sale.amount
      acc.totalPaid += sale.paidAmount
      acc.outstanding += sale.balance
      acc.interest += calculateInterestDue(sale, now)
      if (sale.balance > 0 && new Date(sale.dueDate) < now) acc.overdue += 1
      acc.transactions += 1
      acc.gst += sale.gstAmount ?? 0
      acc.taxable += sale.taxableValue ?? sale.amount
      acc.cost += sale.costOfSale ?? 0
      return acc
    },
    { totalSales: 0, totalPaid: 0, outstanding: 0, interest: 0, overdue: 0, transactions: 0, gst: 0, taxable: 0, cost: 0 },
  )
}

export const computeGstSummary = (sales = []) => {
  return sales.reduce(
    (acc, sale) => {
      const treatment = sale.gstTreatment === "interstate" ? "igst" : "cgstSgst"
      if (treatment === "igst") {
        acc.igst += sale.gstAmount ?? 0
      } else {
        acc.cgst += sale.cgstAmount ?? (sale.gstAmount ?? 0) / 2
        acc.sgst += sale.sgstAmount ?? (sale.gstAmount ?? 0) / 2
      }
      acc.taxable += sale.taxableValue ?? sale.amount
      acc.total += sale.gstAmount ?? 0
      return acc
    },
    { cgst: 0, sgst: 0, igst: 0, taxable: 0, total: 0 },
  )
}

export const computeProfitAndLoss = (sales = []) => {
  return sales.reduce(
    (acc, sale) => {
      const revenue = sale.amount ?? 0
      const cost = sale.costOfSale ?? 0
      const gst = sale.gstAmount ?? 0
      const profit = revenue - cost
      acc.revenue += revenue
      acc.costOfGoods += cost
      acc.gstCollected += gst
      acc.grossProfit += profit
      return acc
    },
    { revenue: 0, costOfGoods: 0, gstCollected: 0, grossProfit: 0 },
  )
}

export const previewPaymentAllocation = ({ sales = [], party, amount, paymentDate }) => {
  const paymentAmount = Number(amount)
  if (!party || Number.isNaN(paymentAmount) || paymentAmount <= 0) {
    return null
  }

  const paymentDateObj = normaliseDate(paymentDate) || new Date()

  const relevant = sales
    .filter((sale) => sale.party === party && (sale.balance > 0 || (sale.interestAccrued ?? 0) > 0))
    .map((sale) => {
      const interestOutstanding = (sale.interestAccrued ?? 0) + computeAdditionalInterest(sale, paymentDateObj)
      return {
        sale,
        saleId: sale.id,
        balance: sale.balance,
        interestOutstanding,
      }
    })
    .sort((a, b) => new Date(b.sale.saleDate) - new Date(a.sale.saleDate))

  if (!relevant.length) {
    return null
  }

  let remaining = paymentAmount
  const breakdown = []
  let totalPrincipalApplied = 0
  let totalInterestApplied = 0

  for (const entry of relevant) {
    if (remaining <= 0) break

    const principalApplied = Math.min(remaining, entry.balance)
    entry.balance -= principalApplied
    remaining -= principalApplied
    totalPrincipalApplied += principalApplied

    const interestApplied = remaining > 0 ? Math.min(remaining, entry.interestOutstanding) : 0
    entry.interestOutstanding -= interestApplied
    remaining -= interestApplied
    totalInterestApplied += interestApplied

    breakdown.push({
      saleId: entry.saleId,
      saleDate: entry.sale.saleDate,
      dueDate: entry.sale.dueDate,
      description: entry.sale.description,
      invoiceAmount: entry.sale.amount,
      principalApplied: Number(principalApplied.toFixed(2)),
      interestApplied: Number(interestApplied.toFixed(2)),
      principalRemaining: Number(entry.balance.toFixed(2)),
      interestRemaining: Number(entry.interestOutstanding.toFixed(2)),
    })
  }

  const principalRemaining = breakdown.reduce((acc, item) => acc + item.principalRemaining, 0)
  const interestRemaining = breakdown.reduce((acc, item) => acc + item.interestRemaining, 0)

  return {
    breakdown,
    totals: {
      paymentAmount,
      totalPrincipalApplied,
      totalInterestApplied,
      principalRemaining,
      interestRemaining,
      unapplied: Math.max(0, remaining),
    },
  }
}

export const computeProductionSummary = (runs = []) => {
  if (!runs.length) {
    return {
      totalMeters: 0,
      avgEfficiency: 0,
      avgAccuracy: 0,
      defectsPerMillion: 0,
    }
  }

  const totals = runs.reduce(
    (acc, run) => {
      acc.totalMeters += run.metersProduced ?? 0
      acc.totalEfficiency += run.efficiency ?? 0
      acc.totalAccuracy += run.accuracy ?? 0
      acc.totalDpm += run.defectsPerMillion ?? 0
      return acc
    },
    { totalMeters: 0, totalEfficiency: 0, totalAccuracy: 0, totalDpm: 0 },
  )

  return {
    totalMeters: totals.totalMeters,
    avgEfficiency: totals.totalEfficiency / runs.length || 0,
    avgAccuracy: totals.totalAccuracy / runs.length || 0,
    defectsPerMillion: totals.totalDpm / runs.length || 0,
  }
}
