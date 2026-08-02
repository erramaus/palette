import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductionAnalyticsService } from '../services/ProductionAnalyticsService'
import { ProductionForecastService } from '../services/ProductionForecastService'
import { loadProductionAnalyticsTargets } from '../services/productionAnalyticsTargets'
import { loadProductionForecastSettings } from '../services/productionForecastSettings'
import { ProductionIntelligenceService } from '../services/ProductionIntelligenceService'
import { useAppState } from '../state/AppStateContext'
import type { IntelligenceRecommendation, RiskLevel } from '../types/productionIntelligence'
import type { ProductionMetricDefinition } from '../types/productionAnalytics'
import { PRODUCTION_STEP_LABELS, PRODUCTION_STEP_SEQUENCE } from '../utils/productionSteps'

const formatPercent = (value: number): string => `${Math.max(0, Math.min(100, Math.round(value)))}%`

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
  const { productionJobs, threeDFilePreparations, battlePlans, employees, activityLogs, addActivityLog } = useAppState()
  const today = new Date().toISOString().slice(0, 10)
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<Record<string, boolean>>({})
  const [reviewedRecommendationIds, setReviewedRecommendationIds] = useState<Record<string, boolean>>({})
  const [acceptedRecommendationIds, setAcceptedRecommendationIds] = useState<Record<string, boolean>>({})
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

  const workerPlans = useMemo(() => {
    const map = new Map<string, (typeof battlePlans)[number]>()
    battlePlans
      .filter((plan) => plan.date === today)
      .forEach((plan) => map.set(plan.assignedWorkerId, plan))
    return map
  }, [battlePlans, today])

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

  const analyticsService = useMemo(
    () =>
      new ProductionAnalyticsService({
        productionJobs,
        battlePlans,
        employees,
        activityLogs,
        targets: loadProductionAnalyticsTargets(),
      }),
    [productionJobs, battlePlans, employees, activityLogs],
  )

  const productionForecastService = useMemo(
    () =>
      new ProductionForecastService({
        productionJobs,
        threeDFilePreparations,
        battlePlans,
        employees,
        activityLogs,
        config: loadProductionForecastSettings(),
      }),
    [productionJobs, threeDFilePreparations, battlePlans, employees, activityLogs],
  )

  const weeklyAnalytics = useMemo(
    () => analyticsService.getWeeklyAnalytics('PREVIOUS_WEEK'),
    [analyticsService],
  )

  const predictiveForecast = useMemo(
    () => productionForecastService.getForecast(),
    [productionForecastService],
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
  const predictiveSnapshot = predictiveForecast.dashboardSnapshot

  const intelligenceForecast = useMemo(() => intelligenceService.getForecast(), [intelligenceService])
  const topRecommendations = useMemo(
    () =>
      intelligenceForecast.recommendations
        .filter((recommendation) => !dismissedRecommendationIds[recommendation.id])
        .slice(0, 5),
    [intelligenceForecast.recommendations, dismissedRecommendationIds],
  )
  const deadlineRiskHighlights = useMemo(
    () => intelligenceForecast.deadlineRisks.slice(0, 5),
    [intelligenceForecast.deadlineRisks],
  )
  const workerForecastHighlights = useMemo(
    () => intelligenceForecast.workerForecasts.slice(0, 5),
    [intelligenceForecast.workerForecasts],
  )
  const bottleneckHighlights = useMemo(
    () => intelligenceForecast.bottleneckForecasts.slice(0, 4),
    [intelligenceForecast.bottleneckForecasts],
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

  const openRecommendationTarget = (recommendation: IntelligenceRecommendation): void => {
    if (recommendation.actionTarget.kind === 'BATTLE_PLAN') {
      navigate('/battle-plans')
      return
    }

    navigate('/workshop-list')
  }

  const dismissRecommendation = (recommendation: IntelligenceRecommendation): void => {
    setDismissedRecommendationIds((current) => ({
      ...current,
      [recommendation.id]: true,
    }))

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
    setReviewedRecommendationIds((current) => ({
      ...current,
      [recommendation.id]: true,
    }))

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
    setAcceptedRecommendationIds((current) => ({
      ...current,
      [recommendation.id]: true,
    }))

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

      <section className="panel dashboard-predictive-panel">
        <div className="work-item-section-header">
          <h3>Predictive Intelligence</h3>
          <span className="subtle">Generated {new Date(predictiveForecast.generatedAt).toLocaleString()}</span>
        </div>

        <p>
          {predictiveSnapshot.likelyLateJobs.length} job(s) are likely to miss due dates without intervention.
        </p>
        <p>
          {predictiveSnapshot.probableBottleneckTomorrow
            ? `${predictiveSnapshot.probableBottleneckTomorrow.stage} is projected to exceed available capacity by ${Math.max(0, predictiveSnapshot.probableBottleneckTomorrow.predictedActualMinutes - predictiveSnapshot.probableBottleneckTomorrow.availableSkilledCapacityMinutes)} minutes tomorrow.`
            : 'No strong bottleneck projection for tomorrow.'}
        </p>

        <div className="dashboard-predictive-grid">
          <article>
            <h4>Jobs Likely To Become Late</h4>
            <ul className="plain-list">
              {predictiveSnapshot.likelyLateJobs.length > 0 ? (
                predictiveSnapshot.likelyLateJobs.slice(0, 5).map((job) => (
                  <li key={job.workItemId}>
                    <div>
                      <strong>{job.orderNumber}</strong>
                      <p>{job.riskLevel} • Expected {job.expectedDate} • Due {job.dueDate}</p>
                    </div>
                    <span className="subtle">{job.remainingEstimatedMinutes} min</span>
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
              {predictiveSnapshot.likelyCarryForwardOperations.length > 0 ? (
                predictiveSnapshot.likelyCarryForwardOperations.slice(0, 5).map((item) => (
                  <li key={item.taskId}>
                    <div>
                      <strong>{item.orderNumber} • {item.stage}</strong>
                      <p>{item.probabilityBand} probability • {item.recommendedAction}</p>
                    </div>
                    <span className="subtle">{item.likelyCarryForwardMinutes} min</span>
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
            <h4>Workers Projected To Finish Early</h4>
            <ul className="plain-list">
              {predictiveSnapshot.projectedEarlyFinishWorkers.length > 0 ? (
                predictiveSnapshot.projectedEarlyFinishWorkers.slice(0, 5).map((worker) => (
                  <li key={worker.employeeId}>
                    <div>
                      <strong>{worker.employeeName}</strong>
                      <p>Likely finish around {worker.predictedFinishTime}</p>
                    </div>
                    <span className="subtle">{worker.projectedIdleMinutes} min available</span>
                  </li>
                ))
              ) : (
                <li>
                  <div>
                    <strong>No early finish projections</strong>
                    <p>All workers are close to full utilization.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>

          <article>
            <h4>Workers Projected To Exceed Capacity</h4>
            <ul className="plain-list">
              {predictiveSnapshot.projectedOverCapacityWorkers.length > 0 ? (
                predictiveSnapshot.projectedOverCapacityWorkers.slice(0, 5).map((worker) => (
                  <li key={worker.employeeId}>
                    <div>
                      <strong>{worker.employeeName}</strong>
                      <p>Likely carry-forward tasks: {worker.likelyCarryForwardTaskIds.length}</p>
                    </div>
                    <span className="subtle">{worker.projectedOverloadMinutes} min overload</span>
                  </li>
                ))
              ) : (
                <li>
                  <div>
                    <strong>No overload projections</strong>
                    <p>No worker currently projects above available capacity.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>
        </div>

        <article>
          <h4>Forecast Confidence Warnings</h4>
          <ul className="plain-list">
            {predictiveSnapshot.confidenceWarnings.length > 0 ? (
              predictiveSnapshot.confidenceWarnings.slice(0, 6).map((warning) => (
                <li key={warning}>
                  <div>
                    <strong>Data quality notice</strong>
                    <p>{warning}</p>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div>
                  <strong>No confidence warnings</strong>
                  <p>Current forecasts have sufficient baseline depth for configured thresholds.</p>
                </div>
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="panel dashboard-intelligence-panel">
        <div className="work-item-section-header">
          <h3>Production Intelligence</h3>
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
            <h4>Top Recommendations</h4>
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
                      <button
                        type="button"
                        className="btn"
                        onClick={() => openRecommendationTarget(recommendation)}
                      >
                        {recommendation.actionTarget.kind === 'BATTLE_PLAN' ? 'Open Battle Plan' : 'Open Work Item'}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => dismissRecommendation(recommendation)}
                      >
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

          <article className="dashboard-intelligence-block">
            <h4>Deadline Risks</h4>
            <ul className="plain-list">
              {deadlineRiskHighlights.map((risk) => (
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
              ))}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Worker Forecasts</h4>
            <ul className="plain-list">
              {workerForecastHighlights.map((worker) => (
                <li key={worker.employeeId}>
                  <div>
                    <strong>{worker.employeeName}</strong>
                    <p>
                      Utilization {worker.utilizationPercentage}% • Idle {worker.likelyIdleMinutes} • Over {worker.overCapacityMinutes}
                    </p>
                    <p className="subtle">
                      Next operation: {worker.nextRecommendedOperation ?? '--'} • Projected finish: {worker.projectedFinishTime ?? '--'}
                    </p>
                  </div>
                  <span className={`badge ${riskBadgeClass[worker.carryForwardRisk]}`}>{worker.carryForwardRisk}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Bottleneck Forecast</h4>
            <ul className="plain-list">
              {bottleneckHighlights.map((bottleneck) => (
                <li key={bottleneck.stage}>
                  <div>
                    <strong>{PRODUCTION_STEP_LABELS[bottleneck.stage]}</strong>
                    <p>
                      Queue {bottleneck.activeWorkItems} • Load {bottleneck.capacityLoadPercentage}% • Incoming {bottleneck.incomingWorkFromPreviousStage}
                    </p>
                    <p className="subtle">{bottleneck.reasons[0]?.description}</p>
                  </div>
                  <span className={`badge ${riskBadgeClass[bottleneck.riskLevel]}`}>{bottleneck.riskLevel}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-intelligence-block">
            <h4>Capacity Opportunities</h4>
            <ul className="plain-list">
              {capacityOpportunities.map((capacity) => (
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
              ))}
            </ul>
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
