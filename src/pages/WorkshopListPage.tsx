import { useMemo, useState } from 'react'
import ProductionStepCell from '../components/workshop/ProductionStepCell'
import StepLegend from '../components/workshop/StepLegend'
import StatusBadge from '../components/common/StatusBadge'
import { useAppState } from '../state/AppStateContext'
import type { DueStatus, Priority, ProductType } from '../types/production'
import {
  PRODUCTION_STEP_LABELS,
  PRODUCTION_STEP_SEQUENCE,
} from '../utils/productionSteps'

const WorkshopListPage = () => {
  const { productionJobs, employees, updateProductionStep } = useAppState()

  const [dueFilter, setDueFilter] = useState<DueStatus | 'ALL'>('ALL')
  const [workerFilter, setWorkerFilter] = useState<string>('ALL')
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [searchText, setSearchText] = useState('')

  const filteredJobs = useMemo(() => {
    const search = searchText.trim().toLowerCase()

    return [...productionJobs]
      .filter((job) => dueFilter === 'ALL' || job.dueStatus === dueFilter)
      .filter((job) => workerFilter === 'ALL' || job.assignedWorkerId === workerFilter)
      .filter(
        (job) => productTypeFilter === 'ALL' || job.productType === productTypeFilter,
      )
      .filter((job) => priorityFilter === 'ALL' || job.priority === priorityFilter)
      .filter((job) => {
        if (!search) {
          return true
        }

        return (
          job.orderNumber.toLowerCase().includes(search) ||
          job.customerName.toLowerCase().includes(search) ||
          job.artworkTitle.toLowerCase().includes(search)
        )
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [
    productionJobs,
    dueFilter,
    workerFilter,
    productTypeFilter,
    priorityFilter,
    searchText,
  ])

  const getWorkerName = (workerId: string): string =>
    employees.find((employee) => employee.id === workerId)?.name ?? workerId

  return (
    <section className="page">
      <div className="page-heading">
        <h2>Workshop List</h2>
        <p>One row per production job or order line. Click step cells to cycle status.</p>
      </div>

      <div className="filters">
        <label>
          Due Status
          <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value as DueStatus | 'ALL')}>
            <option value="ALL">All</option>
            <option value="ON_TRACK">On Track</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="DUE_TODAY">Due Today</option>
            <option value="AT_RISK">At Risk</option>
            <option value="OVERDUE">Overdue</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </label>

        <label>
          Assigned Worker
          <select value={workerFilter} onChange={(event) => setWorkerFilter(event.target.value)}>
            <option value="ALL">All</option>
            {employees
              .filter((employee) => employee.role === 'WORKER')
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </select>
        </label>

        <label>
          Product Type
          <select
            value={productTypeFilter}
            onChange={(event) => setProductTypeFilter(event.target.value as ProductType | 'ALL')}
          >
            <option value="ALL">All</option>
            <option value="ORIGINAL">Original</option>
            <option value="TEXTURED_REPLICA_3D">3D Textured Replica</option>
            <option value="CANVAS">Canvas</option>
            <option value="GALLERY_INVENTORY">Gallery Inventory</option>
          </select>
        </label>

        <label>
          Priority
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as Priority | 'ALL')}>
            <option value="ALL">All</option>
            <option value="ORIGINALS">Originals</option>
            <option value="CUSTOMER_PURCHASED">Customer Purchased</option>
            <option value="GALLERY_INVENTORY">Gallery Inventory</option>
          </select>
        </label>

        <label className="search-field">
          Search
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Order, customer, or artwork"
          />
        </label>
      </div>

      <StepLegend />

      <div className="table-wrap">
        <table className="workshop-table">
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Due Status</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Artwork</th>
              <th>Product Type</th>
              <th>Size</th>
              <th>Priority</th>
              <th>Assigned Worker</th>
              <th>FILES</th>
              <th>PRINTED</th>
              <th>DIBOND</th>
              <th>STRETCHER/BASE</th>
              <th>MOUNTED</th>
              <th>FRAME MADE</th>
              <th>FRAMED</th>
              <th>SHIPPED</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => {
              const rowClass =
                job.dueStatus === 'OVERDUE'
                  ? 'row-overdue'
                  : job.dueStatus === 'DUE_TODAY'
                    ? 'row-due-today'
                    : job.dueStatus === 'DUE_SOON'
                      ? 'row-due-soon'
                      : ''

              return (
                <tr key={job.id} className={rowClass}>
                  <td>{job.dueDate}</td>
                  <td>
                    <StatusBadge dueStatus={job.dueStatus} />
                  </td>
                  <td>{job.orderNumber}</td>
                  <td>{job.customerName}</td>
                  <td>{job.artworkTitle}</td>
                  <td>{job.productType}</td>
                  <td>{`${job.width}x${job.height}`}</td>
                  <td>
                    <StatusBadge priority={job.priority} />
                  </td>
                  <td>{getWorkerName(job.assignedWorkerId)}</td>
                  {PRODUCTION_STEP_SEQUENCE.map((stepName) => (
                    <td key={stepName} aria-label={PRODUCTION_STEP_LABELS[stepName]}>
                      <ProductionStepCell
                        status={job.steps[stepName]}
                        onClick={() => updateProductionStep(job.id, stepName)}
                      />
                    </td>
                  ))}
                  <td>{job.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default WorkshopListPage
