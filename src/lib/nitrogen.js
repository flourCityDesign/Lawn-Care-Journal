// Nitrogen budget: sum of (product amount lbs) x (N% / 100) across fertilizer
// applications this year, expressed per 1,000 sqft of total lawn area.

import { ALL_ZONES_ID, ALL_ZONES_LABEL, getZoneIds } from './constants'
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
  if (app.category !== 'Fertilizer') return 0
  const amount = Number(app.amountLbs) || 0
  const nPercent = Number(app.nPercent) || 0
  return amount * (nPercent / 100)
}

export function nitrogenYtd(applications, zones, year = new Date().getFullYear()) {
  const sqft = totalLawnSqft(zones)
  const ytdApps = applications.filter(
    (a) => a.category === 'Fertilizer' && parseLocalDate(a.date).getFullYear() === year
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
  const yearApps = applications.filter((a) => a.category === 'Fertilizer' && parseLocalDate(a.date).getFullYear() === year)

  const allLbsN = yearApps.reduce((sum, a) => sum + actualNLbs(a), 0)
  const aggregateRate = totalSqft > 0 ? allLbsN / (totalSqft / 1000) : 0
  const pages = [{ id: ALL_ZONES_ID, name: ALL_ZONES_LABEL, sqft: totalSqft, per1000: aggregateRate }]

  const perZoneRate = {}
  zones.forEach((z) => {
    perZoneRate[z.id] = 0
  })

  yearApps.forEach((a) => {
    const ids = getZoneIds(a)
    const coverageSqft = appCoverageSqft(a, zones)
    if (coverageSqft <= 0) return
    const rate = actualNLbs(a) / (coverageSqft / 1000)
    const targetZones = ids.includes(ALL_ZONES_ID) ? zones : zones.filter((z) => ids.includes(z.id))
    targetZones.forEach((z) => {
      perZoneRate[z.id] += rate
    })
  })

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
