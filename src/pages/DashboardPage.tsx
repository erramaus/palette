import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import { PRODUCTION_STEP_LABELS, PRODUCTION_STEP_SEQUENCE } from '../utils/productionSteps'

const formatPercent = (value: number): string => `${Math.max(0, Math.min(100, Math.round(value)))}%`

const DashboardPage = () => {
  const navigate = useNavigate()
  const { productionJobs, battlePlans, employees, activityLogs } = useAppState()
  const today = new Date().toISOString().slice(0, 10)

  const workers = useMemo(
    () => employees.filter((employee) => employee.role === 'WORKER' && employee.active),
    [employees],
  )

  const workerPlans = useMemo(() => {
    const map = new Map<string, (typeof battlePlans)[number]>()
    battlePlans
      .filter((plan) => plan.date === today)
      .forEach((plan) => map.set(plan.assignedWorkerId, plan))
    return map
  }, [battlePlans, today])

  const plannedMinutesToday = [...workerPlans.values()].reduce(
    (sum, plan) => sum + plan.tasks.reduce((taskSum, task) => taskSum + task.estimatedMinutes, 0),
    0,
  )

  const completedMinutesToday = [...workerPlans.values()].reduce(
    (sum, plan) =>
      sum +
      plan.tasks
        .filter((task) => task.completed)
        .reduce((taskSum, task) => taskSum + task.estimatedMinutes, 0),
    0,
  )

  const carryForwardMinutes = [...workerPlans.values()].reduce(
    (sum, plan) =>
      sum +
      plan.tasks
        .filter((task) => task.carryForward && !task.completed)
        .reduce((taskSum, task) => taskSum + task.estimatedMinutes, 0),
    0,
  )

  const activeProductionCount = productionJobs.filter(
    (job) => !job.onHold && job.steps.SHIPPED !== 'COMPLETE',
  ).length

  const overdueOrders = productionJobs.filter((job) => job.dueStatus === 'OVERDUE')
  const atRiskOrders = productionJobs.filter((job) => job.dueStatus === 'AT_RISK')
  const todayShipments = productionJobs.filter((job) => job.dueDate === today && !job.onHold)

  const scheduleAttainment = plannedMinutesToday > 0
    ? (completedMinutesToday / plannedMinutesToday) * 100
    : 0

  const qualityEligibleTasks = [...workerPlans.values()].flatMap((plan) =>
    plan.tasks.filter((task) => task.completed),
  )
  const firstPassCompliant = qualityEligibleTasks.filter((task) => !task.carryForward).length
  const firstPassQuality = qualityEligibleTasks.length > 0
    ? (firstPassCompliant / qualityEligibleTasks.length) * 100
    : 0

  const employeeRows = workers.map((worker) => {
    const plan = workerPlans.get(worker.id)
    const sortedTasks = [...(plan?.tasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    const currentTask = sortedTasks.find((task) => !task.completed)
    const assignedMinutes = sortedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    const completedMinutes = sortedTasks
      .filter((task) => task.completed)
      .reduce((sum, task) => sum + task.estimatedMinutes, 0)
    const remainingMinutes = Math.max(0, assignedMinutes - completedMinutes)
    const progress = assignedMinutes > 0 ? (completedMinutes / assignedMinutes) * 100 : 0
    const utilization = worker.defaultAvailableMinutes > 0
      ? (assignedMinutes / worker.defaultAvailableMinutes) * 100
      : 0
    const currentJob = currentTask
      ? productionJobs.find((job) => job.id === currentTask.productionJobId)
      : undefined

    let status = 'No Plan'
    if (plan) {
      if (!currentTask) {
        status = 'Complete'
      } else if (currentJob?.onHold || currentJob?.dueStatus === 'OVERDUE') {
        status = 'Blocked'
      } else if (completedMinutes > 0) {
        status = 'In Progress'
      } else {
        status = 'Ready'
      }
    }

    return {
      worker,
      plan,
      currentOperation: currentTask ? PRODUCTION_STEP_LABELS[currentTask.productionStep] : '--',
      progress,
      remainingMinutes,
      status,
      assignedMinutes,
      completedMinutes,
      utilization,
    }
  })

  const attentionBuckets = [
    {
      label: 'Overdue work',
      count: overdueOrders.length,
    },
    {
      label: 'Jobs missing files',
      count: productionJobs.filter((job) => job.steps.FILES !== 'COMPLETE' && !job.onHold).length,
    },
    {
      label: 'Waiting on Erin',
      count: productionJobs.filter((job) => /erin/i.test(job.notes)).length,
    },
    {
      label: 'Waiting on customer',
      count: productionJobs.filter((job) => /customer|collector/i.test(job.notes)).length,
    },
    {
      label: 'Waiting on materials',
      count: productionJobs.filter((job) => /material|crate/i.test(job.notes)).length,
    },
    {
      label: 'Waiting on approval',
      count: productionJobs.filter((job) => /approval|approved/i.test(job.notes)).length,
    },
    {
      label: 'Equipment issues',
      count: productionJobs.filter((job) => /equipment|printer|machine|repair/i.test(job.notes)).length,
    },
    {
      label: 'Carry-forward items',
      count: [...workerPlans.values()].reduce(
        (sum, plan) => sum + plan.tasks.filter((task) => task.carryForward && !task.completed).length,
        0,
      ),
    },
  ]

  const stageFlow = PRODUCTION_STEP_SEQUENCE.map((step) => {
    const jobsAtStage = productionJobs.filter((job) => {
      if (job.onHold) {
        return false
      }

      const currentStep = PRODUCTION_STEP_SEQUENCE.find(
        (stage) => job.steps[stage] === 'WAITING',
      )
      return currentStep === step
    })

    const oldestJob = [...jobsAtStage].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )[0]

    const standardMinutes = jobsAtStage.reduce(
      (sum, job) => sum + job.estimatedMinutes[step],
      0,
    )

    return {
      step,
      label: PRODUCTION_STEP_LABELS[step],
      pieceCount: jobsAtStage.length,
      standardMinutes,
      oldestJob,
    }
  })

  const liveActivity = activityLogs.slice(0, 8)

  const quickActions = [
    { label: 'Import Orders', to: '/orders' },
    { label: 'Generate Battle Plans', to: '/battle-plans' },
    { label: 'Generate Production Tags', to: '/tags' },
    { label: 'Open Workshop List', to: '/workshop-list' },
    { label: 'Create Shipment', to: '/shipping' },
    { label: 'Generate Reports', to: '/reports' },
  ]

  return (
    <section className="page page-dashboard dashboard-command-center">
      <div className="page-heading">
        <h2>Production Director Command Center</h2>
        <p>Live production priorities, flow bottlenecks, capacity, and shipping readiness for today.</p>
      </div>

      <section className="summary-grid dashboard-kpi-grid">
        <article className="summary-card">
          <p>Today's Shipments</p>
          <h3>{todayShipments.length}</h3>
        </article>
        <article className="summary-card">
          <p>Overdue Orders</p>
          <h3>{overdueOrders.length}</h3>
        </article>
        <article className="summary-card">
          <p>At-Risk Orders</p>
          <h3>{atRiskOrders.length}</h3>
        </article>
        <article className="summary-card">
          <p>Active Production</p>
          <h3>{activeProductionCount}</h3>
        </article>
        <article className="summary-card">
          <p>Department Schedule Attainment</p>
          <h3>{formatPercent(scheduleAttainment)}</h3>
        </article>
        <article className="summary-card">
          <p>First-Pass Quality</p>
          <h3>{formatPercent(firstPassQuality)}</h3>
        </article>
        <article className="summary-card">
          <p>Production Minutes Completed Today</p>
          <h3>{completedMinutesToday}</h3>
        </article>
        <article className="summary-card">
          <p>Carry-Forward Minutes</p>
          <h3>{carryForwardMinutes}</h3>
        </article>
      </section>

      <section className="dashboard-two-col">
        <article className="panel">
          <h3>Today's Production</h3>
          <div className="dashboard-employee-grid">
            {employeeRows.map((row) => (
              <article key={row.worker.id} className="dashboard-employee-card">
                <div>
                  <h4>{row.worker.name}</h4>
                  <p className="subtle">Current Operation: {row.currentOperation}</p>
                </div>
                <div className="progress-wrap dashboard-progress-wrap" role="progressbar" aria-valuenow={Math.round(row.progress)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar" style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }} />
                </div>
                <div className="dashboard-employee-meta">
                  <span>Progress: {formatPercent(row.progress)}</span>
                  <span>Minutes Remaining: {row.remainingMinutes}</span>
                  <span>Status: {row.status}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Director Attention</h3>
          <ul className="attention-list">
            {attentionBuckets.map((item) => (
              <li key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-two-col">
        <article className="panel">
          <h3>Production Flow</h3>
          <div className="dashboard-flow-grid">
            {stageFlow.map((stage, index) => (
              <div key={stage.step} className="dashboard-flow-stage">
                <strong>{stage.label}</strong>
                <p>Piece Count: {stage.pieceCount}</p>
                <p>Standard Minutes: {stage.standardMinutes}</p>
                <p>Oldest Job: {stage.oldestJob?.orderNumber ?? '--'}</p>
                {index < stageFlow.length - 1 ? <p className="dashboard-flow-arrow">↓</p> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Today's Shipments</h3>
          <div className="table-wrap">
            <table className="workshop-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Artwork</th>
                  <th>Carrier</th>
                  <th>Due Time</th>
                  <th>Ready?</th>
                </tr>
              </thead>
              <tbody>
                {todayShipments.map((job) => (
                  <tr key={job.id}>
                    <td>{job.customerName}</td>
                    <td>{job.artworkTitle}</td>
                    <td>Not Set</td>
                    <td>{job.dueDate}</td>
                    <td>{job.steps.SHIPPED === 'COMPLETE' ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dashboard-two-col">
        <article className="panel">
          <h3>Capacity</h3>
          <div className="table-wrap">
            <table className="workshop-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Available</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>Remaining</th>
                  <th>Utilization %</th>
                </tr>
              </thead>
              <tbody>
                {employeeRows.map((row) => (
                  <tr key={row.worker.id}>
                    <td>{row.worker.name}</td>
                    <td>{row.worker.defaultAvailableMinutes}</td>
                    <td>{row.assignedMinutes}</td>
                    <td>{row.completedMinutes}</td>
                    <td>{Math.max(0, row.assignedMinutes - row.completedMinutes)}</td>
                    <td>{formatPercent(row.utilization)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <h3>Live Activity</h3>
          <ul className="plain-list">
            {liveActivity.length > 0 ? (
              liveActivity.map((log) => (
                <li key={log.id}>
                  <div>
                    <strong>{log.action.replace('_', ' ')}</strong>
                    <p>{log.entityType} • {log.entityId}</p>
                  </div>
                  <span className="subtle">{new Date(log.occurredAt).toLocaleTimeString()}</span>
                </li>
              ))
            ) : (
              <li>
                <div>
                  <strong>No live activity yet</strong>
                  <p>Activity will populate as operations and planning actions occur.</p>
                </div>
              </li>
            )}
          </ul>
        </article>
      </section>

      <article className="panel">
        <h3>Quick Actions</h3>
        <div className="dashboard-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="btn"
              onClick={() => navigate(action.to)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </article>

      <div className="subtle">
        Planned Minutes Today: {plannedMinutesToday}
      </div>
    </section>
  )
}

export default DashboardPage
