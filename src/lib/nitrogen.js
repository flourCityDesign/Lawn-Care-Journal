// Nitrogen budget: sum of (product amount lbs) x (N% / 100) across fertilizer
// applications this year, expressed per 1,000 sqft of total lawn area.

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

export function nitrogenStatus(per1000, cap) {
  const pct = cap > 0 ? per1000 / cap : 0
  if (pct >= 1) return 'over'
  if (pct >= 0.8) return 'caution'
  return 'ok'
}
