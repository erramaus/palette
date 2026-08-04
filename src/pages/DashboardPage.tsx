import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductionAnalyticsService } from '../services/ProductionAnalyticsService'
import { ProductionIntelligenceService } from '../services/ProductionIntelligenceService'
import { IntelligenceService } from '../services/intelligence/IntelligenceService'
import { useAppState } from '../state/AppStateContext'
import type { IntelligenceRecommendation, RiskLevel } from '../types/productionIntelligence'
import type { ProductionMetricDefinition } from '../types/productionAnalytics'
import { PRODUCTION_STEP_LABELS, PRODUCTION_STEP_SEQUENCE } from '../utils/productionSteps'

const formatPercent = (value: number): string => `${Math.max(0, Math.min(100, Math.round(value)))}%`

const localDateKey = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`

const riskBadgeClass: Record<RiskLevel, string> = {
  INFO: 'badge-risk-info',
  LOW: 'badge-risk-low',
  MEDIUM: 'badge-risk-medium',
  HIGH: 'badge-risk-high',
  CRITICAL: 'badge-risk-critical',
}

const formatDelta = (value: number | null): string => {
  if (value === null) {
    return 'vs last week --'
  }

  const rounded = Math.round(value * 10) / 10
  return `vs last week ${rounded > 0 ? '+' : ''}${rounded}`
}

const formatWeeklyMetric = (metric: ProductionMetricDefinition | undefined): string => {
  if (!metric || metric.trend.currentWeek === null) {
    return '--'
  }

  const value = metric.trend.currentWeek
  if (metric.benchmark.unit === 'PERCENT') {
    return `${Math.round(value)}%`
  }
  if (metric.benchmark.unit === 'DAYS') {
    return `${Math.round(value * 10) / 10}d`
  }
  if (metric.benchmark.unit === 'HOURS') {
    return `${Math.round(value * 10) / 10}h`
  }

  return `${Math.round(value)}`
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const {
    productionJobs,
    threeDFilePreparations,
    battlePlans,
    employees,
    activityLogs,
    operationIntelligence,
    addActivityLog,
    analyticsTargets,
    intelligenceReviewState,
    setIntelligenceReviewState,
    scheduleResult,
  } = useAppState()
  const today = new Date().toISOString().slice(0, 10)
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = localDateKey(tomorrowDate)
  const {
    dismissedRecommendationIds,
    reviewedRecommendationIds,
    acceptedRecommendationIds,
  } = intelligenceReviewState
  const [intelligenceConfig, setIntelligenceConfig] = useState({
    dueSoonDays: 2,
    stageAgeThresholdDays: 2,
    capacityWarningPercentage: 85,
    overloadPercentage: 100,
    carryForwardWarningCount: 2,
    qualityWarningThreshold: 2,
    bottleneckQueueThreshold: 3,
    minimumConfidenceThreshold: 0.5,
  })

  const workers = useMemo(
    () => employees.filter((employee) => employee.role === 'WORKER' && employee.active),
    [employees],
  )
  const activeDirectorCount = useMemo(
    () => employees.filter((employee) => employee.role === 'PRODUCTION_DIRECTOR' && employee.active).length,
    [employees],
  )
  const activeOperatorCount = workers.length
  const activeWorkerIds = useMemo(() => new Set(workers.map((worker) => worker.id)), [workers])

  const workerPlans = useMemo(() => {
    const map = new Map<string, (typeof battlePlans)[number]>()
    battlePlans
      .filter((plan) => plan.date === today && activeWorkerIds.has(plan.assignedWorkerId))
      .forEach((plan) => map.set(plan.assignedWorkerId, plan))
    return map
  }, [battlePlans, today, activeWorkerIds])

  const intelligenceService = useMemo(
    () =>
      new ProductionIntelligenceService({
        productionJobs,
        battlePlans,
        employees,
        activityLogs,
        config: {
          ...intelligenceConfig,
        },
      }),
    [productionJobs, battlePlans, employees, activityLogs, intelligenceConfig],
  )

  const intelligenceFoundation = useMemo(() => {
    const service = new IntelligenceService({
      productionJobs,
      employees,
      battlePlans,
    })

    return {
      health: service.getProductionHealth(),
      bottleneck: service.getCurrentBottlenecks(),
      dueDateRisks: service.getDueDateRisks(),
      recommendations: service.getDirectorRecommendations().slice(0, 3),
    }
  }, [productionJobs, employees, battlePlans])

  const analyticsService = useMemo(
    () =>
      new ProductionAnalyticsService({
        productionJobs,
        battlePlans,
        employees,
        activityLogs,
        targets: analyticsTargets,
      }),
    [productionJobs, battlePlans, employees, activityLogs, analyticsTargets],
  )

  const weeklyAnalytics = useMemo(
    () => analyticsService.getWeeklyAnalytics('PREVIOUS_WEEK'),
    [analyticsService],
  )

  const weeklyMetricMap = useMemo(() => {
    const map = new Map<ProductionMetricDefinition['key'], ProductionMetricDefinition>()
    weeklyAnalytics.currentWeek.metricDefinitions.forEach((metric) => {
      map.set(metric.key, metric)
    })
    return map
  }, [weeklyAnalytics.currentWeek.metricDefinitions])

  const weeklyOnTime = weeklyMetricMap.get('ON_TIME_COMPLETION_RATE')
  const weeklySchedule = weeklyMetricMap.get('SCHEDULE_ATTAINMENT')
  const weeklyQuality = weeklyMetricMap.get('FIRST_PASS_QUALITY')
  const weeklyFinishedPieces = weeklyMetricMap.get('FINISHED_PIECE_THROUGHPUT')
  const weeklyStandardMinutes = weeklyMetricMap.get('STANDARD_MINUTES_EARNED')
  const weeklyCarryForwardRate = weeklyMetricMap.get('CARRY_FORWARD_RATE')
  const weeklyLeadTime = weeklyMetricMap.get('MEDIAN_LEAD_TIME')

  const intelligenceForecast = useMemo(() => intelligenceService.getForecast(), [intelligenceService])
  const topRecommendations = useMemo(
    () =>
      intelligenceForecast.recommendations
        .filter((recommendation) => !dismissedRecommendationIds[recommendation.id])
        .slice(0, 3),
    [intelligenceForecast.recommendations, dismissedRecommendationIds],
  )
  const deadlineRiskHighlights = useMemo(
    () => intelligenceForecast.deadlineRisks.slice(0, 5),
    [intelligenceForecast.deadlineRisks],
  )
  const capacityOpportunities = useMemo(
    () => intelligenceForecast.capacityForecasts.filter((item) => item.status !== 'BALANCED').slice(0, 5),
    [intelligenceForecast.capacityForecasts],
  )

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
      label: '3D file review required',
      count: threeDFilePreparations.filter((preparation) => preparation.attentionRequired).length,
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

  const scheduledDate = (value: string): string => localDateKey(new Date(value))
  const todaySchedule = scheduleResult.entries.filter((entry) =>
    scheduledDate(entry.plannedStart) === today
    && entry.status !== 'COMPLETE'
    && activeWorkerIds.has(entry.assignedEmployee),
  )
  const tomorrowSchedule = scheduleResult.entries.filter((entry) =>
    scheduledDate(entry.plannedStart) === tomorrow
    && entry.status !== 'COMPLETE'
    && activeWorkerIds.has(entry.assignedEmployee),
  )
  const totalDailyCapacity = workers.reduce((sum, worker) => sum + worker.defaultAvailableMinutes, 0)
  const todayScheduledMinutes = todaySchedule.reduce((sum, entry) => sum + entry.estimatedMinutes, 0)
  const tomorrowScheduledMinutes = tomorrowSchedule.reduce((sum, entry) => sum + entry.estimatedMinutes, 0)
  const lateScheduledOperations = scheduleResult.entries.filter((entry) =>
    entry.status !== 'COMPLETE' && new Date(entry.plannedFinish) > new Date(`${entry.dueDate}T23:59:59`),
  )
  const overloadedEmployees = new Set(scheduleResult.conflicts
    .filter((conflict) => conflict.type === 'EMPLOYEE_OVERLOAD' && conflict.employeeId)
    .map((conflict) => conflict.employeeId))
  const workCenterMinutes = todaySchedule.reduce<Record<string, number>>((totals, entry) => ({
    ...totals,
    [entry.assignedWorkCenter]: (totals[entry.assignedWorkCenter] ?? 0) + entry.estimatedMinutes,
  }), {})
  const largestScheduleBottleneck = Object.entries(workCenterMinutes).sort((left, right) => right[1] - left[1])[0]
  const tomorrowWorkCenterMinutes = tomorrowSchedule.reduce<Record<string, number>>((totals, entry) => ({
    ...totals,
    [entry.assignedWorkCenter]: (totals[entry.assignedWorkCenter] ?? 0) + entry.estimatedMinutes,
  }), {})
  const tomorrowBottleneck = Object.entries(tomorrowWorkCenterMinutes).sort((left, right) => right[1] - left[1])[0]
  const scheduledEmployeeRows = workers.map((employee) => {
    const entries = scheduleResult.entries
      .filter((entry) => entry.assignedEmployee === employee.id && entry.status !== 'COMPLETE')
      .sort((left, right) => left.plannedFinish.localeCompare(right.plannedFinish))
    return {
      employee,
      finish: entries.at(-1)?.plannedFinish,
      capacity: scheduleResult.employeeCapacity.find((capacity) => capacity.employeeId === employee.id),
    }
  })

  const openRecommendationTarget = (recommendation: IntelligenceRecommendation): void => {
    if (recommendation.actionTarget.kind === 'BATTLE_PLAN') {
      navigate('/battle-plans')
      return
    }

    navigate('/workshop-list')
  }

  const dismissRecommendation = (recommendation: IntelligenceRecommendation): void => {
    setIntelligenceReviewState({
      ...intelligenceReviewState,
      dismissedRecommendationIds: { ...dismissedRecommendationIds, [recommendation.id]: true },
    })

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: recommendation.id,
      action: 'RECOMMENDATION_DISMISSED',
      metadata: {
        priority: recommendation.priority,
        confidence: recommendation.confidence,
      },
    })
  }

  const markRecommendationReviewed = (recommendation: IntelligenceRecommendation): void => {
    setIntelligenceReviewState({
      ...intelligenceReviewState,
      reviewedRecommendationIds: { ...reviewedRecommendationIds, [recommendation.id]: true },
    })

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: recommendation.id,
      action: 'RECOMMENDATION_REVIEWED',
      metadata: {
        priority: recommendation.priority,
        confidence: recommendation.confidence,
      },
    })
  }

  const acceptRecommendation = (recommendation: IntelligenceRecommendation): void => {
    setIntelligenceReviewState({
      ...intelligenceReviewState,
      acceptedRecommendationIds: { ...acceptedRecommendationIds, [recommendation.id]: true },
    })

    addActivityLog({
      entityType: 'BattlePlan',
      entityId: recommendation.id,
      action: 'RECOMMENDATION_ACCEPTED',
      metadata: {
        priority: recommendation.priority,
        confidence: recommendation.confidence,
      },
    })
  }

  const logForecastGenerated = (): void => {
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: 'PRODUCTION_INTELLIGENCE',
      action: 'FORECAST_GENERATED',
      metadata: {
        recommendationCount: intelligenceForecast.recommendations.length,
        alertCount: intelligenceForecast.alerts.length,
      },
    })
  }

  const updateThresholdProfile = (profile: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE'): void => {
    const nextConfig =
      profile === 'AGGRESSIVE'
        ? {
            ...intelligenceConfig,
            capacityWarningPercentage: 75,
            bottleneckQueueThreshold: 2,
            minimumConfidenceThreshold: 0.4,
          }
        : profile === 'CONSERVATIVE'
          ? {
              ...intelligenceConfig,
              capacityWarningPercentage: 95,
              bottleneckQueueThreshold: 4,
              minimumConfidenceThreshold: 0.65,
            }
          : {
              ...intelligenceConfig,
              capacityWarningPercentage: 85,
              bottleneckQueueThreshold: 3,
              minimumConfidenceThreshold: 0.5,
            }

    setIntelligenceConfig(nextConfig)
    addActivityLog({
      entityType: 'BattlePlan',
      entityId: 'PRODUCTION_INTELLIGENCE',
      action: 'INTELLIGENCE_THRESHOLD_CHANGED',
      metadata: {
        profile,
        capacityWarningPercentage: nextConfig.capacityWarningPercentage,
        bottleneckQueueThreshold: nextConfig.bottleneckQueueThreshold,
        minimumConfidenceThreshold: nextConfig.minimumConfidenceThreshold,
      },
    })
  }

  return (
    <section className="page page-dashboard dashboard-command-center">
      <div className="page-heading">
        <h2>Production Director Command Center</h2>
        <p>Live production priorities, flow bottlenecks, capacity, and shipping readiness for today.</p>
      </div>

      <section className="summary-grid dashboard-kpi-grid">
        <article className="summary-card">
          <p>Today's Production</p>
          <h3>{todayShipments.length}</h3>
        </article>
        <article className="summary-card">
          <p>Late Orders</p>
          <h3>{overdueOrders.length}</h3>
        </article>
        <article className="summary-card">
          <p>Production Health</p>
          <h3>{atRiskOrders.length}</h3>
        </article>
        <article className="summary-card">
          <p>Active Production</p>
          <h3>{activeProductionCount}</h3>
        </article>
        <article className="summary-card">
          <p>Capacity</p>
          <h3>{formatPercent(scheduleAttainment)}</h3>
        </article>
        <article className="summary-card">
          <p>Materials</p>
          <h3>{formatPercent(firstPassQuality)}</h3>
        </article>
        <article className="summary-card">
          <p>Print Queue</p>
          <h3>{completedMinutesToday}</h3>
        </article>
        <article className="summary-card">
          <p>Timeline</p>
          <h3>{carryForwardMinutes}</h3>
        </article>
        <article className="summary-card">
          <p>Active Team</p>
          <h3>{activeDirectorCount} Director / {activeOperatorCount} Operator</h3>
        </article>
      </section>

      <section className="panel">
        <div className="work-item-section-header">
          <div>
            <h3>Scheduling Summary</h3>
            <p className="subtle">Capacity and risk calculated from the production calendar.</p>
          </div>
          <span className="badge">{scheduleResult.entries.length} operations scheduled</span>
        </div>
        <div className="summary-grid dashboard-kpi-grid">
          <article className="summary-card"><p>Today's Utilization</p><h3>{formatPercent(totalDailyCapacity > 0 ? (todayScheduledMinutes / totalDailyCapacity) * 100 : 0)}</h3></article>
          <article className="summary-card"><p>Tomorrow's Utilization</p><h3>{formatPercent(totalDailyCapacity > 0 ? (tomorrowScheduledMinutes / totalDailyCapacity) * 100 : 0)}</h3></article>
          <article className="summary-card"><p>Late Operations</p><h3>{lateScheduledOperations.length}</h3></article>
          <article className="summary-card"><p>Overloaded Employees</p><h3>{overloadedEmployees.size}</h3></article>
          <article className="summary-card"><p>Available Capacity</p><h3>{Math.max(0, totalDailyCapacity - todayScheduledMinutes)} min</h3></article>
          <article className="summary-card"><p>Largest Bottleneck</p><h3>{largestScheduleBottleneck ? `${largestScheduleBottleneck[0]} · ${largestScheduleBottleneck[1]} min` : '--'}</h3></article>
        </div>
      </section>

      <section className="summary-grid dashboard-kpi-grid dashboard-weekly-kpi-grid">
        <article className="summary-card summary-card-weekly">
          <p>Weekly On-Time Completion</p>
          <h3>{formatWeeklyMetric(weeklyOnTime)}</h3>
          <span className="subtle">{formatDelta(weeklyOnTime?.trend.absoluteChange ?? null)}%</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Weekly Schedule Attainment</p>
          <h3>{formatWeeklyMetric(weeklySchedule)}</h3>
          <span className="subtle">{formatDelta(weeklySchedule?.trend.absoluteChange ?? null)}%</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Weekly First-Pass Quality</p>
          <h3>{formatWeeklyMetric(weeklyQuality)}</h3>
          <span className="subtle">{formatDelta(weeklyQuality?.trend.absoluteChange ?? null)}%</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Finished Pieces (Week)</p>
          <h3>{formatWeeklyMetric(weeklyFinishedPieces)}</h3>
          <span className="subtle">{formatDelta(weeklyFinishedPieces?.trend.absoluteChange ?? null)}</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Standard Hours Earned</p>
          <h3>
            {weeklyStandardMinutes?.trend.currentWeek === null || weeklyStandardMinutes === undefined
              ? '--'
              : `${Math.round((weeklyStandardMinutes.trend.currentWeek / 60) * 10) / 10}h`}
          </h3>
          <span className="subtle">
            {weeklyStandardMinutes?.trend.absoluteChange === null || weeklyStandardMinutes === undefined
              ? 'vs last week --'
              : `vs last week ${Math.round((weeklyStandardMinutes.trend.absoluteChange / 60) * 10) / 10}h`}
          </span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Carry-Forward Hours</p>
          <h3>{`${weeklyAnalytics.currentWeek.directorScorecard.carryForwardHours}h`}</h3>
          <span className="subtle">Rate {formatWeeklyMetric(weeklyCarryForwardRate)}</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>Median Lead Time</p>
          <h3>{formatWeeklyMetric(weeklyLeadTime)}</h3>
          <span className="subtle">{formatDelta(weeklyLeadTime?.trend.absoluteChange ?? null)}d</span>
        </article>
        <article className="summary-card summary-card-weekly">
          <p>At-Risk / Overdue Jobs</p>
          <h3>
            {weeklyAnalytics.currentWeek.directorScorecard.atRiskBacklog} /
            {' '}
            {weeklyAnalytics.currentWeek.directorScorecard.overdueBacklog}
          </h3>
          <span className="subtle">
            vs last week {weeklyAnalytics.previousWeek?.directorScorecard.atRiskBacklog ?? '--'} /
            {' '}
            {weeklyAnalytics.previousWeek?.directorScorecard.overdueBacklog ?? '--'}
          </span>
        </article>
      </section>

      <section className="panel dashboard-intelligence-summary">
        <div className="work-item-section-header">
          <div>
            <h3>Production Health</h3>
            <p className="subtle">Current deterministic operating status.</p>
          </div>
          <div className="dashboard-intelligence-health">
            <span
              className="dashboard-intelligence-score"
              style={{ color: intelligenceFoundation.health.color }}
            >
              {intelligenceFoundation.health.score}
            </span>
            <div>
              <strong style={{ color: intelligenceFoundation.health.color }}>
                {intelligenceFoundation.health.status}
              </strong>
              <p className="subtle">Health Score</p>
            </div>
          </div>
        </div>

        <p className="dashboard-intelligence-explanation">
          {intelligenceFoundation.health.explanation}
        </p>
      </section>

      <section className="panel dashboard-predictive-panel">
        <div className="work-item-section-header">
          <h3>Schedule Forecast</h3>
          <span className="subtle">Generated {new Date(scheduleResult.generatedAt).toLocaleString()}</span>
        </div>

        <div className="dashboard-predictive-grid">
          <article>
            <h4>Jobs Likely To Become Late</h4>
            <ul className="plain-list">
              {lateScheduledOperations.length > 0 ? (
                lateScheduledOperations.slice(0, 5).map((entry) => (
                  <li key={entry.operationId}>
                    <div>
                      <strong>{entry.orderNumber} • {entry.operation}</strong>
                      <p>Expected {new Date(entry.plannedFinish).toLocaleDateString()} • Due {new Date(entry.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="subtle">{entry.estimatedMinutes} min</span>
                  </li>
                ))
              ) : (
                <li>
                  <div>
                    <strong>None currently projected</strong>
                    <p>All active jobs are currently on track.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>

          <article>
            <h4>Likely Carry-Forward Operations</h4>
            <ul className="plain-list">
              {tomorrowSchedule.length > 0 ? (
                tomorrowSchedule.slice(0, 5).map((entry) => (
                  <li key={entry.operationId}>
                    <div>
                      <strong>{entry.orderNumber} • {entry.operation}</strong>
                      <p>{entry.confidence} confidence • scheduled {new Date(entry.plannedStart).toLocaleTimeString()}</p>
                    </div>
                    <span className="subtle">{entry.estimatedMinutes} min</span>
                  </li>
                ))
              ) : (
                <li>
                  <div>
                    <strong>No carry-forward hotspots</strong>
                    <p>Current plans are within projected daily capacity.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>

          <article>
            <h4>Projected Bottleneck</h4>
            {tomorrowBottleneck ? (
              <div className="dashboard-predictive-callout">
                <strong>{tomorrowBottleneck[0]}</strong>
                <p>{tomorrowBottleneck[1]} scheduled minutes tomorrow</p>
                <span className="subtle">Derived from production calendar entries</span>
              </div>
            ) : (
              <p className="subtle">No strong bottleneck projection for tomorrow.</p>
            )}
          </article>

          <article>
            <h4>Projected Worker Finish Times</h4>
            <ul className="plain-list">
              {scheduledEmployeeRows.length > 0 ? (
                scheduledEmployeeRows.slice(0, 6).map(({ employee, finish, capacity }) => (
                  <li key={employee.id}>
                    <div>
                      <strong>{employee.name}</strong>
                      <p>Projected finish {finish ? new Date(finish).toLocaleString() : '--'}</p>
                    </div>
                    <span className="subtle">
                      {capacity?.overtimeMinutes
                        ? `${capacity.overtimeMinutes} min overtime`
                        : `${capacity?.remainingMinutes ?? employee.defaultAvailableMinutes} min available`}
                    </span>
                  </li>
                ))
              ) : (
                <li>
                  <div>
                    <strong>No worker finish projections</strong>
                    <p>Finish-time projections are not currently available.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>
        </div>
      </section>

      <section className="panel dashboard-intelligence-panel">
        <div className="work-item-section-header">
          <h3>Director Assistant</h3>
          <div className="dashboard-intelligence-controls">
            <label>
              Threshold Profile
              <select
                value={
                  intelligenceConfig.capacityWarningPercentage === 75
                    ? 'AGGRESSIVE'
                    : intelligenceConfig.capacityWarningPercentage === 95
                      ? 'CONSERVATIVE'
                      : 'BALANCED'
                }
                onChange={(event) =>
                  updateThresholdProfile(
                    event.target.value as 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE',
                  )
                }
              >
                <option value="AGGRESSIVE">Aggressive</option>
                <option value="BALANCED">Balanced</option>
                <option value="CONSERVATIVE">Conservative</option>
              </select>
            </label>
            <button type="button" className="btn" onClick={logForecastGenerated}>
              Log Forecast Snapshot
            </button>
            <span className="subtle">
              Generated at {new Date(intelligenceForecast.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="dashboard-intelligence-grid">
          <article className="dashboard-intelligence-block">
            <h4>Operation Intelligence</h4>
            <ul className="plain-list">
              {operationIntelligence.slice(0, 3).map((signal) => (
                <li key={signal.operation}>
                  <div>
                    <strong>{signal.operation}</strong>
                    <p>{signal.recommendation}</p>
                  </div>
                  <span className={`badge ${signal.blocked > 0 ? riskBadgeClass.HIGH : riskBadgeClass.INFO}`}>
                    {signal.queued} queued
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Current Bottleneck</h4>
            {intelligenceFoundation.bottleneck ? (
              <div className="dashboard-director-bottleneck">
                <strong>{intelligenceFoundation.bottleneck.stageLabel}</strong>
                <p>
                  {intelligenceFoundation.bottleneck.queueLength} queued •{' '}
                  {intelligenceFoundation.bottleneck.estimatedWorkloadMinutes} min •{' '}
                  {intelligenceFoundation.bottleneck.blockedItems} blocked
                </p>
                <p className="subtle">
                  Oldest item: {intelligenceFoundation.bottleneck.oldestItem?.orderNumber ?? '--'}
                </p>
              </div>
            ) : (
              <p className="subtle">No active stage queue.</p>
            )}
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Due-Date Risks</h4>
            <ul className="plain-list">
              {deadlineRiskHighlights.length > 0 ? (
                deadlineRiskHighlights.map((risk) => (
                  <li key={risk.workItemId}>
                    <div>
                      <strong>{risk.orderNumber}</strong>
                      <p>
                        {risk.minutesRequired} min required, {risk.availableMinutesBeforeDue} min available, ETA {risk.estimatedCompletionDate}
                      </p>
                      <p className="subtle">{risk.reasons[0]?.description}</p>
                    </div>
                    <span className={`badge ${riskBadgeClass[risk.riskLevel]}`}>{risk.riskLevel}</span>
                  </li>
                ))
              ) : (
                <li><div><strong>No due-date risks</strong><p>No active jobs require due-date intervention.</p></div></li>
              )}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Capacity Warnings</h4>
            <ul className="plain-list">
              {capacityOpportunities.length > 0 ? (
                capacityOpportunities.map((capacity) => (
                  <li key={capacity.employeeId}>
                    <div>
                      <strong>{capacity.employeeName}</strong>
                      <p>
                        {capacity.status === 'OVERLOADED'
                          ? `${Math.abs(capacity.capacityGapMinutes)} min over capacity`
                          : `${Math.abs(capacity.capacityGapMinutes)} min available`}
                      </p>
                      <p className="subtle">{capacity.recommendation ?? 'Balanced allocation'}</p>
                    </div>
                    <span
                      className={`badge ${capacity.status === 'OVERLOADED' ? riskBadgeClass.HIGH : riskBadgeClass.LOW}`}
                    >
                      {capacity.status}
                    </span>
                  </li>
                ))
              ) : (
                <li><div><strong>No capacity warnings</strong><p>Current worker allocation is balanced.</p></div></li>
              )}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Top 3 Recommendations</h4>
            {topRecommendations.length === 0 ? (
              <p className="subtle">No recommendations available above confidence threshold.</p>
            ) : (
              <div className="dashboard-recommendation-list">
                {topRecommendations.map((recommendation) => (
                  <article key={recommendation.id} className="dashboard-recommendation-card">
                    <div className="dashboard-recommendation-head">
                      <strong>{recommendation.title}</strong>
                      <span className={`badge ${riskBadgeClass[recommendation.priority]}`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <p>{recommendation.shortExplanation}</p>
                    <p className="subtle">
                      Reason: {recommendation.reasons[0]?.description ?? 'No supporting reason available.'}
                    </p>
                    <div className="dashboard-recommendation-actions">
                      <button type="button" className="btn" onClick={() => openRecommendationTarget(recommendation)}>
                        {recommendation.actionTarget.kind === 'BATTLE_PLAN' ? 'Open Battle Plan' : 'Open Work Item'}
                      </button>
                      <button type="button" className="btn" onClick={() => dismissRecommendation(recommendation)}>
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={Boolean(reviewedRecommendationIds[recommendation.id])}
                        onClick={() => markRecommendationReviewed(recommendation)}
                      >
                        {reviewedRecommendationIds[recommendation.id] ? 'Reviewed' : 'Mark Reviewed'}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={Boolean(acceptedRecommendationIds[recommendation.id])}
                        onClick={() => acceptRecommendation(recommendation)}
                      >
                        {acceptedRecommendationIds[recommendation.id] ? 'Accepted' : 'Mark Accepted'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
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
