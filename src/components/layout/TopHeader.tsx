import { useEffect, useMemo, useRef, useState } from 'react'
import Logo from '../common/Logo'
import { useLocation, useNavigate } from 'react-router-dom'
import { branding } from '../../theme/branding'
import { useAppState } from '../../state/AppStateContext'
import { getWorkshopListUiEnvironment } from '../../services/workshopListUiBootstrap'
import { createWorkItemNavigationResolver } from '../../services/workItemNavigationResolver'
import { WarehouseInventoryImportService } from '../../services/WarehouseInventoryImportService'
import type { InventoryFoundationState } from '../../types/inventory'

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

type AlertSeverity = 'Critical' | 'Warning' | 'Info'

type AlertCategory =
  | 'Late Orders'
  | 'Blocked Operations'
  | 'Material Shortages'
  | 'Inventory Needs Review'
  | 'Purchase Orders Awaiting Approval'
  | 'CSWs Awaiting Approval'
  | 'System Warnings'

type AlertTarget =
  | { kind: 'work-item'; workItemId: string }
  | { kind: 'inventory-item'; inventoryItemId: string }
  | { kind: 'purchase-order'; purchaseOrderId: string }
  | { kind: 'csw'; cswDocumentId: string }
  | { kind: 'inventory-page' }

interface NotificationAlert {
  id: string
  category: AlertCategory
  severity: AlertSeverity
  title: string
  description: string
  relatedEntity: string
  createdAt: string
  target: AlertTarget
}

const inventoryService = new WarehouseInventoryImportService()

const severityClass: Record<AlertSeverity, string> = {
  Critical: 'critical',
  Warning: 'warning',
  Info: 'info',
}

const severityFromRisk = (riskLevel: string): AlertSeverity => {
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') return 'Critical'
  if (riskLevel === 'MEDIUM' || riskLevel === 'LOW') return 'Warning'
  return 'Info'
}

const readInventoryState = (): InventoryFoundationState | null => {
  try {
    const loaded = inventoryService.load()
    return inventoryService.importFromSeed(loaded)
  } catch {
    return null
  }
}

const formatAlertTime = (value: string): string => new Date(value).toLocaleString()

const TopHeader = ({ sidebarCollapsed, onToggleSidebar }: TopHeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    productionJobs,
    operationBattlePlanItems,
    productionOperations,
    persistenceWarning,
  } = useAppState()
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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

  const environment = useMemo(() => getWorkshopListUiEnvironment(), [])
  const resolver = useMemo(
    () => createWorkItemNavigationResolver({
      workItems: environment.workItemService.listWorkItems(),
      productionJobs,
      productionOperations,
      getWorkItemIdForOrderNumber: environment.getWorkItemIdForOrderNumber,
    }),
    [environment, productionJobs, productionOperations],
  )

  const inventoryState = useMemo(readInventoryState, [location.pathname, location.search])

  const alerts = useMemo<NotificationAlert[]>(() => {
    const createdAt = new Date().toISOString()
    const nextAlerts: NotificationAlert[] = []

    for (const job of productionJobs.filter((candidate) => candidate.dueStatus === 'OVERDUE')) {
      const resolvedWorkItemId = resolver.resolveWorkItemId({
        candidateWorkItemId: job.id,
        jobId: job.id,
        orderNumber: job.orderNumber,
      })
      if (!resolvedWorkItemId) continue
      nextAlerts.push({
        id: `late-${job.id}`,
        category: 'Late Orders',
        severity: 'Critical',
        title: `${job.orderNumber} is overdue`,
        description: `${job.customerName} · Due ${new Date(job.dueDate).toLocaleDateString()}`,
        relatedEntity: `${job.orderNumber} · ${resolvedWorkItemId}`,
        createdAt,
        target: { kind: 'work-item', workItemId: resolvedWorkItemId },
      })
    }

    for (const entry of operationBattlePlanItems.filter((candidate) => candidate.status === 'BLOCKED')) {
      const resolvedWorkItemId = resolver.resolveWorkItemId({
        candidateWorkItemId: entry.workItemId,
        operationId: entry.operationId,
        orderNumber: entry.orderNumber,
      })
      if (!resolvedWorkItemId) continue
      nextAlerts.push({
        id: `blocked-${entry.id}`,
        category: 'Blocked Operations',
        severity: severityFromRisk(entry.confidence),
        title: `${entry.operation} blocked`,
        description: `${entry.orderNumber} · ${entry.scheduleReason}`,
        relatedEntity: `${entry.orderNumber} · ${resolvedWorkItemId}`,
        createdAt,
        target: { kind: 'work-item', workItemId: resolvedWorkItemId },
      })
    }

    for (const entry of operationBattlePlanItems.filter((candidate) => candidate.materialReadiness === 'MISSING' || candidate.materialReadiness === 'LIMITED')) {
      const resolvedWorkItemId = resolver.resolveWorkItemId({
        candidateWorkItemId: entry.workItemId,
        operationId: entry.operationId,
        orderNumber: entry.orderNumber,
      })
      if (!resolvedWorkItemId) continue
      nextAlerts.push({
        id: `material-${entry.id}`,
        category: 'Material Shortages',
        severity: entry.materialReadiness === 'MISSING' ? 'Critical' : 'Warning',
        title: `${entry.operation} material ${entry.materialReadiness === 'MISSING' ? 'missing' : 'limited'}`,
        description: `${entry.orderNumber} requires material review before execution.`,
        relatedEntity: `${entry.orderNumber} · ${resolvedWorkItemId}`,
        createdAt,
        target: { kind: 'work-item', workItemId: resolvedWorkItemId },
      })
    }

    if (inventoryState) {
      const needsReviewItems = inventoryState.items.filter((item) => item.active && item.status === 'NEEDS_REVIEW')
      for (const item of needsReviewItems.slice(0, 20)) {
        nextAlerts.push({
          id: `inventory-review-${item.id}`,
          category: 'Inventory Needs Review',
          severity: 'Warning',
          title: item.name,
          description: 'Inventory item flagged for review by workbook status.',
          relatedEntity: `${item.locationName} · ${item.id}`,
          createdAt,
          target: { kind: 'inventory-item', inventoryItemId: item.id },
        })
      }

      const awaitingPurchaseApproval = inventoryState.purchaseOrders.filter((purchaseOrder) =>
        purchaseOrder.approvalStatus === 'DRAFT' || purchaseOrder.approvalStatus === 'AWAITING_CSW_APPROVAL',
      )
      for (const purchaseOrder of awaitingPurchaseApproval) {
        nextAlerts.push({
          id: `po-awaiting-${purchaseOrder.id}`,
          category: 'Purchase Orders Awaiting Approval',
          severity: 'Info',
          title: purchaseOrder.poDraftNumber,
          description: `${purchaseOrder.supplier} · ${purchaseOrder.lines.length} line(s) awaiting approval.`,
          relatedEntity: purchaseOrder.poDraftNumber,
          createdAt: purchaseOrder.dateCreated,
          target: { kind: 'purchase-order', purchaseOrderId: purchaseOrder.id },
        })
      }

      const pendingCswDocuments = inventoryState.cswDocuments.filter((document) => document.approvalStatus === 'PENDING')
      for (const document of pendingCswDocuments) {
        nextAlerts.push({
          id: `csw-awaiting-${document.id}`,
          category: 'CSWs Awaiting Approval',
          severity: 'Info',
          title: document.title,
          description: `${document.recommendedItemCount} recommendation line(s) pending approval.`,
          relatedEntity: document.subject,
          createdAt: document.date,
          target: { kind: 'csw', cswDocumentId: document.id },
        })
      }
    }

    if (persistenceWarning) {
      nextAlerts.push({
        id: 'system-persistence-warning',
        category: 'System Warnings',
        severity: 'Warning',
        title: 'Persistence warning',
        description: persistenceWarning,
        relatedEntity: 'System persistence layer',
        createdAt,
        target: { kind: 'inventory-page' },
      })
    }

    return nextAlerts
  }, [inventoryState, operationBattlePlanItems, persistenceWarning, productionJobs, resolver])

  const unresolvedCount = alerts.length

  const groupedAlerts = useMemo(() => {
    const orderedCategories: AlertCategory[] = [
      'Late Orders',
      'Blocked Operations',
      'Material Shortages',
      'Inventory Needs Review',
      'Purchase Orders Awaiting Approval',
      'CSWs Awaiting Approval',
      'System Warnings',
    ]

    return orderedCategories.map((category) => ({
      category,
      alerts: alerts.filter((alert) => alert.category === category),
    })).filter((group) => group.alerts.length > 0)
  }, [alerts])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationsOpen) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (notificationRef.current?.contains(target)) return
      setNotificationsOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationsOpen])

  const openAlertTarget = (target: AlertTarget): void => {
    setNotificationsOpen(false)
    if (target.kind === 'work-item') {
      navigate(`/work-items/${target.workItemId}`)
      return
    }
    if (target.kind === 'inventory-item') {
      navigate(`/inventory?section=needs-review&item=${encodeURIComponent(target.inventoryItemId)}`)
      return
    }
    if (target.kind === 'purchase-order') {
      navigate(`/inventory?section=po-drafts&po=${encodeURIComponent(target.purchaseOrderId)}`)
      return
    }
    if (target.kind === 'csw') {
      navigate(`/inventory?section=csw&csw=${encodeURIComponent(target.cswDocumentId)}`)
      return
    }
    navigate('/inventory')
  }

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

        <div className="top-header-notifications" ref={notificationRef}>
          <button
            type="button"
            className="top-header-icon-btn"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            !
            <span className="top-header-icon-ping" aria-hidden="true">{unresolvedCount}</span>
          </button>

          {notificationsOpen ? (
            <section className="top-header-alert-panel" aria-label="Notification center">
              <header className="top-header-alert-panel-header">
                <h3>Notification Center</h3>
                <span className="badge">{unresolvedCount} unresolved</span>
              </header>

              {unresolvedCount === 0 ? (
                <p className="subtle">No outstanding alerts.</p>
              ) : (
                <div className="top-header-alert-groups">
                  {groupedAlerts.map((group) => (
                    <article key={group.category} className="top-header-alert-group">
                      <div className="top-header-alert-group-header">
                        <h4>{group.category}</h4>
                        <span className="badge">{group.alerts.length}</span>
                      </div>
                      <ul className="plain-list top-header-alert-list">
                        {group.alerts.map((alert) => (
                          <li key={alert.id} className="top-header-alert-item">
                            <button
                              type="button"
                              className="top-header-alert-open"
                              onClick={() => openAlertTarget(alert.target)}
                            >
                              <div className="top-header-alert-main">
                                <div className="top-header-alert-meta">
                                  <span className={`top-header-alert-severity top-header-alert-severity-${severityClass[alert.severity]}`}>
                                    {alert.severity}
                                  </span>
                                  <span className="subtle">{formatAlertTime(alert.createdAt)}</span>
                                </div>
                                <strong>{alert.title}</strong>
                                <p>{alert.description}</p>
                                <p className="subtle">{alert.relatedEntity}</p>
                              </div>
                              <span className="top-header-alert-action">Open</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>

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
