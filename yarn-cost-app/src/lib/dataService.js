import supabase, { isSupabaseConfigured, supabaseConfigError } from "./supabaseClient"

const uniq = (values) => [...new Set(values.filter(Boolean))]

const tableCandidates = {
  qualities: uniq([
    import.meta.env.VITE_SUPABASE_QUALITIES_TABLE,
    "qualities",
    "quantities",
  ]),
  calculations: uniq([
    import.meta.env.VITE_SUPABASE_CALCULATIONS_TABLE,
    "calculations",
    "calculation_snapshots",
  ]),
}

const resolvedTables = {
  qualities: undefined,
  calculations: undefined,
}

const isMissingTableError = (error) => {
  if (!error?.message) return false
  const message = error.message.toLowerCase()
  return message.includes("schema cache") || message.includes("does not exist")
}

const withTable = async (key, executor) => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: supabaseConfigError }
  }

  const candidates = resolvedTables[key]
    ? [resolvedTables[key]]
    : tableCandidates[key]

  if (!candidates?.length) {
    return { data: null, error: new Error(`No table candidates configured for ${key}`) }
  }

  let lastError = null

  for (const table of candidates) {
    const result = await executor(table)
    if (!result.error) {
      if (!resolvedTables[key] && table !== candidates[0]) {
        console.warn(`Using fallback Supabase table "${table}" for ${key}. Update your .env if this is intentional.`)
      }
      resolvedTables[key] = table
      return result
    }
    lastError = result.error
    if (!isMissingTableError(result.error) || table === candidates[candidates.length - 1]) {
      break
    }
  }

  if (lastError && isMissingTableError(lastError)) {
    console.warn(`Supabase table lookup failed for ${key}. Please create the expected tables or set VITE_SUPABASE_${key.toUpperCase()}_TABLE.`)
    return { data: [], error: null }
  }

  return { data: null, error: lastError }
}

export const fetchQualities = async ({ userId } = {}) => {
  const response = await withTable("qualities", async (table) => {
    const baseQuery = supabase.from(table).select("*").order("created_at", { ascending: false })

    if (!userId) {
      const { data, error } = await baseQuery.eq("is_public", true)
      return { data: data ?? [], error }
    }

    const { data, error } = await baseQuery.or(`is_public.eq.true,user_id.eq.${userId}`)
    return { data: data ?? [], error }
  })

  return { data: response.data ?? [], error: response.error }
}

export const saveQuality = async ({ userId, qualityName, payload, isPublic = false }) => {
  if (!userId && !isPublic) {
    return { error: new Error("Sign in to save private qualities") }
  }

  const { error, data } = await withTable("qualities", (table) =>
    supabase.from(table).insert({
      user_id: userId,
      name: qualityName,
      warp: payload.warp,
      weft_config: payload.weftConfig,
      wefts: payload.wefts,
      additional: payload.additional,
      pricing: payload.pricing,
      notes: payload.notes,
      is_public: isPublic,
    }),
  )

  return { error, data }
}

export const deleteQuality = async (id) => {
  const { error } = await withTable("qualities", (table) => supabase.from(table).delete().eq("id", id))
  return { error }
}

export const fetchCalculations = async ({ userId } = {}) => {
  const response = await withTable("calculations", async (table) => {
    const baseQuery = supabase.from(table).select("*").order("created_at", { ascending: false })

    if (!userId) {
      const { data, error } = await baseQuery.eq("is_public", true)
      return { data: data ?? [], error }
    }

    const { data, error } = await baseQuery.or(`is_public.eq.true,user_id.eq.${userId}`)
    return { data: data ?? [], error }
  })

  return { data: response.data ?? [], error: response.error }
}

export const saveCalculation = async ({ userId, qualityName, payload, results, isPublic = false }) => {
  if (!userId && !isPublic) {
    return { error: new Error("Sign in to save private calculations") }
  }

  const { error, data } = await withTable("calculations", (table) =>
    supabase.from(table).insert({
      user_id: userId,
      quality_name: qualityName,
      inputs: payload,
      results,
      is_public: isPublic,
    }),
  )

  return { error, data }
}

export const deleteCalculation = async (id) => {
  const { error } = await withTable("calculations", (table) => supabase.from(table).delete().eq("id", id))
  return { error }
}

export const mapQualityToCalculatorState = (row) => ({
  qualityName: row?.name ?? "",
  warp: row?.warp ?? {},
  weftConfig: row?.weft_config ?? {},
  wefts: row?.wefts ?? [],
  additional: row?.additional ?? {},
  pricing: row?.pricing ?? {},
  notes: row?.notes ?? "",
})

export const mapCalculationToCalculatorState = (row) => ({
  qualityName: row?.quality_name ?? "",
  ...(row?.inputs ?? {}),
})
