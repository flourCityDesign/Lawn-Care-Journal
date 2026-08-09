// Fungal disease risk score (1-10), derived entirely from weather data
// already fetched for the Weather tab - no separate API call.
//
// The core of the score is the real, published Smith-Kerns Dollar Spot
// Model (Smith & Kerns, 2018, PLOS ONE) - a logistic regression on 5-day
// rolling averages of daily mean relative humidity and daily mean air
// temperature, the same model Syngenta's GreenCast tool uses. It's only
// valid for dollar spot's active temperature range (50-95°F); outside that
// range (e.g. near-freezing snow mold territory) we fall back to a rough,
// unvalidated heuristic, clearly separated from the real model below.
//
// A handful of extra factors are layered on top of that base, generalizing
// it into an overall pressure score across multiple diseases: consecutive
// high-humidity nights (compounding pressure), a wide day/night swing
// (heavy dew even without rain), and recent rain (extends the wet-leaf
// window). The rolling window means the score decays on its own once
// conditions dry out, without needing an explicit "subtract" step.

const HIGH_RISK_RH = 90
const ROLLING_WINDOW = 5

// Smith-Kerns is only validated for 10-35°C (50-95°F) mean air temp - dollar
// spot isn't considered biologically active outside that range.
const SMITH_KERNS_MIN_TEMP_F = 50
const SMITH_KERNS_MAX_TEMP_F = 95

function fahrenheitToCelsius(f) {
  return (f - 32) * (5 / 9)
}

// Logit(μ) = -11.4041 + 0.0894·MEANRH + 0.1932·MEANAT(°C)
// P = e^Logit / (1 + e^Logit) x 100
export function smithKernsProbability(avgMeanRH, avgMeanTempF) {
  if (avgMeanRH == null || avgMeanTempF == null) return null
  if (avgMeanTempF < SMITH_KERNS_MIN_TEMP_F || avgMeanTempF > SMITH_KERNS_MAX_TEMP_F) return null
  const avgMeanTempC = fahrenheitToCelsius(avgMeanTempF)
  const logit = -11.4041 + 0.0894 * avgMeanRH + 0.1932 * avgMeanTempC
  const p = Math.exp(logit) / (1 + Math.exp(logit))
  return p * 100
}

// Fallback only used outside Smith-Kerns' valid range - NOT a validated
// model, just a rough stand-in weighted on the same 0-7 scale so the rest
// of the scoring math doesn't need to know which branch produced it.
function fallbackHumidityPoints(avgOvernightRH) {
  if (avgOvernightRH == null) return 0
  if (avgOvernightRH >= 95) return 7
  if (avgOvernightRH >= 90) return 5.5
  if (avgOvernightRH >= 85) return 4
  if (avgOvernightRH >= 80) return 2.5
  if (avgOvernightRH >= 70) return 1
  return 0
}

// Near-freezing + humid is snow mold's favorable window, sitting below
// Smith-Kerns' 50°F floor.
function fallbackColdBonus(avgLow) {
  if (avgLow == null) return 0
  if (avgLow >= 25 && avgLow <= 40) return 2
  return 0
}

// Maps the real Smith-Kerns probability onto our 1-10 scale, anchored to
// real-world reference points rather than a flat percentage: 20% is the
// model's own field-validated "effective suppression" action threshold, and
// ~40%/~52% roughly track GreenCast's own elevated/high bands. A flat
// linear scale (p/100 x 10) would bury a genuinely actionable 40-50%
// reading under our "moderate" band - this keeps the score's severity
// words meaning the same thing a turf manager would expect from the
// probability itself.
function scoreFromProbability(p) {
  if (p <= 0) return 1
  if (p < 20) return 1 + (p / 20) * 3 // 0-20%  -> 1-4 (low)
  if (p < 40) return 4 + ((p - 20) / 20) * 2 // 20-40% -> 4-6 (moderate)
  if (p < 52) return 6 + ((p - 40) / 12) * 1 // 40-52% -> 6-7 (moderate/high)
  if (p < 70) return 7 + ((p - 52) / 18) * 2 // 52-70% -> 7-9 (high)
  return Math.min(10, 9 + ((p - 70) / 30) * 1) // 70-100% -> 9-10 (severe)
}

function basePointsFor({ avgMeanRH, avgMeanTempF, avgOvernightRH, avgLow }) {
  const smithKernsPercent = smithKernsProbability(avgMeanRH, avgMeanTempF)
  if (smithKernsPercent != null) {
    return { points: scoreFromProbability(smithKernsPercent), smithKernsPercent }
  }
  return { points: fallbackHumidityPoints(avgOvernightRH) + fallbackColdBonus(avgLow), smithKernsPercent: null }
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

function diseaseLabel(severity, dateKeyStr, avgLow, smithKernsPercent) {
  if (severity === 'low') return 'Low risk'
  const severityWord = severity === 'moderate' ? 'Moderate' : severity === 'high' ? 'High' : 'Severe'

  const month = Number(dateKeyStr.slice(5, 7))
  let disease = null
  if (smithKernsPercent != null) {
    // Within Smith-Kerns' validated range - this score is specifically a
    // dollar spot signal by definition of the model.
    disease = 'Dollar spot'
  } else if ((month === 12 || month <= 3) && avgLow != null && avgLow <= 40) {
    disease = 'Snow mold'
  }
  return disease ? `${severityWord} — ${disease} conditions` : `${severityWord} — Elevated humidity pressure`
}

function explanationFor(consecutiveHighRiskDays, avgOvernightRH, severity) {
  if (consecutiveHighRiskDays >= 2) {
    return `${consecutiveHighRiskDays} consecutive nights above ${HIGH_RISK_RH}% humidity`
  }
  if (avgOvernightRH != null && avgOvernightRH >= 80) {
    return `Overnight humidity averaging ${Math.round(avgOvernightRH)}% over the last ${ROLLING_WINDOW} nights`
  }
  // The score is driven by true daily-mean humidity/temp (Smith-Kerns), which
  // can be elevated even when the overnight-only window above isn't - so
  // only call conditions "below thresholds" when severity agrees.
  if (severity === 'low') {
    return 'Conditions currently below disease-favorable thresholds'
  }
  return 'Daytime humidity and temperature trending toward disease-favorable conditions'
}

function average(vals) {
  const clean = vals.filter((v) => v != null)
  return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : null
}

// dailyHistory: ascending array of { date, high, low, overnightRH, meanRH,
// meanTempF, precipSum }, most recent entry last (today). dailyForecast:
// same shape, continuing after today. Returns the day-by-day score history,
// a summary for today, and (if dailyForecast is given) the forecast days
// scored with the exact same rolling math - today's actuals just feed the
// early forecast days' rolling windows, same as the real Smith-Kerns tool.
export function computeDiseaseRiskHistory(dailyHistory, dailyForecast = []) {
  if (!dailyHistory || dailyHistory.length === 0) return { history: [], today: null, forecast: [] }

  const combined = [...dailyHistory, ...dailyForecast]

  const scored = combined.map((day, i) => {
    const windowDays = combined.slice(Math.max(0, i - ROLLING_WINDOW + 1), i + 1)
    const avgOvernightRH = average(windowDays.map((d) => d.overnightRH))
    const avgLow = average(windowDays.map((d) => d.low))
    const avgHigh = average(windowDays.map((d) => d.high))
    const avgMeanRH = average(windowDays.map((d) => d.meanRH))
    const avgMeanTempF = average(windowDays.map((d) => d.meanTempF))
    const daySwing = avgHigh != null && avgLow != null ? avgHigh - avgLow : 0

    let consecutive = 0
    for (let j = i; j >= 0; j--) {
      if (combined[j].overnightRH != null && combined[j].overnightRH >= HIGH_RISK_RH) consecutive++
      else break
    }
    // Small nudges on top of the base score, not primary drivers - sustained
    // humidity is already reflected in the rolling RH average feeding the
    // base score itself, so these only add the extra signal a plain average
    // misses (e.g. leaf-wetness duration from a real streak, or dew from a
    // wide swing), without being able to swing the score by a full severity
    // band on their own.
    const consecutiveBonus = Math.min(1, Math.max(0, (consecutive - 2) * 0.5))
    const swingBonus = daySwing >= 20 ? 0.5 : 0
    const rainBonus = (day.precipSum || 0) > 0.1 ? 0.5 : 0

    const { points: basePoints, smithKernsPercent } = basePointsFor({ avgMeanRH, avgMeanTempF, avgOvernightRH, avgLow })
    const raw = basePoints + consecutiveBonus + swingBonus + rainBonus
    const score = Math.min(10, Math.max(1, Math.round(raw)))
    const severity = severityFor(score)
    const label = diseaseLabel(severity, day.date, avgLow, smithKernsPercent)

    return {
      date: day.date,
      score,
      severity,
      label,
      consecutiveHighRiskDays: consecutive,
      avgRH: avgOvernightRH,
      avgLow,
      avgHigh,
      smithKernsPercent,
      isForecast: i >= dailyHistory.length,
    }
  })

  const todayIndex = dailyHistory.length - 1
  const todayEntry = scored[todayIndex]
  const prevEntry = todayIndex > 0 ? scored[todayIndex - 1] : null
  let trend = 'steady'
  if (prevEntry) {
    if (todayEntry.score > prevEntry.score) trend = 'rising'
    else if (todayEntry.score < prevEntry.score) trend = 'falling'
  }

  const today = {
    ...todayEntry,
    trend,
    explanation: explanationFor(todayEntry.consecutiveHighRiskDays, todayEntry.avgRH, todayEntry.severity),
  }

  return {
    history: scored.slice(0, todayIndex + 1),
    today,
    forecast: scored.slice(todayIndex + 1),
  }
}
