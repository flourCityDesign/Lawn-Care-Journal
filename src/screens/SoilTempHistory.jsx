import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody } from '../components/ui'
import SoilTempChart from '../components/SoilTempChart'
import { SOIL_TEMP_DEPTH_NOTE, SPRING_GERMINATION_THRESHOLD_F, FALL_GERMINATION_THRESHOLD_F } from '../lib/weather'

const THRESHOLDS = [
  { value: SPRING_GERMINATION_THRESHOLD_F, label: '50° crabgrass', color: 'var(--accent-2)' },
  { value: FALL_GERMINATION_THRESHOLD_F, label: '70° Poa annua', color: 'var(--danger)' },
]

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export default function SoilTempHistory() {
  const { weatherCache } = useData()
  const history = weatherCache?.soilTempHistory || []

  if (history.length === 0) {
    return (
      <Page>
        <PageHeader title="Soil Temperature" backTo="/weather" />
        <Card>
          <CardBody>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              No soil temperature history yet. Open the Weather tab to fetch it.
            </div>
          </CardBody>
        </Card>
      </Page>
    )
  }

  const values = history.map((d) => d.avg)
  const latest = values[values.length - 1]
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const high = Math.max(...values)
  const low = Math.min(...values)

  return (
    <Page>
      <PageHeader title="Soil Temperature" subtitle="Extended history" backTo="/weather" />

      <Card>
        <CardBody>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Stat label="Latest" value={`${Math.round(latest)}°F`} />
            <Stat label="Avg" value={`${Math.round(avg)}°F`} />
            <Stat label="High" value={`${Math.round(high)}°F`} />
            <Stat label="Low" value={`${Math.round(low)}°F`} />
          </div>
          <div style={{ marginTop: 16 }}>
            <SoilTempChart data={history} thresholds={THRESHOLDS} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>{SOIL_TEMP_DEPTH_NOTE}</div>
        </CardBody>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Key Thresholds</div>
          {THRESHOLDS.map((t) => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: t.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{t.value}°F</span>{' '}
                <span style={{ color: 'var(--text-dim)' }}>
                  {t.value === SPRING_GERMINATION_THRESHOLD_F
                    ? '— crabgrass germination begins (spring warming)'
                    : '— Poa annua germination begins (fall cooling)'}
                </span>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/weather" style={{ color: 'var(--accent)', fontSize: 13 }}>
          Back to Weather
        </Link>
      </div>
    </Page>
  )
}
