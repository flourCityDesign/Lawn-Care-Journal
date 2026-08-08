import { Link } from 'react-router-dom'
import Icon from './Icon'
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
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.setHours(0, 0, 0, 0) - new Date(dateStr).setHours(0, 0, 0, 0)
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
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
