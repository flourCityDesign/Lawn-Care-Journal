import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, IconBadge, ProgressBar, EmptyState, formatRelativeDate, formatDate } from '../components/ui'
import Icon from '../components/Icon'
import { CATEGORY_ICON, ALL_ZONES_ID, appliesToZone } from '../lib/constants'
import { bentgrassZoneHistory } from '../lib/bentgrass'
import { nitrogenYtdByZone } from '../lib/nitrogen'
import { groupByMonth } from '../lib/dateGroups'

export default function ZoneDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { zones, applications, deleteZone, settings } = useData()
  const zone = zones.find((z) => z.id === id)

  if (!zone) {
    return (
      <Page>
        <PageHeader title="Zone not found" backTo="/yards" />
      </Page>
    )
  }

  const history = applications
    .filter((a) => appliesToZone(a, zone.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const historyGroups = groupByMonth(history)

  const year = new Date().getFullYear()
  const nPages = nitrogenYtdByZone(applications, zones, year)
  const nPage = nPages.find((p) => p.id === zone.id)
  const nCap = settings.nitrogenAnnualCap
  const nOverBudget = nCap > 0 && nPage.per1000 > nCap
  const nColor = nOverBudget ? 'var(--status-bad)' : 'var(--status-good)'

  const bentgrassHistory = bentgrassZoneHistory(applications, zone.id)
  const lastBentgrass = bentgrassHistory[0]
  let safeAfter = null
  if (lastBentgrass) {
    const d = new Date(lastBentgrass.date)
    d.setDate(d.getDate() + Number(settings.bentgrassRetreatDays || 21))
    safeAfter = d
  }

  function handleDelete() {
    if (window.confirm(`Delete "${zone.name}"? This won't delete its logged applications.`)) {
      deleteZone(zone.id)
      navigate('/yards')
    }
  }

  return (
    <Page>
      <PageHeader
        title={zone.name}
        backTo="/yards"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/yards/${zone.id}/edit`} className="btn btn--secondary" aria-label="Edit zone">
              <Icon name="edit" size={16} />
            </Link>
            <button className="btn btn--danger" onClick={handleDelete} aria-label="Delete zone">
              <Icon name="trash" size={16} />
            </button>
          </div>
        }
      />

      <Card>
        <CardBody>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                Square Footage
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                {zone.sqft ? Number(zone.sqft).toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                Log Entries
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{history.length}</div>
            </div>
          </div>
          {zone.notes && (
            <p style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5 }}>{zone.notes}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <IconBadge icon="leaf" color={nColor} size={32} iconSize={16} />
            <div style={{ fontWeight: 700 }}>N Budget</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: nColor }}>
            {nPage.per1000.toFixed(1)}{' '}
            <span style={{ fontSize: 15, color: 'var(--text-dim)', fontWeight: 600 }}>/ {nCap} lbs N/1,000 sqft</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar pct={nCap > 0 ? (nPage.per1000 / nCap) * 100 : 0} color={nColor} />
          </div>
        </CardBody>
      </Card>

      {lastBentgrass && (
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <IconBadge icon="flask" color="#FF6B6B" size={32} iconSize={16} />
              <div style={{ fontWeight: 700 }}>Bentgrass treatment</div>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 6 }}>
              {bentgrassHistory.length} application{bentgrassHistory.length === 1 ? '' : 's'} this season · last on{' '}
              {formatDate(lastBentgrass.date)}
            </div>
            {safeAfter && (
              <div style={{ color: 'var(--status-caution)', fontSize: 13, marginTop: 6 }}>
                Safe to re-treat on or after {formatDate(safeAfter)}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <div className="section-label">
        <Icon name="list" size={14} />
        <span>History</span>
      </div>

      {history.length === 0 ? (
        <EmptyState icon="note" title="No activity logged for this zone yet" />
      ) : (
        historyGroups.map((group) => (
          <div key={group.key}>
            <div className="month-label">{group.label}</div>
            <Card>
              {group.items.map((app) => {
                const meta = CATEGORY_ICON[app.category] || CATEGORY_ICON.Other
                return (
                  <Link to={`/log/${app.id}`} className="link-row" key={app.id}>
                    <div className="list-row">
                      <IconBadge icon={meta.icon} color={meta.color} />
                      <div className="list-row__body">
                        <div className="list-row__title">{app.category}</div>
                        <div className="list-row__subtitle">
                          {app.zoneId === ALL_ZONES_ID ? 'Whole Lawn · ' : ''}
                          {app.productName || app.notes || '—'}
                        </div>
                      </div>
                      <div className="list-row__meta">{formatRelativeDate(app.date)}</div>
                    </div>
                  </Link>
                )
              })}
            </Card>
          </div>
        ))
      )}
    </Page>
  )
}
