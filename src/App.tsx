import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppStateContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import WorkshopListPage from './pages/WorkshopListPage'
import BattlePlansPage from './pages/BattlePlansPage'
import OrdersPage from './pages/OrdersPage'
import TagsPage from './pages/TagsPage'
import TimelinePage from './pages/TimelinePage'
import InventoryPage from './pages/InventoryPage'
import ShippingPage from './pages/ShippingPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import LoadingPage from './pages/LoadingPage'
import WorkItemDetailPage from './pages/WorkItemDetailPage'
import ToolsPage from './pages/tools/ToolsPage'
import PrintTableOptimizerPage from './pages/tools/PrintTableOptimizerPage'
import { branding } from './theme/branding'

function App() {
  useEffect(() => {
    document.title = branding.browserTitle
  }, [])

  return (
    <AppStateProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="workshop-list" element={<WorkshopListPage />} />
            <Route path="work-items/:id" element={<WorkItemDetailPage />} />
            <Route path="battle-plans" element={<BattlePlansPage />} />
            <Route path="loading" element={<LoadingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/print-table-optimizer" element={<PrintTableOptimizerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}

export default App
