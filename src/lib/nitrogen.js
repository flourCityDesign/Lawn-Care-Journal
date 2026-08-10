// Nitrogen budget: sum of (product amount lbs) x (N% / 100) across
// N-tracked applications this year, expressed per 1,000 sqft of total lawn
// area. N-tracked categories are Fertilizer and Pre-emergent (some granular
// pre-emergents carry an NPK value) - see NPK_CATEGORIES in constants.js.

import { ALL_ZONES_ID, ALL_ZONES_LABEL, N_TRACKED_CATEGORIES, getZoneIds } from './constants'
import { parseLocalDate } from './date'

export function totalLawnSqft(zones) {
  return zones.reduce((sum, z) => sum + (Number(z.sqft) || 0), 0)
}

// The sqft an application actually covered: every zone it lists (or the
// whole lawn, for a Whole Lawn entry). Used to turn a raw amount applied
// into a density (lbs N / 1,000 sqft) for that specific application.
export function appCoverageSqft(app, zones) {
  const ids = getZoneIds(app)
  if (ids.includes(ALL_ZONES_ID)) return totalLawnSqft(zones)
  return zones.filter((z) => ids.includes(z.id)).reduce((sum, z) => sum + (Number(z.sqft) || 0), 0)
}

export function actualNLbs(app) {
  if (!N_TRACKED_CATEGORIES.includes(app.category)) return 0
  const amount = Number(app.amountLbs) || 0
  const nPercent = Number(app.nPercent) || 0
  return amount * (nPercent / 100)
}

// A product's total amount applied (lbs for granular, oz for liquid),
// converted to lbs of product, for N-content math.
function productTotalLbs(product, productType) {
  const amount = Number(product.amount) || 0
  return productType === 'liquid' ? amount / 16 : amount
}

// N rate (lbs N / 1,000 sqft) a multi-product entry contributes. Each
// product's total amount applied x N% gives total lbs of actual N, which is
// then spread over however much area the entry covered - same
// amount-applied-over-an-area idea as the legacy single-product model, just
// summed across products. Returns null for entries that don't use the
// products model (older single-product entries), so callers can fall back
// to the legacy calculation.
export function entryNRatePer1000(app, zones) {
  if (!N_TRACKED_CATEGORIES.includes(app.category) || !Array.isArray(app.products)) return null
  const coverageSqft = appCoverageSqft(app, zones)
  if (coverageSqft <= 0) return 0
  const totalLbsN = app.products.reduce((sum, p) => {
    const nPercent = Number(p.nPercent) || 0
    if (nPercent <= 0) return sum
    return sum + productTotalLbs(p, app.productType) * (nPercent / 100)
  }, 0)
  return totalLbsN / (coverageSqft / 1000)
}

// Unified N rate (lbs N / 1,000 sqft) this application contributes to each
// zone it covers - works for both product-based entries and legacy
// entries, both a total amount applied back-calculated into a density
// using how much area the entry covered.
export function appNRatePer1000(app, zones) {
  const direct = entryNRatePer1000(app, zones)
  if (direct != null) return direct
  const coverageSqft = appCoverageSqft(app, zones)
  return coverageSqft > 0 ? actualNLbs(app) / (coverageSqft / 1000) : 0
}

export function nitrogenYtd(applications, zones, year = new Date().getFullYear()) {
  const sqft = totalLawnSqft(zones)
  const ytdApps = applications.filter(
    (a) => N_TRACKED_CATEGORIES.includes(a.category) && parseLocalDate(a.date).getFullYear() === year
  )
  const totalLbsN = ytdApps.reduce((sum, a) => sum + actualNLbs(a), 0)
  const per1000 = sqft > 0 ? totalLbsN / (sqft / 1000) : 0
  return { totalLbsN, per1000, sqft, applicationCount: ytdApps.length }
}

// Per-zone N rate. Any application delivers the same density (lbs N /
// 1,000 sqft) to every zone it covers - a Whole Lawn app to every zone, a
// multi-zone app (e.g. Backyard + Backyard Side logged together) to just
// those zones - so its rate is added to each covered zone's own rate
// rather than being diluted across a larger area.
export function nitrogenYtdByZone(applications, zones, year = new Date().getFullYear()) {
  const totalSqft = totalLawnSqft(zones)
  const yearApps = applications.filter((a) => N_TRACKED_CATEGORIES.includes(a.category) && parseLocalDate(a.date).getFullYear() === year)

  const perZoneRate = {}
  zones.forEach((z) => {
    perZoneRate[z.id] = 0
  })
  let totalLbsN = 0

  yearApps.forEach((a) => {
    const rate = appNRatePer1000(a, zones)
    if (rate <= 0) return
    const ids = getZoneIds(a)
    const isWholeLawn = ids.includes(ALL_ZONES_ID)
    const coverageSqft = isWholeLawn ? totalSqft : appCoverageSqft(a, zones)
    totalLbsN += rate * (coverageSqft / 1000)
    const targetZones = isWholeLawn ? zones : zones.filter((z) => ids.includes(z.id))
    targetZones.forEach((z) => {
      perZoneRate[z.id] += rate
    })
  })

  const aggregateRate = totalSqft > 0 ? totalLbsN / (totalSqft / 1000) : 0
  const pages = [{ id: ALL_ZONES_ID, name: ALL_ZONES_LABEL, sqft: totalSqft, per1000: aggregateRate }]

  zones.forEach((zone) => {
    pages.push({ id: zone.id, name: zone.name, sqft: Number(zone.sqft) || 0, per1000: perZoneRate[zone.id] })
  })

  return pages
}

export function nitrogenStatus(per1000, cap) {
  const pct = cap > 0 ? per1000 / cap : 0
  if (pct >= 1) return 'over'
  if (pct >= 0.8) return 'caution'
  return 'ok'
}
