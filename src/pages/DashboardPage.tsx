import SummaryCard from '../components/dashboard/SummaryCard'
import StatusBadge from '../components/common/StatusBadge'
import Logo from '../components/common/Logo'
import { useAppState } from '../state/AppStateContext'

const DashboardPage = () => {
  const { productionJobs, battlePlans, employees } = useAppState()
  const today = new Date().toISOString().slice(0, 10)

  const activeJobs = productionJobs.filter((job) => job.dueStatus !== 'ON_HOLD')
  const dueTodayCount = productionJobs.filter(
    (job) => job.dueStatus === 'DUE_TODAY',
  ).length
  const dueSoonCount = productionJobs.filter(
    (job) => job.dueStatus === 'DUE_SOON',
  ).length
  const atRiskCount = productionJobs.filter((job) => job.dueStatus === 'AT_RISK').length
  const overdueCount = productionJobs.filter(
    (job) => job.dueStatus === 'OVERDUE',
  ).length

  const todayPlans = battlePlans.filter((plan) => plan.date === today)

  const urgentJobs = [...productionJobs]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)

  const workerPlans = todayPlans.filter((plan) => {
    const employee = employees.find((candidate) => candidate.id === plan.assignedWorkerId)
    return employee?.role === 'WORKER'
  })

  const directorAttention = [
    `${overdueCount} overdue jobs need follow-up`,
    `${atRiskCount} at-risk jobs need reprioritization`,
    `${workerPlans.length} worker Battle Plans to review`,
  ]

  const getEmployeeName = (employeeId: string): string =>
    employees.find((employee) => employee.id === employeeId)?.name ?? employeeId

  return (
    <section className="page page-dashboard dashboard-surface">
      <article className="panel dashboard-brand-panel">
        <Logo size="small" showText showSubtitle className="dashboard-logo" />
      </article>

      <div className="summary-grid">
        <SummaryCard label="Active Production Jobs" value={activeJobs.length} />
        <SummaryCard label="Due Today" value={dueTodayCount} />
        <SummaryCard label="Due Soon" value={dueSoonCount} />
        <SummaryCard label="At Risk" value={atRiskCount} />
        <SummaryCard label="Overdue" value={overdueCount} />
        <SummaryCard label="Worker Battle Plans Today" value={workerPlans.length} />
      </div>

      <div className="dashboard-lists">
        <article className="panel">
          <h3>Most Urgent Jobs</h3>
          <ul className="plain-list">
            {urgentJobs.map((job) => (
              <li key={job.id}>
                <div>
                  <strong>{job.orderNumber}</strong> {job.artworkTitle}
                  <p>{job.customerName}</p>
                </div>
                <StatusBadge dueStatus={job.dueStatus} />
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Today's Worker Battle Plans</h3>
          <ul className="plain-list">
            {workerPlans.map((plan) => (
              <li key={plan.id}>
                <div>
                  <strong>{getEmployeeName(plan.assignedWorkerId)}</strong>
                  <p>{plan.tasks.length} tasks planned</p>
                </div>
                <span className="subtle">{plan.status}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Production Director Attention List</h3>
          <ul className="attention-list">
            {directorAttention.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
