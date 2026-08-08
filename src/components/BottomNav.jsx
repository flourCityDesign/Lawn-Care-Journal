import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import './BottomNav.css'

const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/weather', label: 'Weather', icon: 'cloud-sun' },
  { to: '/log/new', label: 'Add', icon: 'plus', fab: true },
  { to: '/log', label: 'Log', icon: 'list' },
  { to: '/yards', label: 'Yards', icon: 'layers' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((tab) =>
        tab.fab ? (
          <NavLink key={tab.to} to={tab.to} className="bottom-nav__fab-wrap" aria-label={tab.label}>
            <span className="bottom-nav__fab">
              <Icon name="plus" size={26} strokeWidth={2.5} />
            </span>
          </NavLink>
        ) : (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')}
          >
            <Icon name={tab.icon} size={22} />
            <span>{tab.label}</span>
          </NavLink>
        )
      )}
    </nav>
  )
}
