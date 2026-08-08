const WIDTH = 328
const HEIGHT = 140
const PAD_L = 30
const PAD_R = 8
const PAD_T = 10
const PAD_B = 22

export default function SoilTempChart({ data, threshold }) {
  if (!data || data.length < 2) {
    return <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Not enough soil temperature history yet.</div>
  }

  const values = data.map((d) => d.avg)
  const minV = Math.min(threshold, ...values) - 3
  const maxV = Math.max(threshold, ...values) + 3
  const innerW = WIDTH - PAD_L - PAD_R
  const innerH = HEIGHT - PAD_T - PAD_B

  const x = (i) => PAD_L + (i / (data.length - 1)) * innerW
  const y = (v) => PAD_T + innerH - ((v - minV) / (maxV - minV)) * innerH

  const linePoints = data.map((d, i) => `${x(i)},${y(d.avg)}`).join(' ')
  const thresholdY = y(threshold)

  const labelEvery = Math.ceil(data.length / 5)

  return (
    <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Soil temperature trend">
      <line x1={PAD_L} y1={thresholdY} x2={WIDTH - PAD_R} y2={thresholdY} stroke="var(--accent-2)" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={WIDTH - PAD_R} y={thresholdY - 5} fill="var(--accent-2)" fontSize="10" textAnchor="end">
        {threshold}° threshold
      </text>

      <polyline points={linePoints} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) =>
        i === data.length - 1 ? (
          <circle key={d.date} cx={x(i)} cy={y(d.avg)} r="3.5" fill="var(--accent)" />
        ) : null
      )}

      {[minV, (minV + maxV) / 2, maxV].map((v) => (
        <text key={v} x={2} y={y(v) + 3} fill="var(--text-faint)" fontSize="9">
          {Math.round(v)}°
        </text>
      ))}

      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={d.date} x={x(i)} y={HEIGHT - 4} fill="var(--text-faint)" fontSize="9" textAnchor="middle">
            {new Date(d.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
          </text>
        ) : null
      )}
    </svg>
  )
}
