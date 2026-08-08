import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge, PillRow, EmptyState, formatRelativeDate } from '../components/ui'
import Icon from '../components/Icon'
import { CATEGORY_ICON, LOG_FILTERS, ALL_ZONES_ID, ALL_ZONES_LABEL, filterGroupForCategory, appliesToZone } from '../lib/constants'
import { groupByMonth } from '../lib/dateGroups'

export default function Log() {
  const { applications, zones } = useData()
  const [filter, setFilter] = useState('All')
  const [zoneFilter, setZoneFilter] = useState('All')

  const zoneOptions = useMemo(
    () => ['All', ...zones.map((z) => z.name)],
    [zones]
  )

  const filtered = useMemo(() => {
    return applications
      .filter((a) => filter === 'All' || filterGroupForCategory(a.category) === filter)
      .filter((a) => {
        if (zoneFilter === 'All') return true
        const zone = zones.find((z) => z.name === zoneFilter)
        return zone && appliesToZone(a, zone.id)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [applications, filter, zoneFilter, zones])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  function zoneLabel(zoneId) {
    if (zoneId === ALL_ZONES_ID) return ALL_ZONES_LABEL
    return zones.find((z) => z.id === zoneId)?.name || 'Deleted zone'
  }

  return (
    <Page>
      <PageHeader
        title="Log"
        subtitle="Maintenance history"
        right={
          <Link to="/log/new" className="btn btn--primary" aria-label="Add log entry">
            <Icon name="plus" size={17} />
          </Link>
        }
      />

      <PillRow options={LOG_FILTERS} value={filter} onChange={setFilter} />
      <div style={{ height: 8 }} />
      <PillRow options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />

      <div style={{ height: 18 }} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="list"
          title="No entries match these filters"
          subtitle={applications.length === 0 ? 'Log your first mow or treatment to get started.' : undefined}
          action={applications.length === 0 ? 'Log an entry' : undefined}
          actionTo={applications.length === 0 ? '/log/new' : undefined}
        />
      ) : (
        groups.map((group) => (
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
                          {zoneLabel(app.zoneId)}
                          {app.productName ? ` · ${app.productName}` : ''}
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
