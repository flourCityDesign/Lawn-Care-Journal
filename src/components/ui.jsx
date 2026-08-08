import { Link } from 'react-router-dom'
import Icon from './Icon'
import { parseLocalDate } from '../lib/date'
import './ui.css'

export function Page({ children }) {
  return <div className="page">{children}</div>
}

export function PageHeader({ title, subtitle, backTo, right }) {
  return (
    <div>
      {backTo && (
        <Link to={backTo} className="back-link" style={{ marginBottom: 10 }}>
          <Icon name="chevron-left" size={18} /> Back
        </Link>
      )}
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

export function Card({ children, style }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  )
}

export function CardBody({ children, style }) {
  return (
    <div className="card__body" style={style}>
      {children}
    </div>
  )
}

export function SectionLabel({ icon, children, action, actionTo }) {
  return (
    <div className="section-label">
      {icon && <Icon name={icon} size={14} />}
      <span>{children}</span>
      <span className="section-label__spacer" />
      {action && (
        <Link to={actionTo} className="section-label__action">
          {action}
        </Link>
      )}
    </div>
  )
}

export function IconBadge({ icon, color = 'var(--accent)', size = 40, iconSize = 20 }) {
  return (
    <span
      className="icon-badge"
      style={{ width: size, height: size, background: `${color}22`, color }}
    >
      <Icon name={icon} size={iconSize} />
    </span>
  )
}

export function PillRow({ options, value, onChange }) {
  return (
    <div className="pill-row">
      {options.map((opt) => {
        const label = typeof opt === 'string' ? opt : opt.label
        const val = typeof opt === 'string' ? opt : opt.value
        return (
          <button
            key={val}
            type="button"
            className={'pill' + (val === value ? ' pill--active' : '')}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Button({ children, variant = 'primary', block, icon, ...rest }) {
  return (
    <button className={`btn btn--${variant}${block ? ' btn--block' : ''}`} {...rest}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

export function EmptyState({ icon = 'note', title, subtitle, action, actionTo }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon name={icon} size={32} />
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 14 }}>{subtitle}</div>}
      {action && actionTo && (
        <div style={{ marginTop: 16 }}>
          <Link to={actionTo} className="btn btn--primary">
            {action}
          </Link>
        </div>
      )}
    </div>
  )
}

export function statusTone(tone) {
  if (tone === 'good') return { color: 'var(--status-good)', bg: 'var(--status-good-bg)' }
  if (tone === 'caution') return { color: 'var(--status-caution)', bg: 'var(--status-caution-bg)' }
  return { color: 'var(--status-bad)', bg: 'var(--status-bad-bg)' }
}

export function ProgressBar({ pct, color = 'var(--accent)' }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  )
}

export function formatRelativeDate(dateStr) {
  const date = parseLocalDate(dateStr)
  const now = new Date()
  const diffMs = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
  const days = Math.round(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return `${days} days ago`
  if (days >= 7 && days < 14) return '1 week ago'
  if (days >= 14 && days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days >= 30 && days < 60) return '1 month ago'
  if (days >= 60 && days < 365) return `${Math.floor(days / 30)} months ago`
  if (days < 0) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''} ago`
}

export function formatDate(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function logMetaItems(app) {
  const items = []
  if (app.cutHeight) items.push({ icon: 'target', text: `Cut height: ${app.cutHeight}` })
  if (app.products?.length) {
    const unit = app.productType === 'liquid' ? 'oz' : 'lbs'
    app.products.forEach((p) => {
      const parts = []
      if (p.rate) parts.push(`${p.rate} ${unit}/1k sqft`)
      if (p.nPercent) parts.push(`${p.nPercent}% N`)
      items.push({ icon: 'flask', text: p.name || 'Product', sub: parts.join(' · ') || null })
    })
  } else if (app.productName) {
    items.push({ icon: 'flask', text: app.productName, sub: app.rate || null })
  } else if (app.rate) {
    items.push({ icon: 'flask', text: app.rate })
  }
  if (app.notes) items.push({ icon: 'note', text: app.notes })
  return items
}

export function LogCard({ to, icon, iconColor, title, subtitle, date, metaItems = [] }) {
  return (
    <Link to={to} className="link-row">
      <div className="log-card">
        <div className="log-card__header">
          <IconBadge icon={icon} color={iconColor} />
          <div className="list-row__body">
            <div className="list-row__title">{title}</div>
            {subtitle && <div className="list-row__subtitle">{subtitle}</div>}
          </div>
          <div className="log-card__date">
            <div className="log-card__date-abs">{formatDate(date)}</div>
            <div className="log-card__date-rel">{formatRelativeDate(date)}</div>
          </div>
        </div>
        {metaItems.length > 0 && (
          <div className="log-card__meta">
            {metaItems.map((m, i) => (
              <div className="log-card__meta-row" key={i}>
                <Icon name={m.icon} size={15} className="log-card__meta-icon" />
                <div className="log-card__meta-text">
                  {m.text}
                  {m.sub && <div className="log-card__meta-sub">{m.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
