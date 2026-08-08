// Derives a 0-10 "mow score" and a plain-language recommendation from
// recent rainfall, today's forecast, wind, and temperature.

export function computeMowScore({ rainLast2DaysIn, precipChanceToday, windMph, highF }) {
  let score = 10
  const reasons = []

  if (rainLast2DaysIn >= 0.5) {
    score -= 4
    reasons.push({ key: 'wet', weight: 4, text: 'Ground is likely still wet from recent rain' })
  } else if (rainLast2DaysIn >= 0.15) {
    score -= 1.5
    reasons.push({ key: 'damp', weight: 1.5, text: 'Ground may still be damp' })
  }

  if (precipChanceToday >= 60) {
    score -= 2.5
    reasons.push({ key: 'rain-today', weight: 2.5, text: 'High chance of rain today' })
  } else if (precipChanceToday >= 35) {
    score -= 1
    reasons.push({ key: 'rain-today-maybe', weight: 1, text: 'Rain possible today' })
  }

  if (windMph >= 15) {
    score -= 3
    reasons.push({ key: 'wind', weight: 3, text: 'High wind — drift risk if spraying' })
  } else if (windMph >= 10) {
    score -= 1
    reasons.push({ key: 'wind-mod', weight: 1, text: 'Breezy conditions' })
  }

  if (highF >= 95 || highF <= 40) {
    score -= 2
    reasons.push({ key: 'temp-extreme', weight: 2, text: 'Temperature extreme — stress risk to turf' })
  } else if (highF >= 90) {
    score -= 1
    reasons.push({ key: 'temp-hot', weight: 1, text: 'Hot — mow in cooler part of the day' })
  }

  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10))
  reasons.sort((a, b) => b.weight - a.weight)

  let label, tone
  if (score >= 8) {
    label = 'Great day to mow'
    tone = 'good'
  } else if (score >= 6) {
    label = 'OK day to mow'
    tone = 'caution'
  } else if (score >= 4) {
    label = reasons[0] ? `Marginal — ${reasons[0].text.toLowerCase()}` : 'Marginal day to mow'
    tone = 'caution'
  } else {
    label = reasons[0] ? `Wait — ${reasons[0].text.toLowerCase()}` : 'Wait to mow'
    tone = 'bad'
  }

  return { score, label, tone, reasons }
}
