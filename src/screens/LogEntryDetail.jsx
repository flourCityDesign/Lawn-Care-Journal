import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge, formatDate, formatRelativeDate } from '../components/ui'
import Icon from '../components/Icon'
import { CATEGORY_ICON, zoneLabelForApp } from '../lib/constants'
import { actualNLbs, appCoverageSqft } from '../lib/nitrogen'

function Row({ icon, label, children }) {
  return (
    <div className="list-row" style={{ padding: '14px 16px' }}>
      <IconBadge icon={icon} color="var(--text-dim)" size={32} iconSize={16} />
      <div className="list-row__body">
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{label}</div>
        <div style={{ fontWeight: 700, marginTop: 2 }}>{children}</div>
      </div>
    </div>
  )
}

export default function LogEntryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, zones, photos, deleteApplication } = useData()
  const app = applications.find((a) => a.id === id)

  if (!app) {
    return (
      <Page>
        <PageHeader title="Entry not found" backTo="/log" />
      </Page>
    )
  }

  const meta = CATEGORY_ICON[app.category] || CATEGORY_ICON.Other
  const zoneName = zoneLabelForApp(app, zones)
  const entryPhotos = (app.photoIds || []).map((pid) => photos.find((p) => p.id === pid)).filter(Boolean)

  const entryActualN = actualNLbs(app)
  const entryAreaSqft = appCoverageSqft(app, zones)
  const entryNRate = entryActualN > 0 && entryAreaSqft > 0 ? entryActualN / (entryAreaSqft / 1000) : null

  function handleDelete() {
    if (window.confirm('Delete this log entry?')) {
      deleteApplication(app.id)
      navigate('/log')
    }
  }

  return (
    <Page>
      <PageHeader
        title={app.category}
        backTo="/log"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/log/${app.id}/edit`} className="btn btn--secondary" aria-label="Edit entry">
              <Icon name="edit" size={16} />
            </Link>
            <button className="btn btn--danger" onClick={handleDelete} aria-label="Delete entry">
              <Icon name="trash" size={16} />
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <IconBadge icon={meta.icon} color={meta.color} size={72} iconSize={32} />
        <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 12 }}>
          {formatDate(app.date)} · {formatRelativeDate(app.date)}
        </div>
      </div>

      <Card>
        <Row icon="layers" label="Area Treated">
          {zoneName}
        </Row>

        {entryPhotos.length > 0 && (
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entryPhotos.map((p) => (
              <img
                key={p.id}
                src={p.dataUrl}
                alt=""
                style={{ width: '100%', maxWidth: 320, borderRadius: 12, display: 'block' }}
              />
            ))}
          </div>
        )}

        {app.cutHeight && (
          <Row icon="target" label="Cut Height">
            {app.cutHeight}
          </Row>
        )}
        {app.productName && (
          <Row icon="flask" label="Product">
            {app.productName}
          </Row>
        )}
        {app.rate && (
          <Row icon="bar-chart" label="Rate / Amount">
            {app.rate}
          </Row>
        )}
        {app.category === 'Fertilizer' && (app.nPercent || app.amountLbs) && (
          <Row icon="leaf" label="Nitrogen">
            <div>
              {app.amountLbs ? `${app.amountLbs} lbs product` : '—'}
              {app.nPercent ? ` @ ${app.nPercent}% N` : ''}
              {app.amountLbs && app.nPercent ? ` (${((app.amountLbs * app.nPercent) / 100).toFixed(2)} lbs actual N)` : ''}
            </div>
            {entryNRate != null && (
              <div style={{ fontWeight: 500, color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
                {entryNRate.toFixed(2)} lbs N / 1,000 sqft
              </div>
            )}
          </Row>
        )}
        {app.notes && (
          <Row icon="note" label="Notes">
            {app.notes}
          </Row>
        )}
      </Card>
    </Page>
  )
}
