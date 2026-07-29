import Logo from '../common/Logo'
import { useLocation } from 'react-router-dom'
import { branding } from '../../theme/branding'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workshop-list': 'Workshop List',
  '/battle-plans': 'Battle Plans',
  '/about': 'About',
  '/loading': 'Loading',
  '/orders': 'Orders',
  '/tags': 'Tags',
  '/inventory': 'Inventory',
  '/shipping': 'Shipping',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

const TopHeader = () => {
  const location = useLocation()
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const pageTitle = pageTitles[location.pathname] ?? branding.appName

  return (
    <header className="top-header">
      <div className="top-header-brand">
        <Logo size="small" showText={false} showSubtitle={false} className="header-logo" />
        <div>
          <h2>{pageTitle}</h2>
          <p>{branding.fullSubtitle}</p>
        </div>
      </div>
      <div className="top-header-date">{todayLabel}</div>
    </header>
  )
}

export default TopHeader
