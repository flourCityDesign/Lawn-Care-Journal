import { useRef, useState } from 'react'
import { Card, CardBody, ProgressBar, statusTone } from './ui'
import { nitrogenStatus } from '../lib/nitrogen'

export default function NBudgetCard({ pages, cap }) {
  const scrollRef = useRef(null)
  const [index, setIndex] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {pages.map((p) => {
            const tone = nitrogenStatus(p.per1000, cap)
            const color = statusTone(tone === 'ok' ? 'good' : tone === 'caution' ? 'caution' : 'bad').color
            return (
              <div
                key={p.id}
                style={{ flex: '0 0 100%', scrollSnapAlign: 'center', padding: '16px 16px 2px', boxSizing: 'border-box' }}
              >
                <div
                  style={{
                    color: 'var(--text-dim)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color }}>
                  {p.per1000.toFixed(1)} <span style={{ fontSize: 15, color: 'var(--text-dim)', fontWeight: 600 }}>/ {cap}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar pct={(p.per1000 / cap) * 100} color={color} />
                </div>
              </div>
            )
          })}
        </div>
        {pages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 6, paddingBottom: 12 }}>
            {pages.map((p, i) => (
              <span
                key={p.id}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: i === index ? 'var(--accent-2)' : 'var(--card-border)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
