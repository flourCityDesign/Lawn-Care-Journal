import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, SectionLabel, statusTone } from '../components/ui'
import Icon from '../components/Icon'
import SoilTempChart from '../components/SoilTempChart'
import { fetchWeather, weatherCodeLabel, SOIL_TEMP_DEPTH_NOTE, SPRING_GERMINATION_THRESHOLD_F, FALL_GERMINATION_THRESHOLD_F } from '../lib/weather'
import { computeMowScore } from '../lib/mow'
import { computeDiseaseRiskHistory, severityTone } from '../lib/diseaseRisk'
import { parseLocalDate } from '../lib/date'

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
    const isStale = !weatherCache || Date.now() - new Date(weatherCache.fetchedAt).getTime() > staleMs
    // A cache saved before a weatherCache field was added (e.g. dailyHistory
    // for Disease Risk) won't have it - treat that as stale too, so a new
    // feature shows up on next open instead of silently waiting out the hour.
    const missingFields = weatherCache && (!weatherCache.dailyHistory || weatherCache.soilTemp5DayAvg === undefined)
    if (isStale || missingFields) {
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

  const diseaseRisk = weatherCache ? computeDiseaseRiskHistory(weatherCache.dailyHistory, weatherCache.dailyForecast) : null

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

          {diseaseRisk?.today && (
            <>
              <SectionLabel icon="shield-alert">Disease Risk</SectionLabel>
              <Card>
                <CardBody>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 34, fontWeight: 800, color: statusTone(severityTone(diseaseRisk.today.severity)).color }}>
                          {diseaseRisk.today.score}
                        </span>
                        <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}>/10</span>
                      </div>
                      <div style={{ fontWeight: 700, marginTop: 2, color: statusTone(severityTone(diseaseRisk.today.severity)).color }}>
                        {diseaseRisk.today.label}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'capitalize' }}>{diseaseRisk.today.trend}</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>{diseaseRisk.today.explanation}</div>
                  {diseaseRisk.today.smithKernsPercent != null && (
                    <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-dim)' }}>
                      Dollar spot probability (Smith-Kerns model):{' '}
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{Math.round(diseaseRisk.today.smithKernsPercent)}%</span>
                    </div>
                  )}
                  {diseaseRisk.today.fidanzaE != null && (
                    <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-dim)' }}>
                      Brown patch index (Fidanza model):{' '}
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{diseaseRisk.today.fidanzaE.toFixed(1)}</span>{' '}
                      {diseaseRisk.today.fidanzaE >= 6 ? '(above warning threshold of 6)' : '(below warning threshold of 6)'}
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    {diseaseRisk.history.slice(-7).map((d, i, arr) => {
                      const daysAgo = arr.length - 1 - i
                      const label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`
                      return (
                        <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 78, fontSize: 12, color: 'var(--text-dim)', flexShrink: 0 }}>{label}</div>
                          <div style={{ flex: 1, height: 8, background: 'var(--card-alt)', borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${d.score * 10}%`,
                                background: statusTone(severityTone(d.severity)).color,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div style={{ width: 20, fontSize: 13, textAlign: 'right', flexShrink: 0 }}>{d.score}</div>
                        </div>
                      )
                    })}
                  </div>

                  {diseaseRisk.forecast.length > 0 && (
                    <>
                      <div
                        style={{
                          borderTop: '1px solid var(--card-border)',
                          marginTop: 8,
                          paddingTop: 14,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Next {diseaseRisk.forecast.length} Days
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {diseaseRisk.forecast.map((d) => (
                          <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 78, fontSize: 12, color: 'var(--text-dim)', flexShrink: 0 }}>
                              {parseLocalDate(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                            </div>
                            <div style={{ flex: 1, height: 8, background: 'var(--card-alt)', borderRadius: 999, overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${d.score * 10}%`,
                                  background: statusTone(severityTone(d.severity)).color,
                                  borderRadius: 999,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <div style={{ width: 20, fontSize: 13, textAlign: 'right', flexShrink: 0 }}>{d.score}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                        Forecast days are estimated from forecasted weather, not actuals - useful for planning a preventative
                        application ahead of rising risk
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                    Estimated from humidity and temperature trends, not a lab diagnosis
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          <SectionLabel icon="thermometer" action="Extended history" actionTo="/weather/soil-temp">
            Soil Temperature
          </SectionLabel>
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
                <SoilTempChart
                  data={weatherCache.soilTempHistory.slice(-7)}
                  thresholds={[
                    { value: SPRING_GERMINATION_THRESHOLD_F, label: '50° crabgrass', color: 'var(--accent-2)' },
                    { value: FALL_GERMINATION_THRESHOLD_F, label: '70° Poa annua', color: 'var(--danger)' },
                  ]}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>{SOIL_TEMP_DEPTH_NOTE}</div>
            </CardBody>
          </Card>

          <SectionLabel icon="calendar">7-Day Forecast</SectionLabel>
          <Card>
            {weatherCache.daily.map((d) => (
              <div className="list-row" key={d.date}>
                <div style={{ width: 44, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {parseLocalDate(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
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
