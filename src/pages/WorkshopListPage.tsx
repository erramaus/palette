import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import OperationLifecycleActions from '../components/production/OperationLifecycleActions'
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

const sortMappings: Partial<Record<SortableColumn, WorkshopListSort['field']>> = {
  priority: 'priority',
  customer: 'customer',
  artwork: 'artwork',
  currentStage: 'currentStage',
  dueDate: 'dueDate',
  updatedDate: 'updatedDate',
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
  const [showFilters, setShowFilters] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set())

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

  return (
    <section className="page workshop-v2-page">
      <header className="workshop-v2-header">
        <div>
          <h2>Workshop List</h2>
          <p>Operational view generated from WorkItems and workflow state.</p>
        </div>

        <div className="workshop-v2-header-actions">
          <label className="search-field">
            Search
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Customer, artwork, product, work item #, tags"
              aria-label="Search workshop list"
            />
          </label>
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

      <div className="workshop-v2-toolbar">
        <button type="button" className="btn" onClick={() => setShowFilters((value) => !value)}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {filterChips.length > 0 && (
          <button type="button" className="btn" onClick={clearAllFilters}>
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <section className="filters workshop-v2-filters" aria-label="Workshop filters">
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

          <label>
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
            Due From
            <input
              type="date"
              value={filterDueFrom}
              onChange={(event) => setFilterDueFrom(event.target.value)}
            />
          </label>

          <label>
            Due To
            <input
              type="date"
              value={filterDueTo}
              onChange={(event) => setFilterDueTo(event.target.value)}
            />
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

      {filterChips.length > 0 && (
        <div className="workshop-v2-chips" aria-label="Active filters">
          {filterChips.map((chip) => (
            <button key={chip.label} type="button" className="filter-chip" onClick={chip.clear}>
              {chip.label} x
            </button>
          ))}
        </div>
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
        <section className="workshop-tree" aria-label="Production hierarchy">
          <div className="workshop-tree-header">
            <span>Production hierarchy</span>
            <span>Status</span>
            <button type="button" className="th-sort" onClick={() => onSort('dueDate')}>Due</button>
            <button type="button" className="th-sort" onClick={() => onSort('priority')}>Priority</button>
            <span>Complete</span>
          </div>
          {filteredHierarchy.map((order) => {
            const orderExpanded = expandedNodeIds.has(order.id)
            return (
              <div key={order.id} className="workshop-tree-order">
                <div className="workshop-tree-row workshop-tree-level-order">
                  <button type="button" className="workshop-tree-toggle" onClick={() => toggleNode(order.id)} aria-expanded={orderExpanded}>
                    <span aria-hidden="true">{orderExpanded ? '-' : '+'}</span>
                    <strong>{order.label}</strong>
                    <span className="subtle">{order.customerName}</span>
                  </button>
                  <span>{order.status}</span><span>{formatDate(order.dueDate)}</span>
                  <span className="priority-pill">P{order.priority}</span><span>{order.percentComplete}%</span>
                </div>
                {orderExpanded && order.artworks.map((artwork) => {
                  const artworkExpanded = expandedNodeIds.has(artwork.id)
                  return (
                    <div key={artwork.id}>
                      <div className="workshop-tree-row workshop-tree-level-artwork">
                        <button type="button" className="workshop-tree-toggle" onClick={() => toggleNode(artwork.id)} aria-expanded={artworkExpanded}>
                          <span aria-hidden="true">{artworkExpanded ? '-' : '+'}</span><strong>{artwork.label}</strong>
                        </button>
                        <span>{artwork.status}</span><span>{formatDate(artwork.dueDate)}</span>
                        <span className="priority-pill">P{artwork.priority}</span><span>{artwork.percentComplete}%</span>
                      </div>
                      {artworkExpanded && artwork.pieces.map((piece) => {
                        const pieceExpanded = expandedNodeIds.has(piece.id)
                        const row = filteredRows.find((candidate) => candidate.workItemId === piece.workItemId)
                        return (
                          <div key={piece.id}>
                            <div className="workshop-tree-row workshop-tree-level-piece">
                              <button type="button" className="workshop-tree-toggle" onClick={() => toggleNode(piece.id)} aria-expanded={pieceExpanded}>
                                <span aria-hidden="true">{pieceExpanded ? '-' : '+'}</span><strong>{piece.label}</strong>
                              </button>
                              <span>{piece.status}</span><span>{formatDate(piece.dueDate)}</span>
                              <span className="priority-pill">P{piece.priority}</span><span>{piece.percentComplete}%</span>
                              {row && <button type="button" className="workshop-tree-open" onClick={() => navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)}>Open</button>}
                            </div>
                            {pieceExpanded && piece.operations.map((operation) => (
                              <div key={operation.id} className="workshop-tree-row workshop-tree-level-operation">
                                <span className="workshop-tree-operation-name">{operation.label}</span>
                                <span>{operation.status}</span><span>{formatDate(operation.dueDate)}</span>
                                <span className="priority-pill">P{operation.priority}</span><span>{operation.percentComplete}%</span>
                                <OperationLifecycleActions operation={operation.operation} role="DIRECTOR" actorEmployeeId={directorId} compact />
                              </div>
                            ))}
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
