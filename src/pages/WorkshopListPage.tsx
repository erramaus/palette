import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '--'
  }

  return new Date(value).toLocaleString()
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

  const [environment] = useState<WorkshopListUiEnvironment>(() =>
    getWorkshopListUiEnvironment(),
  )

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

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

      {!loading && !errorMessage && filteredRows.length > 0 && (
        <div className="table-wrap">
          <table className="workshop-table workshop-v2-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('priority')}>
                    Priority
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('workItemNumber')}>
                    Work Item #
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('customer')}>
                    Customer
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('artwork')}>
                    Artwork
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('product')}>
                    Product
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('type')}>
                    Type
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('currentStage')}>
                    Current Stage
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('assignedEmployee')}>
                    Assigned Employee
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('dueDate')}>
                    Due Date
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('status')}>
                    Status
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('progress')}>
                    Progress
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => onSort('updatedDate')}>
                    Updated
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.workItemId}
                  className={row.isLate ? 'row-overdue' : row.isBlocked ? 'row-due-soon' : ''}
                  tabIndex={0}
                  role="button"
                  onClick={() => navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/work-items/${encodeURIComponent(row.workItemNumber)}`)
                    }
                  }}
                  aria-label={`Open details for ${row.workItemNumber}`}
                >
                  <td>
                    <span className="priority-pill">P{row.priority}</span>
                  </td>
                  <td>{row.workItemNumber}</td>
                  <td>{row.customerName}</td>
                  <td>{row.artworkName}</td>
                  <td>{row.productName}</td>
                  <td>{row.workItemType}</td>
                  <td>{row.currentStage}</td>
                  <td>{row.assignedEmployee}</td>
                  <td>
                    {formatDate(row.dueDate)}
                    {row.isLate && <span className="inline-indicator late-indicator">Late</span>}
                  </td>
                  <td>
                    {row.status}
                    {row.isBlocked && (
                      <span className="inline-indicator blocked-indicator">Blocked</span>
                    )}
                  </td>
                  <td>
                    <div className="progress-wrap" aria-label={`${row.workflowProgress}% complete`}>
                      <div
                        className="progress-bar"
                        style={{ width: `${Math.max(0, Math.min(100, row.workflowProgress))}%` }}
                      />
                    </div>
                    <span className="progress-label">{row.workflowProgress}%</span>
                  </td>
                  <td>{formatDateTime(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
