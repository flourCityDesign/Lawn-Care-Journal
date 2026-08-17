import { useState } from 'react'
import Icon from './Icon'
import { Card, CardBody, Button } from './ui'
import { ALL_ZONES_ID, ALL_ZONES_LABEL } from '../lib/constants'

// Shared year + zone picker for committing a draft Program Builder task (or
// a whole program) into a real Seasonal Plan task. Zone scope is only ever
// chosen here, at commit time - never baked into the draft itself.
export default function CommitDialog({ title, zones, defaultYear, onCommit, onCancel }) {
  const [year, setYear] = useState(defaultYear ?? new Date().getFullYear())
  const [zoneIds, setZoneIds] = useState([ALL_ZONES_ID])

  function toggleZone(id) {
    setZoneIds((prev) => {
      if (id === ALL_ZONES_ID) return prev.includes(ALL_ZONES_ID) ? [] : [ALL_ZONES_ID]
      const withoutAll = prev.filter((z) => z !== ALL_ZONES_ID)
      return withoutAll.includes(id) ? withoutAll.filter((z) => z !== id) : [...withoutAll, id]
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360 }}>
        <Card>
          <CardBody>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{title}</div>

            <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Year
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <button type="button" className="btn btn--secondary" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
                <Icon name="chevron-left" size={16} />
              </button>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{year}</div>
              <button type="button" className="btn btn--secondary" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Commit to
            </div>
            <div className="pill-row pill-row--wrap" style={{ marginBottom: 20 }}>
              <button
                type="button"
                className={'pill' + (zoneIds.includes(ALL_ZONES_ID) ? ' pill--active' : '')}
                onClick={() => toggleZone(ALL_ZONES_ID)}
              >
                {ALL_ZONES_LABEL}
              </button>
              {zones.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={'pill' + (zoneIds.includes(z.id) ? ' pill--active' : '')}
                  onClick={() => toggleZone(z.id)}
                >
                  {z.name}
                </button>
              ))}
            </div>

            {zoneIds.length === 0 && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>Pick at least one yard.</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button onClick={() => zoneIds.length > 0 && onCommit({ year, zoneIds })} disabled={zoneIds.length === 0} style={{ flex: 1 }}>
                Commit
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
