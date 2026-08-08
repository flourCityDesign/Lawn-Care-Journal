export const SOIL_TEMP_DEPTH_NOTE = 'Soil temp measured at ~2.4" depth (Open-Meteo soil_temperature_6cm)'
export const GERMINATION_THRESHOLD_F = 50

export async function geocodeZip(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`)
  if (!res.ok) throw new Error('Zip code not found')
  const data = await res.json()
  const place = data.places?.[0]
  if (!place) throw new Error('Zip code not found')
  return {
    lat: Number(place.latitude),
    lon: Number(place.longitude),
    label: `${place['place name']}, ${place['state abbreviation']}`,
  }
}

function dateKey(isoString) {
  return isoString.slice(0, 10)
}

export async function fetchWeather({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code',
    hourly: 'soil_temperature_6cm',
    past_days: '7',
    forecast_days: '8',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!res.ok) throw new Error('Weather request failed')
  const data = await res.json()

  const todayKey = dateKey(data.current.time)

  // --- daily forecast (today forward) ---
  const daily = data.daily.time
    .map((date, i) => ({
      date,
      high: data.daily.temperature_2m_max[i],
      low: data.daily.temperature_2m_min[i],
      wind: data.daily.wind_speed_10m_max[i],
      precipChance: data.daily.precipitation_probability_max[i],
      precipSum: data.daily.precipitation_sum[i],
      weatherCode: data.daily.weather_code[i],
    }))
    .filter((d) => d.date >= todayKey)

  // --- rain history (past days, most recent last) ---
  const rainHistory = data.daily.time
    .map((date, i) => ({ date, amount: data.daily.precipitation_sum[i] ?? 0 }))
    .filter((d) => d.date < todayKey)
    .slice(-7)

  const todayIdx = data.daily.time.indexOf(todayKey)
  const precipChanceToday = todayIdx >= 0 ? data.daily.precipitation_probability_max[todayIdx] : 0
  const rainLast2DaysIn = rainHistory.slice(-2).reduce((sum, d) => sum + (d.amount || 0), 0)

  // --- soil temperature (hourly -> daily means -> 5-day rolling avg) ---
  const soilHourly = data.hourly.soil_temperature_6cm
  const soilTimes = data.hourly.time
  const byDay = new Map()
  soilTimes.forEach((t, i) => {
    const v = soilHourly[i]
    if (v == null) return
    const key = dateKey(t)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key).push(v)
  })
  const soilTempHistory = Array.from(byDay.entries())
    .map(([date, values]) => ({
      date,
      avg: values.reduce((s, v) => s + v, 0) / values.length,
    }))
    .filter((d) => d.date <= todayKey)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const last5Complete = soilTempHistory.slice(-5)
  const soilTemp5DayAvg =
    last5Complete.length > 0
      ? last5Complete.reduce((s, d) => s + d.avg, 0) / last5Complete.length
      : null

  const last24 = soilHourly.slice(-24).filter((v) => v != null)
  const soilTempLast24hAvg = last24.length > 0 ? last24.reduce((s, v) => s + v, 0) / last24.length : null

  return {
    fetchedAt: new Date().toISOString(),
    current: {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      high: todayIdx >= 0 ? data.daily.temperature_2m_max[todayIdx] : null,
      low: todayIdx >= 0 ? data.daily.temperature_2m_min[todayIdx] : null,
      precipChance: precipChanceToday,
    },
    daily,
    rainHistory,
    rainLast2DaysIn,
    rainWeekTotalIn: rainHistory.reduce((s, d) => s + (d.amount || 0), 0),
    soilTempHistory: soilTempHistory.slice(-14),
    soilTemp5DayAvg,
    soilTempLast24hAvg,
  }
}

// Rough day/night icon-agnostic conditions from WMO weather codes
export function weatherCodeLabel(code) {
  const map = {
    0: 'Clear',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Violent showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm',
  }
  return map[code] || 'Weather'
}
