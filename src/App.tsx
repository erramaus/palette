import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppStateContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import WorkshopListPage from './pages/WorkshopListPage'
import BattlePlansPage from './pages/BattlePlansPage'
import OrdersPage from './pages/OrdersPage'
import TagsPage from './pages/TagsPage'
import InventoryPage from './pages/InventoryPage'
import ShippingPage from './pages/ShippingPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import AboutPage from './pages/AboutPage'
import LoadingPage from './pages/LoadingPage'
import { branding } from './theme/branding'

function App() {
  useEffect(() => {
    document.title = branding.browserTitle
  }, [])

  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="workshop-list" element={<WorkshopListPage />} />
            <Route path="battle-plans" element={<BattlePlansPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="loading" element={<LoadingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}

export default App
