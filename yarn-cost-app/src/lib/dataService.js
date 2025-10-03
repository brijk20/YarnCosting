import supabase from "./supabaseClient"

const TABLE_QUALITIES = "qualities"
const TABLE_CALCULATIONS = "calculations"

export const fetchQualities = async ({ userId } = {}) => {
  const baseQuery = supabase.from(TABLE_QUALITIES).select("*").order("created_at", { ascending: false })

  if (!userId) {
    const { data, error } = await baseQuery.eq("is_public", true)
    return { data: data ?? [], error }
  }

  const { data, error } = await baseQuery.or(`is_public.eq.true,user_id.eq.${userId}`)
  return { data: data ?? [], error }
}

export const saveQuality = async ({ userId, qualityName, payload, isPublic = false }) => {
  if (!userId && !isPublic) {
    return { error: new Error("Sign in to save private qualities") }
  }

  const { error, data } = await supabase.from(TABLE_QUALITIES).insert({
    user_id: userId,
    name: qualityName,
    warp: payload.warp,
    weft_config: payload.weftConfig,
    wefts: payload.wefts,
    additional: payload.additional,
    pricing: payload.pricing,
    notes: payload.notes,
    is_public: isPublic,
  })

  return { error, data }
}

export const deleteQuality = async (id) => {
  const { error } = await supabase.from(TABLE_QUALITIES).delete().eq("id", id)
  return { error }
}

export const fetchCalculations = async ({ userId } = {}) => {
  const baseQuery = supabase.from(TABLE_CALCULATIONS).select("*").order("created_at", { ascending: false })

  if (!userId) {
    const { data, error } = await baseQuery.eq("is_public", true)
    return { data: data ?? [], error }
  }

  const { data, error } = await baseQuery.or(`is_public.eq.true,user_id.eq.${userId}`)
  return { data: data ?? [], error }
}

export const saveCalculation = async ({ userId, qualityName, payload, results, isPublic = false }) => {
  if (!userId && !isPublic) {
    return { error: new Error("Sign in to save private calculations") }
  }

  const { error, data } = await supabase.from(TABLE_CALCULATIONS).insert({
    user_id: userId,
    quality_name: qualityName,
    inputs: payload,
    results,
    is_public: isPublic,
  })

  return { error, data }
}

export const deleteCalculation = async (id) => {
  const { error } = await supabase.from(TABLE_CALCULATIONS).delete().eq("id", id)
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
