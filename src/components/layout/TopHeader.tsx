import Logo from '../common/Logo'
import { useLocation } from 'react-router-dom'
import { branding } from '../../theme/branding'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workshop-list': 'Workshop List',
  '/battle-plans': 'Battle Plans',
  '/loading': 'Loading',
  '/orders': 'Orders',
  '/tags': 'Production Tags',
  '/inventory': 'Inventory',
  '/shipping': 'Shipping',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/import-center': 'Import Center',
  '/tools': 'Tools',
  '/tools/print-table-optimizer': 'Print Table Optimizer',
}

interface TopHeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

const TopHeader = ({ sidebarCollapsed, onToggleSidebar }: TopHeaderProps) => {
  const location = useLocation()
  const normalizedPath =
    location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const pageTitle =
    (normalizedPath.startsWith('/work-items/')
      ? 'Work Item Detail'
      : pageTitles[normalizedPath]) ??
    (normalizedPath === '/' ? 'Dashboard' : branding.appName)

  return (
    <header className="top-header">
      <div className="top-header-brand">
        <button
          type="button"
          className="top-header-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '>>' : '<<'}
        </button>
        <Logo size="small" showText={false} variant="dark" className="header-logo" />
        <div>
          <p className="top-header-product-name">{branding.appName} Enterprise</p>
          <h2>{pageTitle}</h2>
        </div>
      </div>

      <div className="top-header-controls">
        <label className="top-header-search" aria-label="Global search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search orders, work items, materials"
          />
        </label>

        <button type="button" className="top-header-icon-btn" aria-label="Notifications">
          !
          <span className="top-header-icon-ping" aria-hidden="true">3</span>
        </button>

        <div className="top-header-chip top-header-chip-date">Production Date: {todayLabel}</div>
        <div className="top-header-chip top-header-chip-health">Production Health: Stable</div>

        <button type="button" className="top-header-user-menu" aria-label="User menu">
          Director
        </button>
      </div>
    </header>
  )
}

export default TopHeader
