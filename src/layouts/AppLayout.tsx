import { Outlet } from 'react-router-dom'
import SidebarNav from '../components/layout/SidebarNav'
import TopHeader from '../components/layout/TopHeader'
import { branding } from '../theme/branding'

const AppLayout = () => {
  return (
    <div className="app-shell">
      <SidebarNav />
      <div className="app-main">
        <TopHeader />
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <p>{branding.footerPrimary}</p>
          <p>{branding.footerSecondary}</p>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
