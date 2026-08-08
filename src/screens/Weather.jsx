import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, SectionLabel, statusTone } from '../components/ui'
import Icon from '../components/Icon'
import SoilTempChart from '../components/SoilTempChart'
import { fetchWeather, weatherCodeLabel, SOIL_TEMP_DEPTH_NOTE, GERMINATION_THRESHOLD_F } from '../lib/weather'
import { computeMowScore } from '../lib/mow'

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function Weather() {
  const { settings, weatherCache, setWeatherCache } = useData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasLocation = settings.lat != null && settings.lon != null

  const refresh = useCallback(async () => {
    if (!hasLocation) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchWeather({ lat: settings.lat, lon: settings.lon })
      setWeatherCache(data)
    } catch (err) {
      console.error(err)
      setError('Could not reach the weather service. Showing cached data if available.')
    } finally {
      setLoading(false)
    }
  }, [hasLocation, settings.lat, settings.lon, setWeatherCache])

  useEffect(() => {
    if (!hasLocation) return
    const staleMs = 1000 * 60 * 60 // 1 hour
    if (!weatherCache || Date.now() - new Date(weatherCache.fetchedAt).getTime() > staleMs) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocation])

  if (!hasLocation) {
    return (
      <Page>
        <PageHeader title="Weather" />
        <Card>
          <CardBody>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No location set</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 12 }}>
              Add your zip code or coordinates in Settings to see mow conditions, rainfall, and soil temperature.
            </div>
            <Link to="/settings" className="btn btn--primary">
              Go to Settings
            </Link>
          </CardBody>
        </Card>
      </Page>
    )
  }

  const mow = weatherCache
    ? computeMowScore({
        rainLast2DaysIn: weatherCache.rainLast2DaysIn || 0,
        precipChanceToday: weatherCache.current?.precipChance || 0,
        windMph: weatherCache.current?.wind || 0,
        highF: weatherCache.current?.high ?? weatherCache.current?.temp ?? 70,
      })
    : null

  return (
    <Page>
      <PageHeader
        title="Weather"
        subtitle={settings.locationLabel}
        right={
          <button className="btn btn--secondary" onClick={refresh} disabled={loading} aria-label="Refresh weather">
            <Icon name={loading ? 'clock' : 'cloud'} size={16} />
          </button>
        }
      />

      {error && (
        <Card>
          <CardBody>
            <div style={{ color: 'var(--status-caution)', fontSize: 13 }}>{error}</div>
          </CardBody>
        </Card>
      )}

      {!weatherCache && loading && (
        <Card>
          <CardBody>
            <div style={{ color: 'var(--text-dim)' }}>Loading weather...</div>
          </CardBody>
        </Card>
      )}

      {weatherCache && (
        <>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="check-circle" size={20} style={{ color: statusTone(mow.tone).color }} />
                    <span style={{ fontWeight: 800, fontSize: 19, color: statusTone(mow.tone).color }}>{mow.label}</span>
                  </div>
                  <div className="home-stat-grid" style={{ marginTop: 12 }}>
                    <div>
                      <Icon name="thermometer" size={14} /> {Math.round(weatherCache.current.high)}° / {Math.round(weatherCache.current.low)}°
                    </div>
                    <div>
                      <Icon name="droplet" size={14} /> {Math.round(weatherCache.current.precipChance)}% rain
                    </div>
                    <div>
                      <Icon name="wind" size={14} /> {Math.round(weatherCache.current.wind)} mph wind
                    </div>
                    <div>
                      <Icon name="cloud" size={14} /> {Math.round(weatherCache.current.humidity)}% humidity
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Icon name="sun" size={30} style={{ color: 'var(--accent-2)' }} />
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{Math.round(weatherCache.current.temp)}°F</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{weatherCodeLabel(weatherCache.current.weatherCode)}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--card-border)', marginTop: 14, paddingTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="bar-chart" size={14} style={{ color: 'var(--text-dim)' }} />
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Mow score:</span>
                <span style={{ color: statusTone(mow.tone).color, fontWeight: 700, fontSize: 13 }}>{mow.score}/10</span>
              </div>
            </CardBody>
          </Card>

          <SectionLabel icon="droplet">Recent Rainfall</SectionLabel>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Last {weatherCache.rainHistory.length} days</span>
                <span style={{ fontWeight: 700 }}>{weatherCache.rainWeekTotalIn.toFixed(2)}" total</span>
              </div>
              {weatherCache.rainHistory.map((d, i) => {
                const maxAmount = Math.max(...weatherCache.rainHistory.map((r) => r.amount), 0.1)
                const daysAgo = weatherCache.rainHistory.length - i
                const label = daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`
                return (
                  <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 78, fontSize: 12, color: 'var(--text-dim)', flexShrink: 0 }}>{label}</div>
                    <div style={{ flex: 1, height: 8, background: 'var(--card-alt)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(2, (d.amount / maxAmount) * 100)}%`,
                          background: 'var(--accent)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div style={{ width: 42, fontSize: 13, textAlign: 'right', flexShrink: 0 }}>{d.amount.toFixed(2)}"</div>
                  </div>
                )
              })}
              {weatherCache.rainLast2DaysIn >= 0.15 && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-dim)' }}>
                  Ground may still be wet — mow scores adjusted down
                </div>
              )}
            </CardBody>
          </Card>

          <SectionLabel icon="thermometer">Soil Temperature</SectionLabel>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>5-Day Avg</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2 }}>
                    {weatherCache.soilTemp5DayAvg != null ? `${Math.round(weatherCache.soilTemp5DayAvg)}°F` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Last 24h</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2 }}>
                    {weatherCache.soilTempLast24hAvg != null ? `${Math.round(weatherCache.soilTempLast24hAvg)}°F` : '—'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <SoilTempChart data={weatherCache.soilTempHistory} threshold={GERMINATION_THRESHOLD_F} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>{SOIL_TEMP_DEPTH_NOTE}</div>
            </CardBody>
          </Card>

          <SectionLabel icon="calendar">7-Day Forecast</SectionLabel>
          <Card>
            {weatherCache.daily.map((d) => (
              <div className="list-row" key={d.date}>
                <div style={{ width: 44, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
                  <Icon name="droplet" size={13} /> {Math.round(d.precipChance)}%
                  <Icon name="wind" size={13} style={{ marginLeft: 8 }} /> {Math.round(d.wind)} mph
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {Math.round(d.high)}° <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>{Math.round(d.low)}°</span>
                </div>
              </div>
            ))}
          </Card>

          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, marginTop: 16 }}>
            Last updated {timeAgo(weatherCache.fetchedAt)}
          </div>
        </>
      )}
    </Page>
  )
}
