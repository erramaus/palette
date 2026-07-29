import { NavLink } from 'react-router-dom'
import Logo from '../common/Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workshop-list', label: 'Workshop List' },
  { to: '/battle-plans', label: 'Battle Plans' },
  { to: '/about', label: 'About' },
  { to: '/orders', label: 'Orders' },
  { to: '/tags', label: 'Tags' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/shipping', label: 'Shipping' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

const SidebarNav = () => {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <Logo size="medium" showSubtitle showText className="sidebar-logo-block" />
      </div>
      <nav>
        <ul className="nav-list">
          {navItems.map((item) => (
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
      </nav>
    </aside>
  )
}

export default SidebarNav
