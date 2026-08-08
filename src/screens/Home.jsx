import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, Card, CardBody, IconBadge, SectionLabel, ProgressBar, formatRelativeDate, statusTone } from '../components/ui'
import Icon from '../components/Icon'
import NBudgetCard from '../components/NBudgetCard'
import { CATEGORY_ICON, appliesToZone, zoneLabelForApp } from '../lib/constants'
import { computeMowScore } from '../lib/mow'
import { bentgrassStatus } from '../lib/bentgrass'
import { nitrogenYtdByZone } from '../lib/nitrogen'
import './Home.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()
  const { zones, applications, planTasks, ensureYearPlan, settings, weatherCache } = useData()
  const year = new Date().getFullYear()

  useEffect(() => {
    ensureYearPlan(year)
  }, [ensureYearPlan, year])

  const recent = useMemo(
    () => [...applications].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4),
    [applications]
  )

  const yearTasks = planTasks.filter((t) => t.year === year)
  const doneCount = yearTasks.filter((t) => t.completed).length
  const planPct = yearTasks.length ? Math.round((doneCount / yearTasks.length) * 100) : 0

  const bStatus = bentgrassStatus(applications, settings.bentgrassSeasonCap, settings.bentgrassRetreatDays, year)
  const nBudgetPages = nitrogenYtdByZone(applications, zones, year)

  const mow = weatherCache
    ? computeMowScore({
        rainLast2DaysIn: weatherCache.rainLast2DaysIn || 0,
        precipChanceToday: weatherCache.current?.precipChance || 0,
        windMph: weatherCache.current?.wind || 0,
        highF: weatherCache.current?.high ?? weatherCache.current?.temp ?? 70,
      })
    : null

  function quickAdd(category) {
    navigate('/log/new', { state: { category } })
  }

  return (
    <Page>
      <div className="home-header">
        <div>
          <div className="home-header__greeting">{greeting()}</div>
          <h1 className="home-header__title">Lawn Journal</h1>
        </div>
        <Link to="/settings" className="home-header__avatar" aria-label="Settings">
          <Icon name="user" size={20} />
        </Link>
      </div>

      {weatherCache ? (
        <Link to="/weather" className="link-row">
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="check-circle" size={20} style={{ color: statusTone(mow.tone).color }} />
                    <span style={{ fontWeight: 800, fontSize: 18, color: statusTone(mow.tone).color }}>{mow.label}</span>
                  </div>
                  <div className="home-stat-grid">
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
                      <Icon name="bar-chart" size={14} /> Mow score {mow.score}/10
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Icon name="sun" size={28} style={{ color: 'var(--accent-2)' }} />
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{Math.round(weatherCache.current.temp)}°F</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      ) : (
        <Card>
          <CardBody>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Set up your location</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 12 }}>
              Add a location to see today's mow score, rainfall, and soil temperature.
            </div>
            <Link to="/settings" className="btn btn--primary">
              Go to Settings
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="quick-actions">
        <button className="quick-action" onClick={() => quickAdd('Mow')}>
          <IconBadge icon="scissors" color="var(--accent)" size={48} iconSize={22} />
          <span>Log Mow</span>
        </button>
        <button className="quick-action" onClick={() => quickAdd('Fertilizer')}>
          <IconBadge icon="flask" color="var(--accent-2)" size={48} iconSize={22} />
          <span>Treatment</span>
        </button>
        <button className="quick-action" onClick={() => quickAdd('Other')}>
          <IconBadge icon="camera" color="var(--text)" size={48} iconSize={22} />
          <span>Add Note</span>
        </button>
      </div>

      <SectionLabel icon="flask" action="View log" actionTo="/log">
        This Season
      </SectionLabel>
      <div className="stat-tile-row">
        <Card>
          <CardBody>
            <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Bentgrass Apps</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: bStatus.atCap ? 'var(--status-bad)' : 'var(--text)' }}>
              {bStatus.count} <span style={{ fontSize: 15, color: 'var(--text-dim)', fontWeight: 600 }}>/ {bStatus.cap}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <ProgressBar
                pct={(bStatus.count / bStatus.cap) * 100}
                color={bStatus.atCap ? 'var(--status-bad)' : 'var(--accent)'}
              />
            </div>
          </CardBody>
        </Card>
        <NBudgetCard pages={nBudgetPages} cap={settings.nitrogenAnnualCap} />
      </div>

      <SectionLabel icon="layers" action="See all" actionTo="/yards">
        My Yards
      </SectionLabel>
      {zones.length === 0 ? (
        <Card>
          <CardBody>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              No zones yet.{' '}
              <Link to="/yards/new" style={{ color: 'var(--accent)' }}>
                Add your first zone
              </Link>
              .
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="yard-scroll">
          {zones.map((zone) => {
            const last = applications
              .filter((a) => appliesToZone(a, zone.id))
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            return (
              <Link to={`/yards/${zone.id}`} key={zone.id} className="yard-card">
                <IconBadge icon="leaf" color="var(--accent)" size={36} iconSize={18} />
                <div className="yard-card__name">{zone.name}</div>
                <div className="yard-card__meta">
                  {zone.sqft ? `${Number(zone.sqft).toLocaleString()} sqft` : 'No sqft'}
                </div>
                <div className="yard-card__meta">{last ? formatRelativeDate(last.date) : 'No activity'}</div>
              </Link>
            )
          })}
        </div>
      )}

      <SectionLabel icon="calendar" action="View plan" actionTo="/plan">
        Seasonal Plan
      </SectionLabel>
      <Link to="/plan" className="link-row">
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 700 }}>
                {doneCount} of {yearTasks.length} done
              </div>
              <div style={{ color: 'var(--accent-2)', fontWeight: 800 }}>{planPct}%</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <ProgressBar pct={planPct} color="var(--accent-2)" />
            </div>
          </CardBody>
        </Card>
      </Link>

      <SectionLabel icon="clock" action="View all" actionTo="/log">
        Recent Activity
      </SectionLabel>
      {recent.length === 0 ? (
        <Card>
          <CardBody>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nothing logged yet.</div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          {recent.map((app) => {
            const meta = CATEGORY_ICON[app.category] || CATEGORY_ICON.Other
            return (
              <Link to={`/log/${app.id}`} className="link-row" key={app.id}>
                <div className="list-row">
                  <IconBadge icon={meta.icon} color={meta.color} />
                  <div className="list-row__body">
                    <div className="list-row__title">{app.category}</div>
                    <div className="list-row__subtitle">{zoneLabelForApp(app, zones)}</div>
                  </div>
                  <div className="list-row__meta">{formatRelativeDate(app.date)}</div>
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </Page>
  )
}
