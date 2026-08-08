import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge, EmptyState, formatRelativeDate } from '../components/ui'
import Icon from '../components/Icon'
import { appliesToZone } from '../lib/constants'

export default function Zones() {
  const { zones, applications } = useData()

  const zonesSorted = [...zones].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Page>
      <PageHeader
        title="My Zones"
        subtitle={`${zones.length} zone${zones.length === 1 ? '' : 's'}`}
        right={
          <Link to="/yards/new" className="btn btn--primary" aria-label="Add zone">
            <Icon name="plus" size={17} />
          </Link>
        }
      />

      {zones.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No zones yet"
          subtitle="Split your lawn into named areas — front yard, driveway edge, whole lawn — to track them separately."
          action="Add a zone"
          actionTo="/yards/new"
        />
      ) : (
        <Card>
          {zonesSorted.map((zone) => {
            const zoneApps = applications
              .filter((a) => appliesToZone(a, zone.id))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
            const last = zoneApps[0]
            return (
              <Link to={`/yards/${zone.id}`} className="link-row" key={zone.id}>
                <div className="list-row">
                  <IconBadge icon="leaf" color="var(--accent)" />
                  <div className="list-row__body">
                    <div className="list-row__title">{zone.name}</div>
                    <div className="list-row__subtitle">
                      {zone.sqft ? `${Number(zone.sqft).toLocaleString()} sqft` : 'No sqft set'}
                      {last ? ` · Last activity ${formatRelativeDate(last.date)}` : ' · No activity yet'}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </Page>
  )
}
