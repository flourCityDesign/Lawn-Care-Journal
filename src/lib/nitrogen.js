// Nitrogen budget: sum of (product amount lbs) x (N% / 100) across fertilizer
// applications this year, expressed per 1,000 sqft of total lawn area.

import { ALL_ZONES_ID, ALL_ZONES_LABEL } from './constants'

export function totalLawnSqft(zones) {
  return zones.reduce((sum, z) => sum + (Number(z.sqft) || 0), 0)
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
    (a) => a.category === 'Fertilizer' && new Date(a.date).getFullYear() === year
  )
  const totalLbsN = ytdApps.reduce((sum, a) => sum + actualNLbs(a), 0)
  const per1000 = sqft > 0 ? totalLbsN / (sqft / 1000) : 0
  return { totalLbsN, per1000, sqft, applicationCount: ytdApps.length }
}

// Per-zone N rate. A "Whole Lawn" application delivers the same density
// (lbs N / 1,000 sqft) to every zone it covers, so its rate is added to
// each zone's own rate rather than being diluted across total sqft.
export function nitrogenYtdByZone(applications, zones, year = new Date().getFullYear()) {
  const totalSqft = totalLawnSqft(zones)
  const yearApps = applications.filter((a) => a.category === 'Fertilizer' && new Date(a.date).getFullYear() === year)

  const wholeLawnLbsN = yearApps.filter((a) => a.zoneId === ALL_ZONES_ID).reduce((sum, a) => sum + actualNLbs(a), 0)
  const wholeLawnRate = totalSqft > 0 ? wholeLawnLbsN / (totalSqft / 1000) : 0

  const allLbsN = yearApps.reduce((sum, a) => sum + actualNLbs(a), 0)
  const aggregateRate = totalSqft > 0 ? allLbsN / (totalSqft / 1000) : 0

  const pages = [{ id: ALL_ZONES_ID, name: ALL_ZONES_LABEL, sqft: totalSqft, per1000: aggregateRate }]

  zones.forEach((zone) => {
    const zoneSqft = Number(zone.sqft) || 0
    const zoneLbsN = yearApps.filter((a) => a.zoneId === zone.id).reduce((sum, a) => sum + actualNLbs(a), 0)
    const zoneOwnRate = zoneSqft > 0 ? zoneLbsN / (zoneSqft / 1000) : 0
    pages.push({ id: zone.id, name: zone.name, sqft: zoneSqft, per1000: zoneOwnRate + wholeLawnRate })
  })

  return pages
}

export function nitrogenStatus(per1000, cap) {
  const pct = cap > 0 ? per1000 / cap : 0
  if (pct >= 1) return 'over'
  if (pct >= 0.8) return 'caution'
  return 'ok'
}
