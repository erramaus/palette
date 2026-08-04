import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import OperationLifecycleActions from '../components/production/OperationLifecycleActions'
import type {
  WorkshopArtworkNode,
  WorkshopOperationNode,
  WorkshopOrderNode,
  WorkshopPieceNode,
} from '../services/ProductionPipelineService'
import type { ProductionCutCalculationResult } from '../types/productionCut'
import type {
  WorkshopListFilter,
  WorkshopListRow,
  WorkshopListSort,
} from '../services/WorkshopListService'
import {
  getWorkshopListUiEnvironment,
  type WorkshopListUiEnvironment,
} from '../services/workshopListUiBootstrap'

type SortableColumn =
  | 'priority'
  | 'workItemNumber'
  | 'customer'
  | 'artwork'
  | 'product'
  | 'type'
  | 'currentStage'
  | 'assignedEmployee'
  | 'dueDate'
  | 'status'
  | 'progress'
  | 'updatedDate'

interface AddWorkItemFormState {
  workItemType: string
  customerId: string
  artworkId: string
  productId: string
  workflowId: string
  priority: number
  dueDate: string
  assignedDepartmentId: string
  assignedEmployeeId: string
  notes: string
}

type WorkshopTreeLevel = 'ORDER' | 'ARTWORK' | 'PIECE' | 'OPERATION'

interface WorkshopDrawerContent {
  key: string
  level: WorkshopTreeLevel
  title: string
  subtitle: string
  status: string
  dueDate?: string
  priority: number
  progress: number
  assigned: string
  workItemRoute?: string
  timeline: string[]
  materialRequirements: string[]
  productionTags: string[]
  calculationTrace: string[]
  activity: string[]
  dependencies: string[]
  operation?: WorkshopOperationNode['operation']
}

const sortMappings: Partial<Record<SortableColumn, WorkshopListSort['field']>> = {
  priority: 'priority',
  customer: 'customer',
  artwork: 'artwork',
  currentStage: 'currentStage',
  dueDate: 'dueDate',
  updatedDate: 'updatedDate',
}

const statusBadgeLabel = (status: string): string =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())

const statusBadgeTone = (status: string): string => {
  const normalized = status.toUpperCase()
  if (normalized.includes('BLOCKED')) return 'blocked'
  if (normalized.includes('REVIEW')) return 'review'
  if (normalized.includes('COMPLETE')) return 'complete'
  if (normalized.includes('LATE') || normalized.includes('OVERDUE')) return 'late'
  if (normalized.includes('PROGRESS')) return 'progress'
  if (normalized.includes('READY') || normalized.includes('ON_TRACK')) return 'ready'
  return 'default'
}

const formatDate = (value?: string): string => {
  if (!value) {
    return '--'
  }

  return new Date(value).toLocaleDateString()
}

const defaultFormState = (env: WorkshopListUiEnvironment): AddWorkItemFormState => {
  const defaultWorkflowId = Object.values(env.workflowContexts)[0]?.workflow.id ?? ''

  return {
    workItemType: 'CUSTOMER_ORDER',
    customerId: env.customers[0]?.id ?? '',
    artworkId: env.artworks[0]?.id ?? '',
    productId: env.products[0]?.id ?? '',
    workflowId: defaultWorkflowId,
    priority: 80,
    dueDate: new Date().toISOString().slice(0, 10),
    assignedDepartmentId: env.departments[0]?.id ?? '',
    assignedEmployeeId: env.employees[0]?.id ?? '',
    notes: '',
  }
}

const WorkshopListPage = () => {
  const navigate = useNavigate()
  const { workshopHierarchy, employees } = useAppState()
  const directorId = employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id ?? employees[0]?.id ?? 'system'

  const [environment] = useState<WorkshopListUiEnvironment>(() =>
    getWorkshopListUiEnvironment(),
  )

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set())
  const [selectedDrawer, setSelectedDrawer] = useState<WorkshopDrawerContent | null>(null)
  const [dominantLevel, setDominantLevel] = useState<WorkshopTreeLevel | null>(null)

  const [selectedSort, setSelectedSort] = useState<SortableColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterDueFrom, setFilterDueFrom] = useState('')
  const [filterDueTo, setFilterDueTo] = useState('')
  const [filterLateOnly, setFilterLateOnly] = useState(false)
  const [filterBlockedOnly, setFilterBlockedOnly] = useState(false)
  const [filterTags, setFilterTags] = useState('')

  const [addForm, setAddForm] = useState<AddWorkItemFormState>(() =>
    defaultFormState(environment),
  )

  const employeeNameById = useMemo(
    () => new Map(environment.employees.map((employee) => [employee.id, employee.name])),
    [environment.employees],
  )

  const activeTagFilters = useMemo(
    () =>
      filterTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    [filterTags],
  )

  const workshopFilter = useMemo<WorkshopListFilter>(
    () => ({
      workItemTypes: filterType ? [filterType] : undefined,
      statuses: filterStatus ? [filterStatus as WorkshopListRow['status']] : undefined,
      priorities: filterPriority ? [Number(filterPriority)] : undefined,
      workflowStages: filterStage ? [filterStage] : undefined,
      departments: filterDepartment ? [filterDepartment] : undefined,
      employees: filterEmployee ? [filterEmployee] : undefined,
      dueDateRange:
        filterDueFrom || filterDueTo
          ? {
              from: filterDueFrom || undefined,
              to: filterDueTo || undefined,
            }
          : undefined,
      lateItemsOnly: filterLateOnly,
      blockedItemsOnly: filterBlockedOnly,
      tags: activeTagFilters.length > 0 ? activeTagFilters : undefined,
    }),
    [
      activeTagFilters,
      filterBlockedOnly,
      filterDepartment,
      filterDueFrom,
      filterDueTo,
      filterEmployee,
      filterLateOnly,
      filterPriority,
      filterStage,
      filterStatus,
      filterType,
    ],
  )

  const allRows = useMemo(() => {
    const rows = environment.workshopListService.getPriorityQueue()
    return [...rows]
  }, [environment, refreshKey])

  const filteredRows = useMemo(() => {
    let rows = environment.workshopListService.filter(workshopFilter, allRows)

    if (searchText.trim()) {
      rows = environment.workshopListService.search(searchText, rows)
    }

    if (selectedSort) {
      const mappedSort = sortMappings[selectedSort]
      if (mappedSort) {
        rows = environment.workshopListService.sort(
          {
            field: mappedSort,
            direction: sortDirection,
          },
          rows,
        )
      } else {
        rows = [...rows].sort((left, right) => {
          if (selectedSort === 'workItemNumber') {
            return left.workItemNumber.localeCompare(right.workItemNumber)
          }

          if (selectedSort === 'product') {
            return left.productName.localeCompare(right.productName)
          }

          if (selectedSort === 'type') {
            return left.workItemType.localeCompare(right.workItemType)
          }

          if (selectedSort === 'assignedEmployee') {
            return left.assignedEmployee.localeCompare(right.assignedEmployee)
          }

          if (selectedSort === 'status') {
            return left.status.localeCompare(right.status)
          }

          if (selectedSort === 'progress') {
            return left.workflowProgress - right.workflowProgress
          }

          return 0
        })

        if (sortDirection === 'desc') {
          rows.reverse()
        }
      }
    }

    return rows
  }, [
    allRows,
    environment,
    searchText,
    selectedSort,
    sortDirection,
    workshopFilter,
  ])

  const summary = useMemo(
    () => environment.workshopListService.getSummary(filteredRows),
    [environment, filteredRows],
  )

  const rowByWorkItemId = useMemo(
    () => new Map(filteredRows.map((row) => [row.workItemId, row])),
    [filteredRows],
  )

  const filteredHierarchy = useMemo(() => {
    const visibleWorkItemIds = new Set(filteredRows.map((row) => row.workItemId))
    return workshopHierarchy
      .map((order) => ({
        ...order,
        artworks: order.artworks
          .map((artwork) => ({
            ...artwork,
            pieces: artwork.pieces.filter((piece) => visibleWorkItemIds.has(piece.workItemId)),
          }))
          .filter((artwork) => artwork.pieces.length > 0),
      }))
      .filter((order) => order.artworks.length > 0)
  }, [filteredRows, workshopHierarchy])

  const toggleNode = (nodeId: string): void => {
    setExpandedNodeIds((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const stageOptions = useMemo(() => {
    const stages = new Set(allRows.map((row) => row.currentStage))
    return [...stages].sort((a, b) => a.localeCompare(b))
  }, [allRows])

  const filterChips = [
    filterType ? { label: `Type: ${filterType}`, clear: () => setFilterType('') } : null,
    filterStatus ? { label: `Status: ${filterStatus}`, clear: () => setFilterStatus('') } : null,
    filterPriority
      ? { label: `Priority: ${filterPriority}`, clear: () => setFilterPriority('') }
      : null,
    filterStage ? { label: `Stage: ${filterStage}`, clear: () => setFilterStage('') } : null,
    filterDepartment
      ? {
          label: `Department: ${filterDepartment}`,
          clear: () => setFilterDepartment(''),
        }
      : null,
    filterEmployee
      ? { label: `Employee: ${filterEmployee}`, clear: () => setFilterEmployee('') }
      : null,
    filterDueFrom
      ? { label: `Due from: ${filterDueFrom}`, clear: () => setFilterDueFrom('') }
      : null,
    filterDueTo ? { label: `Due to: ${filterDueTo}`, clear: () => setFilterDueTo('') } : null,
    filterLateOnly ? { label: 'Late only', clear: () => setFilterLateOnly(false) } : null,
    filterBlockedOnly
      ? { label: 'Blocked only', clear: () => setFilterBlockedOnly(false) }
      : null,
    ...activeTagFilters.map((tag) => ({
      label: `Tag: ${tag}`,
      clear: () =>
        setFilterTags((current) =>
          current
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value && value !== tag)
            .join(', '),
        ),
    })),
  ].filter((chip): chip is { label: string; clear: () => void } => chip !== null)

  const onSort = (column: SortableColumn): void => {
    if (selectedSort === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSelectedSort(column)
    setSortDirection('asc')
  }

  const onRefresh = (): void => {
    setLoading(true)
    setTimeout(() => {
      setRefreshKey((value) => value + 1)
      setLoading(false)
    }, 150)
  }

  const clearAllFilters = (): void => {
    setFilterType('')
    setFilterStatus('')
    setFilterPriority('')
    setFilterStage('')
    setFilterDepartment('')
    setFilterEmployee('')
    setFilterDueFrom('')
    setFilterDueTo('')
    setFilterLateOnly(false)
    setFilterBlockedOnly(false)
    setFilterTags('')
    setSearchText('')
  }

  const onAddWorkItem = (): void => {
    try {
      const workflowContext = environment.workflowContexts[addForm.workflowId]
      if (!workflowContext) {
        throw new Error('Please choose a valid workflow')
      }

      environment.workItemService.createWorkItem({
        type: addForm.workItemType,
        workflowContext,
        customerId: addForm.customerId,
        artworkId: addForm.artworkId || undefined,
        orderId: `ORDER-${Date.now()}`,
        productId: addForm.productId,
        priority: addForm.priority,
        dueDate: addForm.dueDate,
        assignedDepartmentId: addForm.assignedDepartmentId || undefined,
        assignedEmployeeId: addForm.assignedEmployeeId || undefined,
        notes: addForm.notes.trim() ? [addForm.notes.trim()] : [],
        tags: [addForm.workItemType],
      })

      setShowAddDialog(false)
      setAddForm(defaultFormState(environment))
      setRefreshKey((value) => value + 1)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create Work Item')
    }
  }

  const openDrawer = (payload: WorkshopDrawerContent): void => {
    setSelectedDrawer(payload)
    setDominantLevel(payload.level)
  }

  const buildDrawerFromOrder = (order: WorkshopOrderNode): WorkshopDrawerContent => {
    const firstPiece = order.artworks.flatMap((artwork) => artwork.pieces).at(0)
    const row = firstPiece ? rowByWorkItemId.get(firstPiece.workItemId) : undefined

    return {
      key: order.id,
      level: 'ORDER',
      title: order.label,
      subtitle: order.customerName,
      status: order.status,
      dueDate: order.dueDate,
      priority: order.priority,
      progress: order.percentComplete,
      assigned: row?.assignedEmployee ?? 'Unassigned',
      workItemRoute: row ? `/work-items/${encodeURIComponent(row.workItemNumber)}` : undefined,
      timeline: [
        `Due ${formatDate(order.dueDate)}`,
        `${order.artworks.length} artwork group${order.artworks.length === 1 ? '' : 's'}`,
        `${order.artworks.flatMap((artwork) => artwork.pieces).length} production piece${order.artworks.flatMap((artwork) => artwork.pieces).length === 1 ? '' : 's'}`,
      ],
      materialRequirements: [
        'Material requirements roll up from the selected production pieces.',
      ],
      productionTags: row?.tags.length
        ? row.tags
        : ['No production tags mapped at order level.'],
      calculationTrace: ['Choose a production piece in this order to inspect cut calculations.'],
      activity: [
        `Current status: ${statusBadgeLabel(order.status)}`,
        `Completion progress: ${order.percentComplete}%`,
      ],
      dependencies: ['Dependencies are tracked on individual production operations.'],
    }
  }

  const buildDrawerFromArtwork = (
    order: WorkshopOrderNode,
    artwork: WorkshopArtworkNode,
  ): WorkshopDrawerContent => {
    const firstPiece = artwork.pieces.at(0)
    const row = firstPiece ? rowByWorkItemId.get(firstPiece.workItemId) : undefined

    return {
      key: artwork.id,
      level: 'ARTWORK',
      title: artwork.label,
      subtitle: `${order.label} · ${order.customerName}`,
      status: artwork.status,
      dueDate: artwork.dueDate,
      priority: artwork.priority,
      progress: artwork.percentComplete,
      assigned: row?.assignedEmployee ?? 'Unassigned',
      workItemRoute: row ? `/work-items/${encodeURIComponent(row.workItemNumber)}` : undefined,
      timeline: [
        `Due ${formatDate(artwork.dueDate)}`,
        `${artwork.pieces.length} production piece${artwork.pieces.length === 1 ? '' : 's'}`,
      ],
      materialRequirements: ['Material details are available at production piece and operation level.'],
      productionTags: row?.tags.length
        ? row.tags
        : ['No production tags mapped at artwork level.'],
      calculationTrace: ['Choose a production piece for detailed calculation trace.'],
      activity: [
        `Artwork status: ${statusBadgeLabel(artwork.status)}`,
        `Completion progress: ${artwork.percentComplete}%`,
      ],
      dependencies: ['Dependencies are tracked by operation sequence.'],
    }
  }

  const buildDrawerFromPiece = (
    order: WorkshopOrderNode,
    artwork: WorkshopArtworkNode,
    piece: WorkshopPieceNode,
  ): WorkshopDrawerContent => {
    const row = rowByWorkItemId.get(piece.workItemId)

    return {
      key: piece.id,
      level: 'PIECE',
      title: piece.label,
      subtitle: `${order.label} · ${artwork.label}`,
      status: piece.status,
      dueDate: piece.dueDate,
      priority: piece.priority,
      progress: piece.percentComplete,
      assigned: row?.assignedEmployee ?? 'Unassigned',
      workItemRoute: row ? `/work-items/${encodeURIComponent(row.workItemNumber)}` : undefined,
      timeline: [
        `Work item ${row?.workItemNumber ?? piece.workItemId}`,
        `Current stage: ${row?.currentStage ?? '--'}`,
        `Updated ${row ? formatDate(row.updatedAt) : '--'}`,
      ],
      materialRequirements: piece.operations
        .map((operation) => operation.operation.materialRequirement)
        .filter((requirement) => Boolean(requirement))
        .map((requirement) => {
          if (!requirement) return ''
          const shortage = requirement.shortageLinearInches > 0
            ? ` · shortage ${Math.round(requirement.shortageLinearInches)} in`
            : ''
          return `${requirement.kind.replaceAll('_', ' ')} · gross ${Math.round(requirement.grossLinearInches ?? 0)} in${shortage}`
        })
        .filter((item) => item.length > 0)
        .slice(0, 6)
        .concat(
          piece.operations.some((operation) => operation.operation.materialRequirement)
            ? []
            : ['No explicit material requirements recorded.'],
        ),
      productionTags: row?.tags.length
        ? row.tags
        : ['No production tags assigned.'],
      calculationTrace: piece.cutCalculations.length > 0
        ? piece.cutCalculations.map((calculation) =>
            `${calculation.kind}: ${calculation.trace.explanation} (${calculation.trace.ruleId ?? 'review required'})`,
          )
        : ['No cut calculations available.'],
      activity: [
        `Status: ${statusBadgeLabel(piece.status)}`,
        `Progress: ${piece.percentComplete}%`,
        `${piece.operations.length} operations in sequence`,
      ],
      dependencies: piece.operations
        .flatMap((operation) => operation.operation.dependsOnOperationIds)
        .map((dependencyId) => `Depends on ${dependencyId}`)
        .slice(0, 8)
        .concat(
          piece.operations.some((operation) => operation.operation.dependsOnOperationIds.length > 0)
            ? []
            : ['No blocking dependencies recorded.'],
        ),
    }
  }

  const buildDrawerFromCutCalculation = (
    piece: WorkshopPieceNode,
    calculation: ProductionCutCalculationResult,
  ): WorkshopDrawerContent => {
    const row = rowByWorkItemId.get(piece.workItemId)

    return {
      key: `${piece.id}-${calculation.kind}`,
      level: 'OPERATION',
      title: `${calculation.kind} Calculation`,
      subtitle: row?.workItemNumber ?? piece.label,
      status: calculation.status,
      dueDate: piece.dueDate,
      priority: piece.priority,
      progress: calculation.status === 'CONFIRMED' ? 100 : 20,
      assigned: row?.assignedEmployee ?? 'Unassigned',
      workItemRoute: row ? `/work-items/${encodeURIComponent(row.workItemNumber)}` : undefined,
      timeline: [
        `Calculation status: ${statusBadgeLabel(calculation.status)}`,
        `Confidence: ${calculation.trace.confidence}`,
      ],
      materialRequirements: calculation.members.length > 0
        ? calculation.members.map((member) => `${member.kind} ${member.cutLengthInches} in x${member.quantity}`)
        : ['No member cuts calculated.'],
      productionTags: row?.tags.length
        ? row.tags
        : ['No production tags linked.'],
      calculationTrace: [
        calculation.trace.explanation,
        `Rule: ${calculation.trace.ruleId ?? 'Review required'}`,
      ],
      activity: [
        `Kind: ${calculation.kind}`,
        `Can generate tag: ${calculation.canGenerateFinalSawTag ? 'Yes' : 'No'}`,
      ],
      dependencies: ['Calculation dependencies derive from normalized production inputs.'],
    }
  }

  const buildDrawerFromOperation = (
    piece: WorkshopPieceNode,
    operationNode: WorkshopOperationNode,
  ): WorkshopDrawerContent => {
    const row = rowByWorkItemId.get(piece.workItemId)
    const operation = operationNode.operation

    return {
      key: operationNode.id,
      level: 'OPERATION',
      title: operationNode.label,
      subtitle: row?.workItemNumber ?? piece.label,
      status: operationNode.status,
      dueDate: operationNode.dueDate,
      priority: operationNode.priority,
      progress: operationNode.percentComplete,
      assigned: operation.assignedEmployeeId
        ? employeeNameById.get(operation.assignedEmployeeId) ?? operation.assignedEmployeeId
        : 'Unassigned',
      workItemRoute: row ? `/work-items/${encodeURIComponent(row.workItemNumber)}` : undefined,
      timeline: [
        `Sequence ${operation.sequence}`,
        operation.startedAt ? `Started ${formatDate(operation.startedAt)}` : 'Not started',
        operation.completedAt ? `Completed ${formatDate(operation.completedAt)}` : 'Not completed',
      ],
      materialRequirements: operation.materialRequirement
        ? [
            `${operation.materialRequirement.kind.replaceAll('_', ' ')} · reserved ${Math.round(operation.materialRequirement.reservedLinearInches)} in`,
            `Available ${Math.round(operation.materialRequirement.availableLinearInches)} in`,
            operation.materialRequirement.shortageLinearInches > 0
              ? `Shortage ${Math.round(operation.materialRequirement.shortageLinearInches)} in`
              : 'No shortage detected',
          ]
        : ['No material requirement for this operation.'],
      productionTags: operation.tagIds && operation.tagIds.length > 0
        ? operation.tagIds
        : ['No tags generated yet.'],
      calculationTrace: operation.cutCalculation
        ? [
            operation.cutCalculation.trace.explanation,
            `Rule ${operation.cutCalculation.trace.ruleId ?? 'needs review'}`,
          ]
        : ['No cut calculation attached to this operation.'],
      activity: operation.history.length > 0
        ? operation.history
            .slice(-6)
            .reverse()
            .map((entry) => `${entry.action} · ${new Date(entry.occurredAt).toLocaleString()}`)
        : ['No operation activity recorded.'],
      dependencies: operation.dependsOnOperationIds.length > 0
        ? operation.dependsOnOperationIds.map((dependencyId) => `Depends on ${dependencyId}`)
        : ['No dependencies.'],
      operation,
    }
  }

  return (
    <section className="page workshop-v2-page">
      <header className="workshop-v2-header">
        <div>
          <h2>Workshop List</h2>
          <p>Operational view generated from WorkItems and workflow state.</p>
        </div>

        <div className="workshop-v2-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowAddDialog(true)}>
            Add Work Item
          </button>
          <button type="button" className="btn" onClick={onRefresh}>
            Refresh
          </button>
          <span className="workshop-v2-count" aria-live="polite">
            {filteredRows.length} results
          </span>
        </div>
      </header>

      <section className="summary-grid workshop-v2-summary" aria-label="Workshop summary">
        <article className="summary-card">
          <p>Active</p>
          <h3>{summary.totalActiveItems}</h3>
        </article>
        <article className="summary-card">
          <p>Late</p>
          <h3>{summary.lateItems}</h3>
        </article>
        <article className="summary-card">
          <p>Blocked</p>
          <h3>{summary.blockedItems}</h3>
        </article>
        <article className="summary-card">
          <p>Due Today</p>
          <h3>{summary.dueToday}</h3>
        </article>
        <article className="summary-card">
          <p>Due This Week</p>
          <h3>{summary.dueThisWeek}</h3>
        </article>
      </section>

      <section className="workshop-v2-toolbar workshop-v2-toolbar-compact" aria-label="Workshop filter toolbar">
        <label className="search-field workshop-filter-search">
          Search
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Customer, artwork, product, work item #, tags"
            aria-label="Search workshop list"
          />
        </label>

        <label className="workshop-filter-field">
          Status
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">All</option>
            {[...new Set(allRows.map((row) => row.status))].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="workshop-filter-field">
          Priority
          <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}>
            <option value="">All</option>
            {[...new Set(allRows.map((row) => row.priority))]
              .sort((a, b) => b - a)
              .map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
          </select>
        </label>

        <label className="workshop-filter-field">
          Due From
          <input
            type="date"
            value={filterDueFrom}
            onChange={(event) => setFilterDueFrom(event.target.value)}
          />
        </label>

        <label className="workshop-filter-field">
          Due To
          <input
            type="date"
            value={filterDueTo}
            onChange={(event) => setFilterDueTo(event.target.value)}
          />
        </label>

        <div className="workshop-filter-toolbar-actions">
          <button type="button" className="btn" onClick={() => setShowMoreFilters((value) => !value)}>
            {showMoreFilters ? 'Hide More Filters' : 'More Filters'}
          </button>
          {filterChips.length > 0 && (
            <button type="button" className="btn" onClick={clearAllFilters}>
              Clear All
            </button>
          )}
        </div>

        {filterChips.length > 0 && (
          <div className="workshop-v2-chips workshop-v2-toolbar-chips" aria-label="Active filters">
            {filterChips.map((chip) => (
              <button key={chip.label} type="button" className="filter-chip" onClick={chip.clear}>
                {chip.label} x
              </button>
            ))}
          </div>
        )}
      </section>

      {showMoreFilters && (
        <section className="filters workshop-v2-filters workshop-v2-more-filters" aria-label="More workshop filters">
          <label>
            Work Item Type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="">All</option>
              {[...new Set(allRows.map((row) => row.workItemType))].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Workflow Stage
            <select value={filterStage} onChange={(event) => setFilterStage(event.target.value)}>
              <option value="">All</option>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label>
            Department
            <select value={filterDepartment} onChange={(event) => setFilterDepartment(event.target.value)}>
              <option value="">All</option>
              {[...new Set(allRows.map((row) => row.assignedDepartment))].map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label>
            Employee
            <select value={filterEmployee} onChange={(event) => setFilterEmployee(event.target.value)}>
              <option value="">All</option>
              {[...new Set(allRows.map((row) => row.assignedEmployee))].map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tags
            <input
              type="text"
              value={filterTags}
              onChange={(event) => setFilterTags(event.target.value)}
              placeholder="Comma-separated tags"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterLateOnly}
              onChange={(event) => setFilterLateOnly(event.target.checked)}
            />
            Late Only
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterBlockedOnly}
              onChange={(event) => setFilterBlockedOnly(event.target.checked)}
            />
            Blocked Only
          </label>
        </section>
      )}

      {loading && <div className="panel">Loading workshop items...</div>}
      {!loading && errorMessage && <div className="panel warning">{errorMessage}</div>}

      {!loading && !errorMessage && filteredRows.length === 0 && (
        <div className="panel">
          <h3>No work items found</h3>
          <p className="subtle">Try removing filters or add a new Work Item.</p>
        </div>
      )}

      {!loading && !errorMessage && filteredHierarchy.length > 0 && (
        <section className="workshop-enterprise-layout">
          <section className="workshop-tree workshop-tree-enterprise" aria-label="Production hierarchy">
            <div className="workshop-tree-header workshop-tree-header-enterprise">
              <span>Order</span>
              <span>Artwork</span>
              <span>Piece</span>
              <span>Operation</span>
              <span>Assigned</span>
              <button type="button" className="th-sort" onClick={() => onSort('dueDate')}>Due</button>
              <button type="button" className="th-sort" onClick={() => onSort('priority')}>Priority</button>
              <span>Status</span>
              <span>Progress</span>
              <span>Actions</span>
            </div>

            {filteredHierarchy.map((order) => {
              const orderExpanded = expandedNodeIds.has(order.id)
              const orderLeadRow = order.artworks.flatMap((artwork) => artwork.pieces).map((piece) => rowByWorkItemId.get(piece.workItemId)).find((row): row is WorkshopListRow => Boolean(row))
              const orderSelected = selectedDrawer?.key === order.id

              return (
                <div key={order.id} className="workshop-tree-order-group">
                  <div
                    className={[
                      'workshop-tree-row',
                      'workshop-tree-row-enterprise',
                      'workshop-tree-level-order',
                      dominantLevel && dominantLevel !== 'ORDER' ? 'workshop-tree-row-dimmed' : '',
                      orderSelected ? 'workshop-tree-row-selected' : '',
                    ].join(' ').trim()}
                    onClick={() => openDrawer(buildDrawerFromOrder(order))}
                  >
                    <button
                      type="button"
                      className="workshop-tree-toggle"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleNode(order.id)
                        setDominantLevel('ORDER')
                      }}
                      aria-expanded={orderExpanded}
                    >
                      <span className="workshop-tree-chevron" aria-hidden="true">{orderExpanded ? '▾' : '▸'}</span>
                      <strong>{order.label}</strong>
                    </button>
                    <span className="workshop-tree-cell-muted">--</span>
                    <span className="workshop-tree-cell-muted">--</span>
                    <span className="workshop-tree-cell-muted">--</span>
                    <span>{orderLeadRow?.assignedEmployee ?? 'Unassigned'}</span>
                    <span>{formatDate(order.dueDate)}</span>
                    <span className="priority-pill">P{order.priority}</span>
                    <span className={`workshop-status-badge workshop-status-${statusBadgeTone(order.status)}`}>
                      {statusBadgeLabel(order.status)}
                    </span>
                    <div className="workshop-tree-progress" title={`${order.percentComplete}%`}>
                      <span style={{ width: `${Math.max(0, Math.min(100, order.percentComplete))}%` }} />
                      <em className="workshop-tree-progress-label">{order.percentComplete}%</em>
                    </div>
                    <div className="workshop-tree-actions">
                      <button
                        type="button"
                        className="workshop-icon-btn"
                        title="View details"
                        onClick={(event) => {
                          event.stopPropagation()
                          openDrawer(buildDrawerFromOrder(order))
                        }}
                      >
                        i
                      </button>
                    </div>
                  </div>

                  {orderExpanded && order.artworks.map((artwork) => {
                    const artworkExpanded = expandedNodeIds.has(artwork.id)
                    const artworkLeadRow = artwork.pieces.map((piece) => rowByWorkItemId.get(piece.workItemId)).find((row): row is WorkshopListRow => Boolean(row))
                    const artworkSelected = selectedDrawer?.key === artwork.id

                    return (
                      <div key={artwork.id}>
                        <div
                          className={[
                            'workshop-tree-row',
                            'workshop-tree-row-enterprise',
                            'workshop-tree-level-artwork',
                            dominantLevel && dominantLevel !== 'ARTWORK' ? 'workshop-tree-row-dimmed' : '',
                            artworkSelected ? 'workshop-tree-row-selected' : '',
                          ].join(' ').trim()}
                          onClick={() => openDrawer(buildDrawerFromArtwork(order, artwork))}
                        >
                          <span className="workshop-tree-cell-muted">{order.label}</span>
                          <button
                            type="button"
                            className="workshop-tree-toggle"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleNode(artwork.id)
                              setDominantLevel('ARTWORK')
                            }}
                            aria-expanded={artworkExpanded}
                          >
                            <span className="workshop-tree-chevron" aria-hidden="true">{artworkExpanded ? '▾' : '▸'}</span>
                            <strong>{artwork.label}</strong>
                          </button>
                          <span className="workshop-tree-cell-muted">--</span>
                          <span className="workshop-tree-cell-muted">--</span>
                          <span>{artworkLeadRow?.assignedEmployee ?? 'Unassigned'}</span>
                          <span>{formatDate(artwork.dueDate)}</span>
                          <span className="priority-pill">P{artwork.priority}</span>
                          <span className={`workshop-status-badge workshop-status-${statusBadgeTone(artwork.status)}`}>
                            {statusBadgeLabel(artwork.status)}
                          </span>
                          <div className="workshop-tree-progress" title={`${artwork.percentComplete}%`}>
                            <span style={{ width: `${Math.max(0, Math.min(100, artwork.percentComplete))}%` }} />
                            <em className="workshop-tree-progress-label">{artwork.percentComplete}%</em>
                          </div>
                          <div className="workshop-tree-actions">
                            <button
                              type="button"
                              className="workshop-icon-btn"
                              title="View details"
                              onClick={(event) => {
                                event.stopPropagation()
                                openDrawer(buildDrawerFromArtwork(order, artwork))
                              }}
                            >
                              i
                            </button>
                          </div>
                        </div>

                        {artworkExpanded && artwork.pieces.map((piece) => {
                          const pieceExpanded = expandedNodeIds.has(piece.id)
                          const row = rowByWorkItemId.get(piece.workItemId)
                          const pieceSelected = selectedDrawer?.key === piece.id

                          return (
                            <div key={piece.id}>
                              <div
                                className={[
                                  'workshop-tree-row',
                                  'workshop-tree-row-enterprise',
                                  'workshop-tree-level-piece',
                                  dominantLevel && dominantLevel !== 'PIECE' ? 'workshop-tree-row-dimmed' : '',
                                  pieceSelected ? 'workshop-tree-row-selected' : '',
                                ].join(' ').trim()}
                                onClick={() => openDrawer(buildDrawerFromPiece(order, artwork, piece))}
                              >
                                <span className="workshop-tree-cell-muted">{order.label}</span>
                                <span className="workshop-tree-cell-muted">{artwork.label}</span>
                                <button
                                  type="button"
                                  className="workshop-tree-toggle"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleNode(piece.id)
                                    setDominantLevel('PIECE')
                                  }}
                                  aria-expanded={pieceExpanded}
                                >
                                  <span className="workshop-tree-chevron" aria-hidden="true">{pieceExpanded ? '▾' : '▸'}</span>
                                  <strong>{piece.label}</strong>
                                </button>
                                <span className="workshop-tree-cell-muted">--</span>
                                <span>{row?.assignedEmployee ?? 'Unassigned'}</span>
                                <span>{formatDate(piece.dueDate)}</span>
                                <span className="priority-pill">P{piece.priority}</span>
                                <span className={`workshop-status-badge workshop-status-${statusBadgeTone(piece.status)}`}>
                                  {statusBadgeLabel(piece.status)}
                                </span>
                                <div className="workshop-tree-progress" title={`${piece.percentComplete}%`}>
                                  <span style={{ width: `${Math.max(0, Math.min(100, piece.percentComplete))}%` }} />
                                  <em className="workshop-tree-progress-label">{piece.percentComplete}%</em>
                                </div>
                                <div className="workshop-tree-actions">
                                  <button
                                    type="button"
                                    className="workshop-icon-btn"
                                    title="View details"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      openDrawer(buildDrawerFromPiece(order, artwork, piece))
                                    }}
                                  >
                                    i
                                  </button>
                                  {row && (
                                    <button
                                      type="button"
                                      className="workshop-icon-btn"
                                      title="Open work item"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)
                                      }}
                                    >
                                      ↗
                                    </button>
                                  )}
                                </div>
                              </div>

                              {pieceExpanded && piece.cutCalculations.map((calculation) => {
                                const calculationSelected = selectedDrawer?.key === `${piece.id}-${calculation.kind}`
                                return (
                                  <div
                                    key={`${piece.id}-${calculation.kind}`}
                                    className={[
                                      'workshop-tree-row',
                                      'workshop-tree-row-enterprise',
                                      'workshop-tree-level-operation',
                                      dominantLevel && dominantLevel !== 'OPERATION' ? 'workshop-tree-row-dimmed' : '',
                                      calculationSelected ? 'workshop-tree-row-selected' : '',
                                    ].join(' ').trim()}
                                    onClick={() => openDrawer(buildDrawerFromCutCalculation(piece, calculation))}
                                  >
                                    <span className="workshop-tree-cell-muted">{order.label}</span>
                                    <span className="workshop-tree-cell-muted">{artwork.label}</span>
                                    <span className="workshop-tree-cell-muted">{piece.label}</span>
                                    <span className="workshop-tree-operation-name">{calculation.kind} Calculation</span>
                                    <span>{row?.assignedEmployee ?? 'Unassigned'}</span>
                                    <span>{formatDate(piece.dueDate)}</span>
                                    <span className="priority-pill">P{piece.priority}</span>
                                    <span className={`workshop-status-badge workshop-status-${statusBadgeTone(calculation.status)}`}>
                                      {statusBadgeLabel(calculation.status)}
                                    </span>
                                    <div className="workshop-tree-progress" title={calculation.status === 'CONFIRMED' ? '100%' : '20%'}>
                                      <span style={{ width: calculation.status === 'CONFIRMED' ? '100%' : '20%' }} />
                                      <em className="workshop-tree-progress-label">{calculation.status === 'CONFIRMED' ? '100%' : '20%'}</em>
                                    </div>
                                    <div className="workshop-tree-actions">
                                      <button
                                        type="button"
                                        className="workshop-icon-btn"
                                        title="View details"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          openDrawer(buildDrawerFromCutCalculation(piece, calculation))
                                        }}
                                      >
                                        i
                                      </button>
                                      {row && calculation.status === 'NEEDS_REVIEW' && (
                                        <button
                                          type="button"
                                          className="workshop-icon-btn"
                                          title="Review on Work Item"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)
                                          }}
                                        >
                                          !
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}

                              {pieceExpanded && piece.operations.map((operation) => {
                                const operationSelected = selectedDrawer?.key === operation.id
                                return (
                                  <div
                                    key={operation.id}
                                    className={[
                                      'workshop-tree-row',
                                      'workshop-tree-row-enterprise',
                                      'workshop-tree-level-operation',
                                      dominantLevel && dominantLevel !== 'OPERATION' ? 'workshop-tree-row-dimmed' : '',
                                      operationSelected ? 'workshop-tree-row-selected' : '',
                                    ].join(' ').trim()}
                                    onClick={() => openDrawer(buildDrawerFromOperation(piece, operation))}
                                  >
                                    <span className="workshop-tree-cell-muted">{order.label}</span>
                                    <span className="workshop-tree-cell-muted">{artwork.label}</span>
                                    <span className="workshop-tree-cell-muted">{piece.label}</span>
                                    <span className="workshop-tree-operation-name">{operation.label}</span>
                                    <span>
                                      {operation.operation.assignedEmployeeId
                                        ? employeeNameById.get(operation.operation.assignedEmployeeId) ?? operation.operation.assignedEmployeeId
                                        : row?.assignedEmployee ?? 'Unassigned'}
                                    </span>
                                    <span>{formatDate(operation.dueDate)}</span>
                                    <span className="priority-pill">P{operation.priority}</span>
                                    <span className={`workshop-status-badge workshop-status-${statusBadgeTone(operation.status)}`}>
                                      {statusBadgeLabel(operation.status)}
                                    </span>
                                    <div className="workshop-tree-progress" title={`${operation.percentComplete}%`}>
                                      <span style={{ width: `${Math.max(0, Math.min(100, operation.percentComplete))}%` }} />
                                      <em className="workshop-tree-progress-label">{operation.percentComplete}%</em>
                                    </div>
                                    <div className="workshop-tree-actions">
                                      <button
                                        type="button"
                                        className="workshop-icon-btn"
                                        title="View details"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          openDrawer(buildDrawerFromOperation(piece, operation))
                                        }}
                                      >
                                        i
                                      </button>
                                      {row && (
                                        <button
                                          type="button"
                                          className="workshop-icon-btn"
                                          title="Open work item"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)
                                          }}
                                        >
                                          ↗
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </section>

          <aside className={selectedDrawer ? 'workshop-drawer' : 'workshop-drawer workshop-drawer-empty'} aria-label="Workshop detail drawer">
            {!selectedDrawer && (
              <div className="workshop-drawer-placeholder">
                <h3>Detail Drawer</h3>
                <p className="subtle">Select a row to inspect timeline, materials, tags, calculation trace, activity, and dependencies.</p>
              </div>
            )}

            {selectedDrawer && (
              <div className="workshop-drawer-content">
                <header className="workshop-drawer-header">
                  <div>
                    <h3>{selectedDrawer.title}</h3>
                    <p className="subtle">{selectedDrawer.subtitle}</p>
                  </div>
                  <button type="button" className="workshop-icon-btn" onClick={() => setSelectedDrawer(null)} title="Close drawer">x</button>
                </header>

                <div className="workshop-drawer-meta">
                  <span className={`workshop-status-badge workshop-status-${statusBadgeTone(selectedDrawer.status)}`}>
                    {statusBadgeLabel(selectedDrawer.status)}
                  </span>
                  <span>Due {formatDate(selectedDrawer.dueDate)}</span>
                  <span>Priority P{selectedDrawer.priority}</span>
                  <span>Assigned {selectedDrawer.assigned}</span>
                </div>

                <section className="workshop-drawer-summary" aria-label="Critical details">
                  <h4>Critical Details</h4>
                  <dl className="workshop-drawer-meta-grid">
                    <div>
                      <dt>Status</dt>
                      <dd>{statusBadgeLabel(selectedDrawer.status)}</dd>
                    </div>
                    <div>
                      <dt>Due Date</dt>
                      <dd>{formatDate(selectedDrawer.dueDate)}</dd>
                    </div>
                    <div>
                      <dt>Assigned</dt>
                      <dd>{selectedDrawer.assigned}</dd>
                    </div>
                    <div>
                      <dt>Priority</dt>
                      <dd>P{selectedDrawer.priority}</dd>
                    </div>
                    <div>
                      <dt>Progress</dt>
                      <dd>{selectedDrawer.progress}%</dd>
                    </div>
                    <div>
                      <dt>Blockers</dt>
                      <dd>
                        {selectedDrawer.status.toUpperCase().includes('BLOCKED')
                          ? selectedDrawer.dependencies[0] ?? 'Blocked'
                          : 'None'}
                      </dd>
                    </div>
                  </dl>
                </section>

                {selectedDrawer.workItemRoute && (
                  <div className="workshop-drawer-actions">
                    <button type="button" className="btn" onClick={() => navigate(selectedDrawer.workItemRoute!)}>
                      Open Work Item
                    </button>
                  </div>
                )}

                <section>
                  <h4>Timeline</h4>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.timeline.map((item, index) => <li key={`timeline-${index}`}>{item}</li>)}
                  </ul>
                </section>

                <section>
                  <h4>Material Requirements</h4>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.materialRequirements.map((item, index) => <li key={`material-${index}`}>{item}</li>)}
                  </ul>
                </section>

                <section>
                  <h4>Production Tags</h4>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.productionTags.map((item, index) => <li key={`tag-${index}`}>{item}</li>)}
                  </ul>
                </section>

                <details className="workshop-drawer-collapsible">
                  <summary>Calculation Trace</summary>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.calculationTrace.map((item, index) => <li key={`calc-${index}`}>{item}</li>)}
                  </ul>
                </details>

                <details className="workshop-drawer-collapsible">
                  <summary>Activity</summary>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.activity.map((item, index) => <li key={`activity-${index}`}>{item}</li>)}
                  </ul>
                </details>

                <details className="workshop-drawer-collapsible">
                  <summary>Dependencies</summary>
                  <ul className="workshop-drawer-list">
                    {selectedDrawer.dependencies.map((item, index) => <li key={`dependency-${index}`}>{item}</li>)}
                  </ul>
                </details>

                <details className="workshop-drawer-collapsible">
                  <summary>Raw Details</summary>
                  <dl className="workshop-drawer-meta-grid">
                    <div>
                      <dt>Level</dt>
                      <dd>{selectedDrawer.level}</dd>
                    </div>
                    <div>
                      <dt>Record Key</dt>
                      <dd>{selectedDrawer.key}</dd>
                    </div>
                    <div>
                      <dt>Subtitle</dt>
                      <dd>{selectedDrawer.subtitle}</dd>
                    </div>
                    <div>
                      <dt>Route</dt>
                      <dd>{selectedDrawer.workItemRoute ?? '--'}</dd>
                    </div>
                  </dl>
                </details>

                {selectedDrawer.operation && (
                  <section>
                    <h4>Operation Controls</h4>
                    <OperationLifecycleActions operation={selectedDrawer.operation} role="DIRECTOR" actorEmployeeId={directorId} compact overflowSecondary />
                  </section>
                )}
              </div>
            )}
          </aside>
        </section>
      )}

      {showAddDialog && (
        <div className="workshop-v2-modal-backdrop" role="presentation" onClick={() => setShowAddDialog(false)}>
          <section
            className="panel workshop-v2-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-work-item-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="add-work-item-title">Add Work Item</h3>
            <div className="form-grid workshop-v2-add-grid">
              <label>
                Work item type
                <input
                  type="text"
                  value={addForm.workItemType}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, workItemType: event.target.value }))
                  }
                />
              </label>

              <label>
                Customer
                <select
                  value={addForm.customerId}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                >
                  {environment.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Artwork
                <select
                  value={addForm.artworkId}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, artworkId: event.target.value }))
                  }
                >
                  {environment.artworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}>
                      {artwork.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Product
                <select
                  value={addForm.productId}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, productId: event.target.value }))
                  }
                >
                  {environment.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Workflow
                <select
                  value={addForm.workflowId}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, workflowId: event.target.value }))
                  }
                >
                  {Object.values(environment.workflowContexts).map((context) => (
                    <option key={context.workflow.id} value={context.workflow.id}>
                      {context.workflow.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={addForm.priority}
                  onChange={(event) =>
                    setAddForm((current) => ({
                      ...current,
                      priority: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={addForm.dueDate}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>

              <label>
                Assigned department
                <select
                  value={addForm.assignedDepartmentId}
                  onChange={(event) =>
                    setAddForm((current) => ({
                      ...current,
                      assignedDepartmentId: event.target.value,
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {environment.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Assigned employee
                <select
                  value={addForm.assignedEmployeeId}
                  onChange={(event) =>
                    setAddForm((current) => ({
                      ...current,
                      assignedEmployeeId: event.target.value,
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {environment.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="workshop-v2-note-field">
                Notes
                <textarea
                  rows={3}
                  value={addForm.notes}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={onAddWorkItem}>
                Save Work Item
              </button>
              <button type="button" className="btn" onClick={() => setShowAddDialog(false)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default WorkshopListPage
