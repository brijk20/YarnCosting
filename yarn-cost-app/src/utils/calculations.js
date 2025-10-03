const DENIER_PER_COUNT = 5315
const KG_DENOMINATOR = 9000000
const INCHES_PER_METER = 39.3701

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const applyRateMode = (rate, mode = "final", extra = 5) => {
  const base = toNumber(rate)
  const addOn = toNumber(extra)
  if (!base) return 0
  switch (mode) {
    case "plus":
      return base * 1.05
    case "plusplus":
      return (base + addOn) * 1.05
    default:
      return base
  }
}

export const toDenier = (value, unit = "denier") => {
  const numeric = toNumber(value)
  if (!numeric) return 0
  return unit === "count" ? DENIER_PER_COUNT / numeric : numeric
}

export const calculateWarp = (warp) => {
  const totalEnds = toNumber(warp?.totalEnds)
  const denier = toDenier(warp?.denier, warp?.denierUnit)
  const baseRate = toNumber(warp?.rate)
  const finalRate = applyRateMode(baseRate, warp?.rateMode, warp?.rateExtra)
  const weightPerMeter = totalEnds && denier ? (totalEnds * denier) / KG_DENOMINATOR : 0
  const weightPer100m = weightPerMeter * 100
  const costPerMeter = weightPerMeter * finalRate
  const costPer100m = costPerMeter * 100

  return {
    totalEnds,
    denier,
    baseRate,
    finalRate,
    weightPerMeter,
    weightPer100m,
    costPerMeter,
    costPer100m,
  }
}

export const calculateWefts = (wefts, weftConfig) => {
  const picksPerInch = toNumber(weftConfig?.picksPerInch)
  const pannoInches = toNumber(weftConfig?.pannoInches)
  const totalRatio = wefts.reduce((sum, weft) => {
    const ratio = toNumber(weft.ratio) || 0
    return ratio > 0 ? sum + ratio : sum
  }, 0)

  return wefts.map((weft) => {
    const ratio = toNumber(weft.ratio) || 0
    const fraction = totalRatio > 0 ? ratio / totalRatio : 0
    const effectivePick = picksPerInch * fraction
    const denier = toDenier(weft.denier, weft.denierUnit)
    const shortagePercent =
      weft.shortage !== undefined && weft.shortage !== null && weft.shortage !== ""
        ? weft.shortage
        : weftConfig?.shortage ?? 0
    const shortage = toNumber(shortagePercent) / 100
    const baseRate = toNumber(weft.rate)
    const finalRate = applyRateMode(baseRate, weft.rateMode, weft.rateExtra)
    const baseWeightPerMeter =
      effectivePick && denier && pannoInches
        ? (effectivePick * denier * pannoInches) / KG_DENOMINATOR
        : 0
    const weightPerMeter = baseWeightPerMeter * (1 + shortage)
    const weightPer100m = weightPerMeter * 100
    const costPerMeter = weightPerMeter * finalRate
    const costPer100m = costPerMeter * 100

    return {
      id: weft.id,
      name: weft.name,
      ratio,
      fraction,
      effectivePick,
      denier,
      shortagePercent: shortage * 100,
      baseRate,
      finalRate,
      weightPerMeter,
      weightPer100m,
      costPerMeter,
      costPer100m,
    }
  })
}

export const calculateTotals = (state) => {
  const warp = calculateWarp(state?.warp)
  const wefts = calculateWefts(state?.wefts ?? [], state?.weftConfig)

  const warpCost = warp.costPerMeter || 0
  const weftCost = wefts.reduce((sum, weft) => sum + (weft.costPerMeter || 0), 0)
  const yarnCostPerMeter = warpCost + weftCost
  const khataKharch = toNumber(state?.additional?.khataKharch)
  const costBeforeGst = yarnCostPerMeter + khataKharch
  const gstAmount = costBeforeGst * 0.05
  const totalWithGst = costBeforeGst + gstAmount
  const picksPerInch = toNumber(state?.weftConfig?.picksPerInch)
  const picksPerMeter = picksPerInch * INCHES_PER_METER
  const costPerPick = picksPerMeter ? costBeforeGst / picksPerMeter : 0
  const salePrice = toNumber(state?.pricing?.salePrice)
  const profitPerMeter = salePrice ? salePrice - costBeforeGst : 0
  const marginPercent = costBeforeGst ? (profitPerMeter / costBeforeGst) * 100 : 0

  return {
    warp,
    wefts,
    summary: {
      yarnCostPerMeter,
      khataKharch,
      costBeforeGst,
      gstAmount,
      totalWithGst,
      costPerPick,
      picksPerMeter,
      profitPerMeter,
      marginPercent,
      salePrice,
    },
  }
}

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0)

export const formatNumber = (value, fractionDigits = 3) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  })
