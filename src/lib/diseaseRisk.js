// Fungal disease risk score (1-10), derived entirely from weather data
// already fetched for the Weather tab - no separate API call. Loosely
// modeled on the Smith-Kerns Dollar Spot Model's two core inputs (average
// relative humidity + average air temp over a rolling window), generalized
// into a single pressure score with a seasonal disease label layered on
// top. A 5-day rolling window means the score decays on its own once
// conditions dry out, without needing an explicit "subtract" step.

const HIGH_RISK_RH = 90
const ROLLING_WINDOW = 5

function humidityPoints(avgRH) {
  if (avgRH == null) return 0
  if (avgRH >= 95) return 7
  if (avgRH >= 90) return 5.5
  if (avgRH >= 85) return 4
  if (avgRH >= 80) return 2.5
  if (avgRH >= 70) return 1
  return 0
}

// Most fungal pathogens favor a moderate temperature band; snow mold is the
// exception, favoring cold, near-freezing conditions under snow or wet cover.
function tempFavorabilityPoints(avgLow) {
  if (avgLow == null) return 0
  if (avgLow >= 55 && avgLow <= 85) return 2
  if (avgLow >= 32 && avgLow <= 40) return 1.5
  if (avgLow > 85) return 1
  return 0
}

function severityFor(score) {
  if (score >= 9) return 'severe'
  if (score >= 7) return 'high'
  if (score >= 4) return 'moderate'
  return 'low'
}

// Maps the 4 severity bands onto the app's 3-color status system
// (green/yellow/red) - high and severe both read as the "red" tone.
export function severityTone(severity) {
  if (severity === 'low') return 'good'
  if (severity === 'moderate') return 'caution'
  return 'bad'
}

function diseaseLabel(severity, dateKeyStr, avgLow, avgHigh, daySwing) {
  const severityWord = severity === 'moderate' ? 'Moderate' : severity === 'high' ? 'High' : 'Severe'
  if (severity === 'low') return 'Low risk'

  const month = Number(dateKeyStr.slice(5, 7))
  let disease = null
  if ((month === 12 || month <= 3) && avgLow != null && avgLow <= 40) {
    disease = 'Snow mold'
  } else if (month >= 4 && month <= 6 && avgLow != null && avgLow >= 55 && avgHigh <= 85 && daySwing >= 15) {
    disease = 'Dollar spot'
  } else if (month >= 7 && month <= 9 && avgLow != null && avgLow >= 68) {
    disease = 'Brown patch / pythium'
  }
  return disease ? `${severityWord} — ${disease} conditions` : `${severityWord} — Elevated humidity pressure`
}

function explanationFor(consecutiveHighRiskDays, avgRH) {
  if (consecutiveHighRiskDays >= 2) {
    return `${consecutiveHighRiskDays} consecutive nights above ${HIGH_RISK_RH}% humidity`
  }
  if (avgRH != null && avgRH >= 80) {
    return `Overnight humidity averaging ${Math.round(avgRH)}% over the last ${ROLLING_WINDOW} nights`
  }
  return 'Conditions currently below disease-favorable thresholds'
}

// dailyHistory: ascending array of { date, high, low, overnightRH, precipSum },
// most recent entry last (today). Returns the day-by-day score history plus
// a summary for the most recent day (score, label, severity, trend).
export function computeDiseaseRiskHistory(dailyHistory) {
  if (!dailyHistory || dailyHistory.length === 0) return { history: [], today: null }

  const history = dailyHistory.map((day, i) => {
    const windowDays = dailyHistory.slice(Math.max(0, i - ROLLING_WINDOW + 1), i + 1)
    const rhVals = windowDays.map((d) => d.overnightRH).filter((v) => v != null)
    const lowVals = windowDays.map((d) => d.low).filter((v) => v != null)
    const highVals = windowDays.map((d) => d.high).filter((v) => v != null)
    const avgRH = rhVals.length ? rhVals.reduce((s, v) => s + v, 0) / rhVals.length : null
    const avgLow = lowVals.length ? lowVals.reduce((s, v) => s + v, 0) / lowVals.length : null
    const avgHigh = highVals.length ? highVals.reduce((s, v) => s + v, 0) / highVals.length : null
    const daySwing = avgHigh != null && avgLow != null ? avgHigh - avgLow : 0

    let consecutive = 0
    for (let j = i; j >= 0; j--) {
      if (dailyHistory[j].overnightRH != null && dailyHistory[j].overnightRH >= HIGH_RISK_RH) consecutive++
      else break
    }
    const consecutiveBonus = Math.min(2, Math.max(0, (consecutive - 1) * 0.5))
    const swingBonus = daySwing >= 20 ? 1 : 0
    const rainBonus = (day.precipSum || 0) > 0.1 ? 1 : 0

    const raw = humidityPoints(avgRH) + tempFavorabilityPoints(avgLow) + consecutiveBonus + swingBonus + rainBonus
    const score = Math.min(10, Math.max(1, Math.round(raw)))
    const severity = severityFor(score)
    const label = diseaseLabel(severity, day.date, avgLow, avgHigh, daySwing)

    return { date: day.date, score, severity, label, consecutiveHighRiskDays: consecutive, avgRH, avgLow, avgHigh }
  })

  const todayEntry = history[history.length - 1]
  const prevEntry = history.length > 1 ? history[history.length - 2] : null
  let trend = 'steady'
  if (prevEntry) {
    if (todayEntry.score > prevEntry.score) trend = 'rising'
    else if (todayEntry.score < prevEntry.score) trend = 'falling'
  }

  const today = {
    ...todayEntry,
    trend,
    explanation: explanationFor(todayEntry.consecutiveHighRiskDays, todayEntry.avgRH),
  }

  return { history, today }
}
