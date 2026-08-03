import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SidebarNav from '../components/layout/SidebarNav'
import TopHeader from '../components/layout/TopHeader'
import { branding } from '../theme/branding'

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={sidebarCollapsed ? 'app-shell app-shell-collapsed' : 'app-shell'}>
      <SidebarNav
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <div className="app-main">
        <TopHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
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
