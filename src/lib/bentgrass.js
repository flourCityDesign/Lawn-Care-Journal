import { BENTGRASS_CATEGORY, appliesToZone } from './constants'
import { parseLocalDate } from './date'

export function bentgrassAppsThisSeason(applications, year = new Date().getFullYear()) {
  return applications
    .filter((a) => a.category === BENTGRASS_CATEGORY && parseLocalDate(a.date).getFullYear() === year)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function bentgrassStatus(applications, cap, retreatDays, year = new Date().getFullYear()) {
  const apps = bentgrassAppsThisSeason(applications, year)
  const count = apps.length
  const lastApp = apps[0] || null
  let safeAfter = null
  if (lastApp) {
    const d = parseLocalDate(lastApp.date)
    d.setDate(d.getDate() + Number(retreatDays || 21))
    safeAfter = d
  }
  return {
    count,
    cap,
    remaining: Math.max(cap - count, 0),
    atCap: count >= cap,
    lastApp,
    safeAfter,
    apps,
  }
}

export function bentgrassZoneHistory(applications, zoneId, year = new Date().getFullYear()) {
  return bentgrassAppsThisSeason(applications, year).filter((a) => appliesToZone(a, zoneId))
}
