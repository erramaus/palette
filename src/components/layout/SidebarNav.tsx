import { NavLink } from 'react-router-dom'
import Logo from '../common/Logo'

const navSections = [
  {
    heading: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    heading: 'Production',
    items: [
      { to: '/workshop-list', label: 'Workshop List' },
      { to: '/battle-plans', label: 'Battle Plans' },
      { to: '/tags', label: 'Production Tags' },
      { to: '/timeline', label: 'Timeline' },
      { to: '/shipping', label: 'Shipping' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/orders', label: 'Orders' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/reports', label: 'Reports' },
      { to: '/settings', label: 'Settings' },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { to: '/tools/print-table-optimizer', label: 'Print Table Optimizer' },
    ],
  },
]

const SidebarNav = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-branding">
        <Logo size="medium" showText={false} variant="light" className="sidebar-logo-block" />
        <div className="sidebar-brand-text">
          <strong>PALETTE</strong>
          <span>PrintShop OS</span>
        </div>
      </div>
      <nav className="sidebar-sections">
        {navSections.map((section) => (
          <section key={section.heading}>
            <p className="sidebar-section-title">{section.heading}</p>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? 'nav-link nav-link-active' : 'nav-link'
                    }
                  >
                    {item.label}
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
