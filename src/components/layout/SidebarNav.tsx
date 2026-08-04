import { NavLink } from 'react-router-dom'
import Logo from '../common/Logo'

const navSections = [
  {
    heading: 'Core',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'D' },
      { to: '/orders', label: 'Orders', icon: 'O' },
    ],
  },
  {
    heading: 'Production',
    items: [
      { to: '/workshop-list', label: 'Workshop List', icon: 'W' },
      { to: '/battle-plans', label: 'Battle Plans', icon: 'B' },
      { to: '/tags', label: 'Production Tags', icon: 'T' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/inventory', label: 'Inventory', icon: 'I' },
      { to: '/import-center', label: 'Import Center', icon: 'C' },
      { to: '/shipping', label: 'Shipping', icon: 'H' },
      { to: '/tools', label: 'Tools', icon: 'U' },
      { to: '/reports', label: 'Reports', icon: 'R' },
      { to: '/settings', label: 'Settings', icon: 'S' },
    ],
  },
]

interface SidebarNavProps {
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

const SidebarNav = ({ isCollapsed, onToggleCollapsed }: SidebarNavProps) => {
  return (
    <aside className={isCollapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-branding">
        <Logo size="medium" showText={false} variant="light" className="sidebar-logo-block" />
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? '>>' : '<<'}
        </button>
        <div className={isCollapsed ? 'sidebar-brand-text sidebar-brand-text-hidden' : 'sidebar-brand-text'}>
          <strong>PALETTE</strong>
          <span>PrintShop OS</span>
        </div>
      </div>
      <nav className="sidebar-sections">
        {navSections.map((section) => (
          <section key={section.heading}>
            <p className={isCollapsed ? 'sidebar-section-title sidebar-section-title-collapsed' : 'sidebar-section-title'}>
              {section.heading}
            </p>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? 'nav-link nav-link-active' : 'nav-link'
                    }
                    title={item.label}
                  >
                    <span className="nav-link-icon" aria-hidden="true">{item.icon}</span>
                    <span className={isCollapsed ? 'nav-link-text nav-link-text-hidden' : 'nav-link-text'}>
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  )
}

export default SidebarNav
