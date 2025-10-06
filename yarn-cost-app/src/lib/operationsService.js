import supabase, { isSupabaseConfigured, supabaseConfigError } from "./supabaseClient"

const uniq = (values) => [...new Set(values.filter(Boolean))]

const tableCandidates = {
  sales: uniq([
    import.meta.env.VITE_SUPABASE_SALES_TABLE,
    "operations_sales",
    "receivable_sales",
  ]),
  payments: uniq([
    import.meta.env.VITE_SUPABASE_PAYMENTS_TABLE,
    "operations_payments",
    "receivable_payments",
  ]),
  purchases: uniq([
    import.meta.env.VITE_SUPABASE_PURCHASES_TABLE,
    "operations_purchases",
    "yarn_purchases",
  ]),
  machines: uniq([
    import.meta.env.VITE_SUPABASE_MACHINES_TABLE,
    "operations_machines",
    "machines",
  ]),
  machineRuns: uniq([
    import.meta.env.VITE_SUPABASE_MACHINE_RUNS_TABLE,
    "operations_machine_runs",
    "machine_runs",
  ]),
  workers: uniq([
    import.meta.env.VITE_SUPABASE_WORKERS_TABLE,
    "operations_workers",
    "workers",
  ]),
}

const resolvedTables = {}

const isMissingTableError = (error) => {
  if (!error?.message) return false
  const message = error.message.toLowerCase()
  return message.includes("schema cache") || message.includes("does not exist")
}

const withTable = async (key, executor) => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: supabaseConfigError }
  }

  const candidates = resolvedTables[key] ? [resolvedTables[key]] : tableCandidates[key]
  if (!candidates?.length) {
    return { data: null, error: new Error(`No Supabase tables configured for ${key}`) }
  }

  let lastError = null
  for (const table of candidates) {
    const result = await executor(table)
    if (!result.error) {
      resolvedTables[key] = table
      return result
    }
    lastError = result.error
    if (!isMissingTableError(result.error)) {
      break
    }
  }

  if (lastError && isMissingTableError(lastError)) {
    console.warn(`Supabase table lookup failed for ${key}. Create the expected table or set VITE_SUPABASE_${key.toUpperCase()}_TABLE.`)
    return { data: [], error: null }
  }

  return { data: null, error: lastError }
}

const guardUser = (userId) => {
  if (!userId) {
    return { error: new Error("Sign in to access operations data") }
  }
  return null
}

export const fetchSales = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("sales", (table) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("sale_date", { ascending: false }),
  )

  return { data: response.data ?? [], error: response.error }
}

export const fetchPurchases = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("purchases", (table) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false }),
  )

  return { data: response.data ?? [], error: response.error }
}

export const fetchPayments = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("payments", (table) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false }),
  )

  return { data: response.data ?? [], error: response.error }
}

export const createSale = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("sales", (table) =>
    supabase.from(table).insert({ user_id: userId, ...payload }).select().single(),
  )

  return { data: response.data, error: response.error }
}

export const updateSale = async ({ saleId, patch }) => {
  if (!saleId) return { error: new Error("Missing saleId") }

  const response = await withTable("sales", (table) =>
    supabase.from(table).update(patch).eq("id", saleId),
  )

  return { error: response.error }
}

export const createPayment = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("payments", (table) =>
    supabase.from(table).insert({ user_id: userId, ...payload }).select().single(),
  )

  return { data: response.data, error: response.error }
}

export const createPurchase = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("purchases", (table) =>
    supabase.from(table).insert({ user_id: userId, ...payload }).select().single(),
  )

  return { data: response.data, error: response.error }
}

export const fetchMachines = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("machines", (table) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true }),
  )
  return { data: response.data ?? [], error: response.error }
}

export const upsertMachine = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("machines", (table) =>
    supabase.from(table).upsert({ user_id: userId, ...payload }).select().single(),
  )

  return { data: response.data, error: response.error }
}

export const fetchMachineRuns = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("machineRuns", (table) =>
    supabase
      .from(table)
      .select("*, machine:machine_id(name, loom_type), worker:worker_id(name)")
      .eq("user_id", userId)
      .order("shift_date", { ascending: false })
      .order("created_at", { ascending: false }),
  )

  return { data: response.data ?? [], error: response.error }
}

export const logMachineRun = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("machineRuns", (table) =>
    supabase
      .from(table)
      .insert({ user_id: userId, ...payload })
      .select("*, machine:machine_id(name, loom_type), worker:worker_id(name)")
      .single(),
  )

  return { data: response.data, error: response.error }
}

export const fetchWorkers = async ({ userId } = {}) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("workers", (table) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true }),
  )

  return { data: response.data ?? [], error: response.error }
}

export const upsertWorker = async ({ userId, payload }) => {
  const guard = guardUser(userId)
  if (guard) return guard

  const response = await withTable("workers", (table) =>
    supabase.from(table).upsert({ user_id: userId, ...payload }).select().single(),
  )

  return { data: response.data, error: response.error }
}
