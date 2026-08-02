import type { AppActivityLog } from '../state/AppStateContext'
import type { BattlePlan } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import {
  PRODUCTION_STEP_NAMES,
} from '../types/production'
import {
  type BottleneckForecast,
  type CapacityForecast,
  type DeadlineRisk,
  type EndOfDaySummary,
  type IntelligenceAlert,
  type IntelligenceRecommendation,
  type MorningBrief,
  type ProductionForecast,
  type ProductionIntelligenceConfig,
  type RecommendationConfidence,
  type RecommendationReason,
  type RiskLevel,
  type ShipmentRisk,
  type WorkerForecast,
} from '../types/productionIntelligence'

export interface ProductionIntelligenceInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  activityLogs: AppActivityLog[]
  now?: Date
  config?: Partial<ProductionIntelligenceConfig>
}

const DEFAULT_CONFIG: ProductionIntelligenceConfig = {
  dueSoonDays: 2,
  stageAgeThresholdDays: 2,
  capacityWarningPercentage: 85,
  overloadPercentage: 100,
  carryForwardWarningCount: 2,
  qualityWarningThreshold: 10,
  bottleneckQueueThreshold: 3,
  minimumConfidenceThreshold: 0.5,
}

const RISK_SCORE_BY_LEVEL: Record<RiskLevel, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)

const startOfDay = (value: Date): Date => {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

const parseLocalDate = (value: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(value)
  }

  return new Date(year, month - 1, day)
}

const clampPercent = (value: number): number => Math.max(0, Math.min(999, Math.round(value)))

const formatTimeFromMinutes = (minutesFromMidnight: number): string => {
  const safe = Math.max(0, Math.round(minutesFromMidnight))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHour = ((hours + 11) % 12) + 1
  return `${normalizedHour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

const createReason = (
  code: string,
  description: string,
  value?: number | string | boolean,
  threshold?: number | string,
): RecommendationReason => ({
  code,
  description,
  value,
  threshold,
})

const confidenceFromRatio = (ratio: number): RecommendationConfidence => {
  if (ratio >= 0.8) {
    return 'HIGH'
  }
  if (ratio >= 0.55) {
    return 'MEDIUM'
  }
  return 'LOW'
}

const stageSequence = [...PRODUCTION_STEP_NAMES]

export class ProductionIntelligenceService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly activityLogs: AppActivityLog[]
  private readonly config: ProductionIntelligenceConfig
  private readonly now: Date
  private readonly today: string

  constructor(input: ProductionIntelligenceInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.activityLogs = input.activityLogs
    this.now = input.now ?? new Date()
    this.today = toIsoDate(this.now)
    this.config = {
      ...DEFAULT_CONFIG,
      ...input.config,
    }
  }

  getForecast(): ProductionForecast {
    const deadlineRisks = this.getDeadlineRisks()
    const workerForecasts = this.getWorkerForecasts()
    const bottleneckForecasts = this.getBottleneckForecasts()
    const capacityForecasts = this.getCapacityForecasts(workerForecasts)
    const shipmentRisks = this.getShipmentRisks(deadlineRisks)
    const alerts = this.getDirectorAttentionListInternal(
      deadlineRisks,
      workerForecasts,
      bottleneckForecasts,
      capacityForecasts,
      shipmentRisks,
    )
    const recommendations = this.buildRecommendations(
      deadlineRisks,
      workerForecasts,
      bottleneckForecasts,
      capacityForecasts,
      shipmentRisks,
      alerts,
    )

    return {
      generatedAt: this.now.toISOString(),
      alerts,
      recommendations,
      deadlineRisks,
      workerForecasts,
      bottleneckForecasts,
      capacityForecasts,
      shipmentRisks,
    }
  }

  getMorningBrief(): MorningBrief {
    const forecast = this.getForecast()
    const dueToday = this.activeJobs().filter((job) => job.dueStatus === 'DUE_TODAY').length
    const overdue = this.activeJobs().filter((job) => job.dueStatus === 'OVERDUE').length
    const atRisk = this.activeJobs().filter((job) => job.dueStatus === 'AT_RISK').length
    const blocked = this.getBlockedJobs().length
    const shipmentsToday = this.activeJobs().filter((job) => job.dueDate === this.today).length

    const availableMinutes = forecast.workerForecasts.reduce(
      (sum, worker) => sum + worker.availableMinutesToday,
      0,
    )
    const assignedMinutes = forecast.workerForecasts.reduce(
      (sum, worker) => sum + worker.assignedMinutes,
      0,
    )

    return {
      dueToday,
      overdue,
      atRisk,
      blocked,
      shipmentsToday,
      workerCapacity: {
        availableMinutes,
        assignedMinutes,
        utilizationPercentage:
          availableMinutes > 0 ? clampPercent((assignedMinutes / availableMinutes) * 100) : 0,
      },
      likelyBottleneck: this.sortBottlenecks(forecast.bottleneckForecasts)[0],
      topRecommendations: this.sortRecommendations(forecast.recommendations).slice(0, 5),
    }
  }

  getDirectorAttentionList(): IntelligenceAlert[] {
    const forecast = this.getForecast()
    return this.sortAlerts(forecast.alerts)
  }

  getDeadlineRisks(): DeadlineRisk[] {
    const workersById = new Map(this.employees.map((employee) => [employee.id, employee]))
    const planByWorker = this.getTodayPlanByWorker()

    return this.activeJobs().map((job) => {
      const remainingStages = this.getRemainingStages(job)
      const minutesRequired = remainingStages.reduce((sum, stage) => sum + job.estimatedMinutes[stage], 0)
      const assignedWorker = workersById.get(job.assignedWorkerId)
      const skillCoverageRatio =
        remainingStages.length > 0 && assignedWorker
          ? remainingStages.filter((stage) => assignedWorker.skills.includes(stage)).length /
            remainingStages.length
          : 0

      const carryForwardCount = this.countCarryForwardForJob(job.id)
      const reworkCount = this.countReworkForJob(job.id)
      const blocked = this.isBlocked(job)

      const missingInputs: string[] = []
      if (!assignedWorker) {
        missingInputs.push('Assigned employee record')
      }
      if (this.missingStageAgeData()) {
        missingInputs.push('Current stage age timestamp')
      }
      missingInputs.push('Required approvals by work item stage')
      missingInputs.push('Department capacity by workflow stage')

      const confidenceInputsAvailable =
        1 +
        (assignedWorker ? 1 : 0) +
        (remainingStages.length > 0 ? 1 : 0) +
        (carryForwardCount > 0 ? 1 : 0) +
        (reworkCount > 0 ? 1 : 0)
      const confidence = confidenceFromRatio(confidenceInputsAvailable / 6)

      const availableMinutesBeforeDue = this.estimateAvailableMinutesBeforeDue({
        dueDate: job.dueDate,
        remainingStages,
        assignedWorker,
        planForWorker: planByWorker.get(job.assignedWorkerId),
      })

      const projectedCompletionDate = this.estimateCompletionDate(
        minutesRequired,
        assignedWorker?.defaultAvailableMinutes ?? this.averageWorkerCapacity(),
      )

      const shortage = minutesRequired - availableMinutesBeforeDue
      const reasons: RecommendationReason[] = [
        createReason('REMAINING_MINUTES', `${minutesRequired} minutes remaining`, minutesRequired),
        createReason(
          'AVAILABLE_MINUTES',
          `${availableMinutesBeforeDue} minutes available before due date`,
          availableMinutesBeforeDue,
        ),
      ]

      if (blocked) {
        reasons.push(createReason('BLOCKED', `Work is blocked at ${remainingStages[0] ?? 'current stage'}`, true))
      }

      if (carryForwardCount > 0) {
        reasons.push(
          createReason(
            'CARRY_FORWARD_HISTORY',
            `Carried forward ${carryForwardCount} time(s)`,
            carryForwardCount,
            this.config.carryForwardWarningCount,
          ),
        )
      }

      if (reworkCount > 0) {
        reasons.push(createReason('REWORK_HISTORY', `Rework events: ${reworkCount}`, reworkCount))
      }

      if (skillCoverageRatio < 1) {
        reasons.push(
          createReason(
            'SKILL_GAP',
            `Assigned worker skill coverage ${Math.round(skillCoverageRatio * 100)}%`,
            Math.round(skillCoverageRatio * 100),
            100,
          ),
        )
      }

      const dueDate = parseLocalDate(job.dueDate)
      const daysUntilDue = Math.round(
        (startOfDay(dueDate).getTime() - startOfDay(this.now).getTime()) / (24 * 60 * 60 * 1000),
      )

      const riskLevel = this.calculateDeadlineRiskLevel({
        job,
        shortage,
        blocked,
        daysUntilDue,
        carryForwardCount,
        reworkCount,
      })

      const recommendedAction = this.buildDeadlineRecommendation(job, riskLevel, shortage, blocked)

      return {
        workItemId: job.id,
        orderNumber: job.orderNumber,
        riskLevel,
        estimatedCompletionDate: projectedCompletionDate,
        minutesRequired,
        availableMinutesBeforeDue,
        reasons,
        recommendedAction,
        confidence,
        missingInputs,
      }
    })
  }

  getWorkerForecasts(): WorkerForecast[] {
    const planByWorker = this.getTodayPlanByWorker()
    const carryForwardCountsByWorker = this.getCarryForwardCountsByWorker()

    return this.employees
      .filter((employee) => employee.role === 'WORKER' && employee.active)
      .map((employee) => {
        const plan = planByWorker.get(employee.id)
        const tasks = [...(plan?.tasks ?? [])].sort((left, right) => left.sortOrder - right.sortOrder)
        const assignedMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
        const completedMinutes = tasks
          .filter((task) => task.completed)
          .reduce((sum, task) => sum + task.estimatedMinutes, 0)
        const remainingMinutes = Math.max(0, assignedMinutes - completedMinutes)
        const availableMinutesToday = plan?.availableMinutes ?? employee.defaultAvailableMinutes
        const utilizationPercentage =
          availableMinutesToday > 0 ? (assignedMinutes / availableMinutesToday) * 100 : 0
        const likelyIdleMinutes = Math.max(0, availableMinutesToday - assignedMinutes)
        const overCapacityMinutes = Math.max(0, assignedMinutes - availableMinutesToday)
        const carryForwardCount = carryForwardCountsByWorker.get(employee.id) ?? 0

        const nextTask = tasks.find((task) => !task.completed)
        const projectedFinishTime =
          assignedMinutes > 0
            ? formatTimeFromMinutes(8 * 60 + Math.min(availableMinutesToday, assignedMinutes))
            : undefined

        const reasons: RecommendationReason[] = [
          createReason('AVAILABLE_MINUTES', 'Available minutes today', availableMinutesToday),
          createReason('ASSIGNED_MINUTES', 'Assigned minutes today', assignedMinutes),
          createReason('COMPLETED_MINUTES', 'Completed minutes today', completedMinutes),
        ]

        if (overCapacityMinutes > 0) {
          reasons.push(
            createReason(
              'OVER_CAPACITY',
              `${overCapacityMinutes} minutes over capacity`,
              overCapacityMinutes,
              0,
            ),
          )
        }

        if (likelyIdleMinutes > 0) {
          reasons.push(
            createReason(
              'IDLE_CAPACITY',
              `${likelyIdleMinutes} minutes likely idle`,
              likelyIdleMinutes,
              0,
            ),
          )
        }

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          availableMinutesToday,
          assignedMinutes,
          completedMinutes,
          remainingMinutes,
          utilizationPercentage: clampPercent(utilizationPercentage),
          projectedFinishTime,
          likelyIdleMinutes,
          overCapacityMinutes,
          carryForwardRisk:
            carryForwardCount >= this.config.carryForwardWarningCount ? 'MEDIUM' : 'LOW',
          nextRecommendedOperation: nextTask?.productionStep,
          reasons,
        }
      })
  }

  getBottleneckForecasts(): BottleneckForecast[] {
    const workers = this.employees.filter((employee) => employee.role === 'WORKER' && employee.active)

    return stageSequence.map((stage, index) => {
      const activeJobs = this.activeJobs().filter((job) => this.getCurrentWaitingStage(job) === stage)
      const estimatedMinutesWaiting = activeJobs.reduce((sum, job) => sum + job.estimatedMinutes[stage], 0)
      const availableSkilledMinutes = workers
        .filter((employee) => employee.skills.includes(stage))
        .reduce((sum, employee) => sum + employee.defaultAvailableMinutes, 0)

      const oldestJobAgeDays = activeJobs.length > 0
        ? Math.max(
            ...activeJobs.map((job) => {
              const daysUntilDue = Math.round(
                (startOfDay(parseLocalDate(job.dueDate)).getTime() - startOfDay(this.now).getTime()) /
                  (24 * 60 * 60 * 1000),
              )
              return Math.max(0, -daysUntilDue)
            }),
          )
        : undefined

      const previousStage = index > 0 ? stageSequence[index - 1] : undefined
      const incomingWorkFromPreviousStage = previousStage
        ? this.activeJobs().filter((job) => this.getCurrentWaitingStage(job) === previousStage).length
        : 0

      const capacityLoadPercentage =
        availableSkilledMinutes > 0
          ? clampPercent((estimatedMinutesWaiting / availableSkilledMinutes) * 100)
          : estimatedMinutesWaiting > 0
            ? 999
            : 0

      const projectedQueueGrowth = incomingWorkFromPreviousStage - activeJobs.length

      const reasons: RecommendationReason[] = [
        createReason('QUEUE_SIZE', `Queue size ${activeJobs.length}`, activeJobs.length),
        createReason(
          'CAPACITY_LOAD',
          `Capacity load ${capacityLoadPercentage}%`,
          capacityLoadPercentage,
          this.config.capacityWarningPercentage,
        ),
      ]

      if (oldestJobAgeDays !== undefined) {
        reasons.push(
          createReason(
            'OLDEST_ITEM_AGE',
            `Oldest work age ${oldestJobAgeDays} day(s)`,
            oldestJobAgeDays,
            this.config.stageAgeThresholdDays,
          ),
        )
      }

      const riskLevel = this.calculateBottleneckRiskLevel({
        activeCount: activeJobs.length,
        capacityLoadPercentage,
        oldestJobAgeDays,
        projectedQueueGrowth,
      })

      return {
        stage,
        activeWorkItems: activeJobs.length,
        estimatedMinutesWaiting,
        availableSkilledMinutes,
        oldestWorkItemAgeDays: oldestJobAgeDays,
        incomingWorkFromPreviousStage,
        capacityLoadPercentage,
        projectedQueueGrowth,
        riskLevel,
        reasons,
      }
    })
  }

  getCapacityForecasts(workerForecastsInput?: WorkerForecast[]): CapacityForecast[] {
    const workerForecasts = workerForecastsInput ?? this.getWorkerForecasts()

    return workerForecasts.map((worker) => {
      const capacityGapMinutes = worker.availableMinutesToday - worker.assignedMinutes
      const status: CapacityForecast['status'] =
        worker.utilizationPercentage > this.config.overloadPercentage
          ? 'OVERLOADED'
          : worker.utilizationPercentage < this.config.capacityWarningPercentage
            ? 'AVAILABLE'
            : 'BALANCED'

      const reasons: RecommendationReason[] = [
        createReason('UTILIZATION', `Utilization ${worker.utilizationPercentage}%`, worker.utilizationPercentage),
        createReason('CAPACITY_GAP', `Capacity gap ${capacityGapMinutes} minutes`, capacityGapMinutes),
      ]

      let recommendation: string | undefined
      if (status === 'OVERLOADED') {
        recommendation = `Reduce ${worker.employeeName}'s assigned minutes by ${Math.abs(capacityGapMinutes)}.`
      } else if (status === 'AVAILABLE') {
        recommendation = `Add ${Math.abs(capacityGapMinutes)} minutes of ready work to ${worker.employeeName}.`
      }

      return {
        employeeId: worker.employeeId,
        employeeName: worker.employeeName,
        availableMinutes: worker.availableMinutesToday,
        assignedMinutes: worker.assignedMinutes,
        completedMinutes: worker.completedMinutes,
        remainingMinutes: worker.remainingMinutes,
        utilizationPercentage: worker.utilizationPercentage,
        capacityGapMinutes,
        status,
        recommendation,
        reasons,
      }
    })
  }

  getCapacityRecommendations(): IntelligenceRecommendation[] {
    const forecast = this.getForecast()
    return this.sortRecommendations(
      forecast.recommendations.filter((recommendation) =>
        recommendation.reasons.some((reason) => reason.code === 'CAPACITY_GAP'),
      ),
    )
  }

  getShipmentRisks(deadlineRisksInput?: DeadlineRisk[]): ShipmentRisk[] {
    const deadlineRisks = deadlineRisksInput ?? this.getDeadlineRisks()
    const risksByWorkItem = new Map(deadlineRisks.map((risk) => [risk.workItemId, risk]))

    return this.activeJobs()
      .filter((job) => job.dueDate === this.today || job.dueStatus === 'DUE_TODAY' || job.dueStatus === 'OVERDUE')
      .map((job) => {
        const risk = risksByWorkItem.get(job.id)
        const remainingShippingMinutes =
          job.steps.SHIPPED === 'COMPLETE' || job.steps.SHIPPED === 'NOT_APPLICABLE'
            ? 0
            : job.estimatedMinutes.SHIPPED
        const availableMinutesBeforeDue = risk?.availableMinutesBeforeDue ?? 0

        const reasons: RecommendationReason[] = [
          createReason('DUE_DATE', `Due date ${job.dueDate}`, job.dueDate),
          createReason('SHIPPING_MINUTES', `Shipping minutes remaining ${remainingShippingMinutes}`, remainingShippingMinutes),
        ]

        if (job.steps.SHIPPED !== 'COMPLETE' && job.dueStatus !== 'ON_TRACK') {
          reasons.push(createReason('SHIPMENT_NOT_READY', 'Shipment not complete for near-term due date', true))
        }

        const riskLevel: RiskLevel =
          remainingShippingMinutes === 0
            ? 'INFO'
            : job.dueStatus === 'OVERDUE'
              ? 'CRITICAL'
              : job.dueStatus === 'DUE_TODAY'
                ? 'HIGH'
                : 'MEDIUM'

        return {
          workItemId: job.id,
          orderNumber: job.orderNumber,
          dueDate: job.dueDate,
          remainingShippingMinutes,
          availableMinutesBeforeDue,
          riskLevel,
          reasons,
        }
      })
      .filter((risk) => risk.riskLevel !== 'INFO')
  }

  getTopRecommendations(limit = 5): IntelligenceRecommendation[] {
    const forecast = this.getForecast()
    return this.sortRecommendations(forecast.recommendations).slice(0, limit)
  }

  getEndOfDaySummary(): EndOfDaySummary {
    const todayPlans = this.battlePlans.filter((plan) => plan.date === this.today)
    const allTasks = todayPlans.flatMap((plan) => plan.tasks)
    const completedTasks = allTasks.filter((task) => task.completed)
    const carryForwardTasks = allTasks.filter((task) => task.carryForward && !task.completed)

    const completedWorkItems = new Set(completedTasks.map((task) => task.productionJobId)).size
    const completedStandardMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    const plannedMinutes = allTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    const completedMinutes = completedStandardMinutes

    const newOverdueItems = this.activeJobs().filter((job) => job.dueStatus === 'OVERDUE').length
    const blockedItems = this.getBlockedJobs().length
    const qualityIssues = allTasks.filter((task) => task.completed && task.carryForward).length

    const tomorrow = new Date(this.now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = toIsoDate(tomorrow)

    const topRisksTomorrow = this.getDeadlineRisks()
      .filter((risk) => {
        const job = this.productionJobs.find((candidate) => candidate.id === risk.workItemId)
        return job ? parseLocalDate(job.dueDate) <= parseLocalDate(tomorrowDate) : false
      })
      .sort((left, right) => RISK_SCORE_BY_LEVEL[right.riskLevel] - RISK_SCORE_BY_LEVEL[left.riskLevel])
      .slice(0, 5)

    return {
      completedWorkItems,
      completedStandardMinutes,
      plannedMinutes,
      completedMinutes,
      carryForwardWorkItems: new Set(carryForwardTasks.map((task) => task.productionJobId)).size,
      newOverdueItems,
      blockedItems,
      qualityIssues,
      topRisksTomorrow,
    }
  }

  private buildRecommendations(
    deadlineRisks: DeadlineRisk[],
    workerForecasts: WorkerForecast[],
    bottleneckForecasts: BottleneckForecast[],
    _capacityForecasts: CapacityForecast[],
    shipmentRisks: ShipmentRisk[],
    alerts: IntelligenceAlert[],
  ): IntelligenceRecommendation[] {
    const recommendations: IntelligenceRecommendation[] = []

    for (const risk of deadlineRisks) {
      if (RISK_SCORE_BY_LEVEL[risk.riskLevel] < RISK_SCORE_BY_LEVEL.MEDIUM) {
        continue
      }

      recommendations.push({
        id: `REC-DEADLINE-${risk.workItemId}`,
        title: `Protect due date for ${risk.orderNumber}`,
        shortExplanation: risk.recommendedAction,
        supportingData: {
          minutesRequired: risk.minutesRequired,
          availableMinutesBeforeDue: risk.availableMinutesBeforeDue,
          estimatedCompletionDate: risk.estimatedCompletionDate,
        },
        affectedWorkItemIds: [risk.workItemId],
        affectedEmployeeIds: [],
        priority: risk.riskLevel,
        suggestedAction: risk.recommendedAction,
        generatedAt: this.now.toISOString(),
        confidence: risk.confidence,
        reasons: risk.reasons,
        sourceAlertIds: [`ALERT-DEADLINE-${risk.workItemId}`],
        actionTarget: {
          kind: 'WORK_ITEM',
          id: risk.workItemId,
        },
      })
    }

    for (const worker of workerForecasts) {
      if (worker.overCapacityMinutes > 0) {
        recommendations.push({
          id: `REC-OVERLOAD-${worker.employeeId}`,
          title: `Reduce overload for ${worker.employeeName}`,
          shortExplanation: `${worker.employeeName} is over capacity by ${worker.overCapacityMinutes} minutes.`,
          supportingData: {
            utilizationPercentage: worker.utilizationPercentage,
            overCapacityMinutes: worker.overCapacityMinutes,
          },
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          priority: worker.overCapacityMinutes > 90 ? 'HIGH' : 'MEDIUM',
          suggestedAction: `Split or reassign ${worker.overCapacityMinutes} minutes from ${worker.employeeName}'s battle plan.`,
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          reasons: [
            createReason('CAPACITY_GAP', `${worker.overCapacityMinutes} minutes over capacity`, worker.overCapacityMinutes),
          ],
          sourceAlertIds: [`ALERT-CAPACITY-OVERLOAD-${worker.employeeId}`],
          actionTarget: {
            kind: 'BATTLE_PLAN',
            id: worker.employeeId,
          },
        })
      }

      if (worker.likelyIdleMinutes > 0) {
        recommendations.push({
          id: `REC-IDLE-${worker.employeeId}`,
          title: `Fill available capacity for ${worker.employeeName}`,
          shortExplanation: `${worker.employeeName} has ${worker.likelyIdleMinutes} unassigned minutes.`,
          supportingData: {
            likelyIdleMinutes: worker.likelyIdleMinutes,
            utilizationPercentage: worker.utilizationPercentage,
          },
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          priority: worker.likelyIdleMinutes > 90 ? 'MEDIUM' : 'LOW',
          suggestedAction: `Add ready operations to ${worker.employeeName}'s battle plan.`,
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          reasons: [
            createReason('CAPACITY_GAP', `${worker.likelyIdleMinutes} minutes available`, worker.likelyIdleMinutes),
          ],
          sourceAlertIds: [`ALERT-CAPACITY-AVAILABLE-${worker.employeeId}`],
          actionTarget: {
            kind: 'BATTLE_PLAN',
            id: worker.employeeId,
          },
        })
      }
    }

    for (const bottleneck of bottleneckForecasts) {
      if (RISK_SCORE_BY_LEVEL[bottleneck.riskLevel] < RISK_SCORE_BY_LEVEL.HIGH) {
        continue
      }

      recommendations.push({
        id: `REC-BOTTLENECK-${bottleneck.stage}`,
        title: `Stabilize ${bottleneck.stage} queue`,
        shortExplanation: `${bottleneck.stage} queue load is ${bottleneck.capacityLoadPercentage}% with ${bottleneck.activeWorkItems} active items.`,
        supportingData: {
          capacityLoadPercentage: bottleneck.capacityLoadPercentage,
          activeWorkItems: bottleneck.activeWorkItems,
          projectedQueueGrowth: bottleneck.projectedQueueGrowth,
        },
        affectedWorkItemIds: [],
        affectedEmployeeIds: this.employees
          .filter((employee) => employee.skills.includes(bottleneck.stage))
          .map((employee) => employee.id),
        priority: bottleneck.riskLevel,
        suggestedAction: `Prioritize ${bottleneck.stage} operations before downstream stages and rebalance worker assignments.`,
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        reasons: bottleneck.reasons,
        sourceAlertIds: [`ALERT-BOTTLENECK-${bottleneck.stage}`],
        actionTarget: {
          kind: 'BATTLE_PLAN',
        },
      })
    }

    for (const shipmentRisk of shipmentRisks) {
      recommendations.push({
        id: `REC-SHIP-${shipmentRisk.workItemId}`,
        title: `Protect shipment for ${shipmentRisk.orderNumber}`,
        shortExplanation: `Shipment readiness risk is ${shipmentRisk.riskLevel} for due date ${shipmentRisk.dueDate}.`,
        supportingData: {
          dueDate: shipmentRisk.dueDate,
          remainingShippingMinutes: shipmentRisk.remainingShippingMinutes,
          availableMinutesBeforeDue: shipmentRisk.availableMinutesBeforeDue,
        },
        affectedWorkItemIds: [shipmentRisk.workItemId],
        affectedEmployeeIds: [],
        priority: shipmentRisk.riskLevel,
        suggestedAction: `Move shipping steps for ${shipmentRisk.orderNumber} into today's highest priority queue.`,
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        reasons: shipmentRisk.reasons,
        sourceAlertIds: [`ALERT-SHIPMENT-${shipmentRisk.workItemId}`],
        actionTarget: {
          kind: 'WORK_ITEM',
          id: shipmentRisk.workItemId,
        },
      })
    }

    const alertDrivenRecommendation = alerts.find((alert) => alert.type === 'UNASSIGNED_WORK')
    if (alertDrivenRecommendation) {
      recommendations.push({
        id: 'REC-UNASSIGNED-WORK',
        title: 'Assign unassigned production work',
        shortExplanation: alertDrivenRecommendation.explanation,
        supportingData: alertDrivenRecommendation.supportingData,
        affectedWorkItemIds: alertDrivenRecommendation.affectedWorkItemIds,
        affectedEmployeeIds: alertDrivenRecommendation.affectedEmployeeIds,
        priority: alertDrivenRecommendation.riskLevel,
        suggestedAction: 'Assign each unassigned work item to a worker with matching stage skills and available minutes.',
        generatedAt: this.now.toISOString(),
        confidence: alertDrivenRecommendation.confidence,
        reasons: alertDrivenRecommendation.reasons,
        sourceAlertIds: [alertDrivenRecommendation.id],
        actionTarget: {
          kind: 'WORK_ITEM',
          id: alertDrivenRecommendation.affectedWorkItemIds[0],
        },
      })
    }

    return this.sortRecommendations(recommendations)
  }

  private getDirectorAttentionListInternal(
    deadlineRisks: DeadlineRisk[],
    workerForecasts: WorkerForecast[],
    bottleneckForecasts: BottleneckForecast[],
    capacityForecasts: CapacityForecast[],
    shipmentRisks: ShipmentRisk[],
  ): IntelligenceAlert[] {
    const alerts: IntelligenceAlert[] = []

    for (const risk of deadlineRisks) {
      const dueType = this.productionJobs.find((job) => job.id === risk.workItemId)?.dueStatus
      alerts.push({
        id: `ALERT-DEADLINE-${risk.workItemId}`,
        type: 'DEADLINE_RISK',
        riskLevel: risk.riskLevel,
        title: `${risk.orderNumber} deadline risk`,
        explanation: risk.recommendedAction,
        reasons: risk.reasons,
        affectedWorkItemIds: [risk.workItemId],
        affectedEmployeeIds: [],
        supportingData: {
          minutesRequired: risk.minutesRequired,
          availableMinutesBeforeDue: risk.availableMinutesBeforeDue,
          dueStatus: dueType ?? null,
        },
        generatedAt: this.now.toISOString(),
        confidence: risk.confidence,
        missingInputs: risk.missingInputs,
      })

      if (dueType === 'OVERDUE') {
        alerts.push({
          id: `ALERT-OVERDUE-${risk.workItemId}`,
          type: 'OVERDUE',
          riskLevel: 'CRITICAL',
          title: `${risk.orderNumber} is overdue`,
          explanation: 'Due date has already passed and work remains.',
          reasons: [createReason('DUE_STATUS', 'Due status is OVERDUE', 'OVERDUE')],
          affectedWorkItemIds: [risk.workItemId],
          affectedEmployeeIds: [],
          supportingData: { dueDate: this.productionJobs.find((job) => job.id === risk.workItemId)?.dueDate ?? null },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (dueType === 'DUE_TODAY') {
        alerts.push({
          id: `ALERT-DUE-TODAY-${risk.workItemId}`,
          type: 'DUE_TODAY',
          riskLevel: 'HIGH',
          title: `${risk.orderNumber} due today`,
          explanation: 'Work item due today requires immediate monitoring.',
          reasons: [createReason('DUE_STATUS', 'Due status is DUE_TODAY', 'DUE_TODAY')],
          affectedWorkItemIds: [risk.workItemId],
          affectedEmployeeIds: [],
          supportingData: { dueDate: this.productionJobs.find((job) => job.id === risk.workItemId)?.dueDate ?? null },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (dueType === 'DUE_SOON') {
        alerts.push({
          id: `ALERT-DUE-SOON-${risk.workItemId}`,
          type: 'DUE_SOON',
          riskLevel: 'MEDIUM',
          title: `${risk.orderNumber} due soon`,
          explanation: `Due date is within ${this.config.dueSoonDays} day(s).`,
          reasons: [createReason('DUE_STATUS', 'Due status is DUE_SOON', 'DUE_SOON')],
          affectedWorkItemIds: [risk.workItemId],
          affectedEmployeeIds: [],
          supportingData: { dueDate: this.productionJobs.find((job) => job.id === risk.workItemId)?.dueDate ?? null },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (risk.missingInputs.length > 0) {
        alerts.push({
          id: `ALERT-MISSING-DEPENDENCY-${risk.workItemId}`,
          type: 'MISSING_DEPENDENCY',
          riskLevel: 'LOW',
          title: `${risk.orderNumber} forecast missing inputs`,
          explanation: `Forecast confidence reduced by missing data: ${risk.missingInputs.join(', ')}.`,
          reasons: risk.missingInputs.map((input) => createReason('MISSING_INPUT', input)),
          affectedWorkItemIds: [risk.workItemId],
          affectedEmployeeIds: [],
          supportingData: {
            missingInputCount: risk.missingInputs.length,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: risk.missingInputs,
        })
      }
    }

    for (const worker of workerForecasts) {
      if (worker.overCapacityMinutes > 0) {
        alerts.push({
          id: `ALERT-CAPACITY-OVERLOAD-${worker.employeeId}`,
          type: 'CAPACITY_OVERLOAD',
          riskLevel: worker.overCapacityMinutes > 120 ? 'HIGH' : 'MEDIUM',
          title: `${worker.employeeName} is over capacity`,
          explanation: `${worker.employeeName} is over capacity by ${worker.overCapacityMinutes} minutes.`,
          reasons: worker.reasons,
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          supportingData: {
            overCapacityMinutes: worker.overCapacityMinutes,
            utilizationPercentage: worker.utilizationPercentage,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (worker.likelyIdleMinutes > 0) {
        alerts.push({
          id: `ALERT-CAPACITY-AVAILABLE-${worker.employeeId}`,
          type: 'CAPACITY_AVAILABLE',
          riskLevel: 'INFO',
          title: `${worker.employeeName} has available capacity`,
          explanation: `${worker.likelyIdleMinutes} minutes are currently unassigned.`,
          reasons: worker.reasons,
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          supportingData: {
            likelyIdleMinutes: worker.likelyIdleMinutes,
            utilizationPercentage: worker.utilizationPercentage,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (worker.assignedMinutes === 0) {
        alerts.push({
          id: `ALERT-IDLE-WORKER-${worker.employeeId}`,
          type: 'IDLE_WORKER',
          riskLevel: 'LOW',
          title: `${worker.employeeName} is idle`,
          explanation: `${worker.employeeName} has no assigned work today.`,
          reasons: [createReason('ASSIGNED_MINUTES', 'Assigned minutes are zero', 0)],
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          supportingData: {
            availableMinutes: worker.availableMinutesToday,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (worker.carryForwardRisk !== 'LOW') {
        alerts.push({
          id: `ALERT-CARRY-FORWARD-${worker.employeeId}`,
          type: 'CARRY_FORWARD_RISK',
          riskLevel: worker.carryForwardRisk,
          title: `${worker.employeeName} carry-forward risk`,
          explanation: 'Repeated carry-forward work indicates delivery risk.',
          reasons: [createReason('CARRY_FORWARD_HISTORY', 'Carry-forward threshold exceeded')],
          affectedWorkItemIds: [],
          affectedEmployeeIds: [worker.employeeId],
          supportingData: {
            carryForwardRisk: worker.carryForwardRisk,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'MEDIUM',
          missingInputs: [],
        })
      }
    }

    for (const stage of bottleneckForecasts) {
      if (RISK_SCORE_BY_LEVEL[stage.riskLevel] < RISK_SCORE_BY_LEVEL.HIGH) {
        continue
      }

      alerts.push({
        id: `ALERT-BOTTLENECK-${stage.stage}`,
        type: 'BOTTLENECK_RISK',
        riskLevel: stage.riskLevel,
        title: `${stage.stage} bottleneck risk`,
        explanation: `${stage.activeWorkItems} items in queue and load at ${stage.capacityLoadPercentage}%.`,
        reasons: stage.reasons,
        affectedWorkItemIds: this.activeJobs()
          .filter((job) => this.getCurrentWaitingStage(job) === stage.stage)
          .map((job) => job.id),
        affectedEmployeeIds: this.employees
          .filter((employee) => employee.skills.includes(stage.stage))
          .map((employee) => employee.id),
        supportingData: {
          activeWorkItems: stage.activeWorkItems,
          capacityLoadPercentage: stage.capacityLoadPercentage,
          projectedQueueGrowth: stage.projectedQueueGrowth,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        missingInputs: this.missingStageAgeData() ? ['Stage start timestamps'] : [],
      })
    }

    for (const forecast of capacityForecasts) {
      if (forecast.status === 'OVERLOADED') {
        alerts.push({
          id: `ALERT-CAP-OVER-${forecast.employeeId}`,
          type: 'CAPACITY_OVERLOAD',
          riskLevel: forecast.utilizationPercentage > 130 ? 'HIGH' : 'MEDIUM',
          title: `${forecast.employeeName} overloaded`,
          explanation: `${forecast.employeeName} utilization is ${forecast.utilizationPercentage}%.`,
          reasons: forecast.reasons,
          affectedWorkItemIds: [],
          affectedEmployeeIds: [forecast.employeeId],
          supportingData: {
            utilizationPercentage: forecast.utilizationPercentage,
            capacityGapMinutes: forecast.capacityGapMinutes,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }

      if (forecast.status === 'AVAILABLE') {
        alerts.push({
          id: `ALERT-CAP-AVAIL-${forecast.employeeId}`,
          type: 'CAPACITY_AVAILABLE',
          riskLevel: 'INFO',
          title: `${forecast.employeeName} available capacity`,
          explanation: `${Math.abs(forecast.capacityGapMinutes)} minutes can be filled.`,
          reasons: forecast.reasons,
          affectedWorkItemIds: [],
          affectedEmployeeIds: [forecast.employeeId],
          supportingData: {
            capacityGapMinutes: forecast.capacityGapMinutes,
          },
          generatedAt: this.now.toISOString(),
          confidence: 'HIGH',
          missingInputs: [],
        })
      }
    }

    for (const shipmentRisk of shipmentRisks) {
      alerts.push({
        id: `ALERT-SHIPMENT-${shipmentRisk.workItemId}`,
        type: 'SHIPMENT_RISK',
        riskLevel: shipmentRisk.riskLevel,
        title: `${shipmentRisk.orderNumber} shipment risk`,
        explanation: `Shipment due ${shipmentRisk.dueDate} with ${shipmentRisk.remainingShippingMinutes} minutes remaining.`,
        reasons: shipmentRisk.reasons,
        affectedWorkItemIds: [shipmentRisk.workItemId],
        affectedEmployeeIds: [],
        supportingData: {
          dueDate: shipmentRisk.dueDate,
          remainingShippingMinutes: shipmentRisk.remainingShippingMinutes,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        missingInputs: [],
      })
    }

    const blockedJobs = this.getBlockedJobs()
    if (blockedJobs.length > 0) {
      alerts.push({
        id: 'ALERT-BLOCKED-WORK',
        type: 'BLOCKED_WORK',
        riskLevel: blockedJobs.length >= 2 ? 'HIGH' : 'MEDIUM',
        title: 'Blocked work detected',
        explanation: `${blockedJobs.length} active work item(s) are blocked or on hold.`,
        reasons: [createReason('BLOCKED_COUNT', 'Blocked work item count', blockedJobs.length)],
        affectedWorkItemIds: blockedJobs.map((job) => job.id),
        affectedEmployeeIds: [],
        supportingData: {
          blockedCount: blockedJobs.length,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'HIGH',
        missingInputs: [],
      })
    }

    const materialJobs = this.activeJobs().filter((job) => /material|crate/i.test(job.notes))
    if (materialJobs.length > 0) {
      alerts.push({
        id: 'ALERT-MATERIAL-RISK',
        type: 'MATERIAL_RISK',
        riskLevel: 'MEDIUM',
        title: 'Material dependency risk',
        explanation: `${materialJobs.length} job(s) mention material or crate dependencies.`,
        reasons: [createReason('MATERIAL_SIGNAL', 'Material-dependent note detected', materialJobs.length)],
        affectedWorkItemIds: materialJobs.map((job) => job.id),
        affectedEmployeeIds: [],
        supportingData: {
          jobCount: materialJobs.length,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        missingInputs: ['Inventory reservation status by work item'],
      })
    }

    const qualityRiskTasks = this.battlePlans
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.completed && task.carryForward)
    if (qualityRiskTasks.length >= this.config.qualityWarningThreshold) {
      alerts.push({
        id: 'ALERT-QUALITY-RISK',
        type: 'QUALITY_RISK',
        riskLevel: 'MEDIUM',
        title: 'Quality rework trend detected',
        explanation: `${qualityRiskTasks.length} completed task(s) marked as carry-forward/rework.`,
        reasons: [
          createReason(
            'QUALITY_CARRY_FORWARD',
            'Carry-forward completed tasks exceed threshold',
            qualityRiskTasks.length,
            this.config.qualityWarningThreshold,
          ),
        ],
        affectedWorkItemIds: qualityRiskTasks.map((task) => task.productionJobId),
        affectedEmployeeIds: [],
        supportingData: {
          qualityRiskTaskCount: qualityRiskTasks.length,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'MEDIUM',
        missingInputs: ['Explicit quality defect logs'],
      })
    }

    const unassignedJobs = this.activeJobs().filter((job) => !job.assignedWorkerId)
    if (unassignedJobs.length > 0) {
      alerts.push({
        id: 'ALERT-UNASSIGNED-WORK',
        type: 'UNASSIGNED_WORK',
        riskLevel: 'HIGH',
        title: 'Unassigned active work',
        explanation: `${unassignedJobs.length} active work item(s) are unassigned.`,
        reasons: [createReason('UNASSIGNED_COUNT', 'Unassigned active work items', unassignedJobs.length)],
        affectedWorkItemIds: unassignedJobs.map((job) => job.id),
        affectedEmployeeIds: [],
        supportingData: {
          unassignedCount: unassignedJobs.length,
        },
        generatedAt: this.now.toISOString(),
        confidence: 'HIGH',
        missingInputs: [],
      })
    }

    return this.sortAlerts(alerts).filter((alert) => this.passesConfidence(alert.confidence))
  }

  private sortAlerts(alerts: IntelligenceAlert[]): IntelligenceAlert[] {
    return [...alerts].sort((left, right) => {
      const scoreDelta = RISK_SCORE_BY_LEVEL[right.riskLevel] - RISK_SCORE_BY_LEVEL[left.riskLevel]
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      return left.title.localeCompare(right.title)
    })
  }

  private sortRecommendations(recommendations: IntelligenceRecommendation[]): IntelligenceRecommendation[] {
    return [...recommendations].sort((left, right) => {
      const scoreDelta = RISK_SCORE_BY_LEVEL[right.priority] - RISK_SCORE_BY_LEVEL[left.priority]
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      const leftIds = left.affectedWorkItemIds.length + left.affectedEmployeeIds.length
      const rightIds = right.affectedWorkItemIds.length + right.affectedEmployeeIds.length
      if (rightIds !== leftIds) {
        return rightIds - leftIds
      }

      return left.title.localeCompare(right.title)
    })
  }

  private sortBottlenecks(forecasts: BottleneckForecast[]): BottleneckForecast[] {
    return [...forecasts].sort((left, right) => {
      const scoreDelta = RISK_SCORE_BY_LEVEL[right.riskLevel] - RISK_SCORE_BY_LEVEL[left.riskLevel]
      if (scoreDelta !== 0) {
        return scoreDelta
      }
      return right.capacityLoadPercentage - left.capacityLoadPercentage
    })
  }

  private calculateDeadlineRiskLevel(input: {
    job: ProductionJob
    shortage: number
    blocked: boolean
    daysUntilDue: number
    carryForwardCount: number
    reworkCount: number
  }): RiskLevel {
    const { job, shortage, blocked, daysUntilDue, carryForwardCount, reworkCount } = input

    let score = 0

    if (job.dueStatus === 'OVERDUE') {
      score += 4
    } else if (job.dueStatus === 'DUE_TODAY') {
      score += 3
    } else if (job.dueStatus === 'DUE_SOON') {
      score += 2
    } else if (job.dueStatus === 'AT_RISK') {
      score += 1
    }

    if (shortage > 120) {
      score += 3
    } else if (shortage > 0) {
      score += 2
    }

    if (blocked) {
      score += 2
    }

    if (daysUntilDue <= 1) {
      score += 1
    }

    if (carryForwardCount >= this.config.carryForwardWarningCount) {
      score += 1
    }

    if (reworkCount > 0) {
      score += 1
    }

    if (score >= 7) {
      return 'CRITICAL'
    }
    if (score >= 5) {
      return 'HIGH'
    }
    if (score >= 3) {
      return 'MEDIUM'
    }
    if (score >= 1) {
      return 'LOW'
    }
    return 'INFO'
  }

  private calculateBottleneckRiskLevel(input: {
    activeCount: number
    capacityLoadPercentage: number
    oldestJobAgeDays?: number
    projectedQueueGrowth: number
  }): RiskLevel {
    const { activeCount, capacityLoadPercentage, oldestJobAgeDays, projectedQueueGrowth } = input

    let score = 0

    if (activeCount >= this.config.bottleneckQueueThreshold) {
      score += 2
    }
    if (capacityLoadPercentage >= this.config.overloadPercentage) {
      score += 3
    } else if (capacityLoadPercentage >= this.config.capacityWarningPercentage) {
      score += 1
    }
    if ((oldestJobAgeDays ?? 0) >= this.config.stageAgeThresholdDays) {
      score += 1
    }
    if (projectedQueueGrowth > 0) {
      score += 1
    }

    if (score >= 6) {
      return 'CRITICAL'
    }
    if (score >= 4) {
      return 'HIGH'
    }
    if (score >= 2) {
      return 'MEDIUM'
    }
    if (score >= 1) {
      return 'LOW'
    }
    return 'INFO'
  }

  private estimateAvailableMinutesBeforeDue(input: {
    dueDate: string
    remainingStages: ProductionStepName[]
    assignedWorker?: Employee
    planForWorker?: BattlePlan
  }): number {
    const dueDate = parseLocalDate(input.dueDate)
    const daysUntilDue = Math.round(
      (startOfDay(dueDate).getTime() - startOfDay(this.now).getTime()) / (24 * 60 * 60 * 1000),
    )

    const workingDaysWindow = Math.max(0, daysUntilDue + 1)
    const workerCapacity = input.assignedWorker?.defaultAvailableMinutes ?? this.averageWorkerCapacity()
    const skilledCoverage = input.assignedWorker && input.remainingStages.length > 0
      ? input.remainingStages.filter((stage) => input.assignedWorker?.skills.includes(stage)).length /
        input.remainingStages.length
      : 1

    const todayAssignedMinutes = (input.planForWorker?.tasks ?? []).reduce(
      (sum, task) => sum + task.estimatedMinutes,
      0,
    )
    const availableToday = Math.max(0, workerCapacity - todayAssignedMinutes)

    if (workingDaysWindow === 0) {
      return Math.round(availableToday * skilledCoverage)
    }

    const futureWindowMinutes = Math.max(0, workingDaysWindow - 1) * workerCapacity
    return Math.round((availableToday + futureWindowMinutes) * skilledCoverage)
  }

  private estimateCompletionDate(minutesRequired: number, dailyCapacity: number): string {
    if (minutesRequired <= 0 || dailyCapacity <= 0) {
      return this.today
    }

    const daysNeeded = Math.ceil(minutesRequired / dailyCapacity)
    const completion = new Date(this.now)
    completion.setDate(completion.getDate() + Math.max(0, daysNeeded - 1))
    return toIsoDate(completion)
  }

  private getRemainingStages(job: ProductionJob): ProductionStepName[] {
    return stageSequence.filter((stage) => job.steps[stage] === 'WAITING')
  }

  private getCurrentWaitingStage(job: ProductionJob): ProductionStepName | undefined {
    return stageSequence.find((stage) => job.steps[stage] === 'WAITING')
  }

  private getTodayPlanByWorker(): Map<string, BattlePlan> {
    const map = new Map<string, BattlePlan>()
    this.battlePlans
      .filter((plan) => plan.date === this.today)
      .forEach((plan) => {
        map.set(plan.assignedWorkerId, plan)
      })

    return map
  }

  private activeJobs(): ProductionJob[] {
    return this.productionJobs.filter((job) => !job.onHold && job.steps.SHIPPED !== 'COMPLETE')
  }

  private getBlockedJobs(): ProductionJob[] {
    return this.productionJobs.filter((job) => this.isBlocked(job))
  }

  private isBlocked(job: ProductionJob): boolean {
    return Boolean(job.onHold) || /blocked|waiting on|pending/i.test(job.notes)
  }

  private countCarryForwardForJob(jobId: string): number {
    return this.battlePlans.reduce((sum, plan) => {
      const inPlan = plan.tasks.filter((task) => task.productionJobId === jobId && task.carryForward)
      return sum + inPlan.length
    }, 0)
  }

  private getCarryForwardCountsByWorker(): Map<string, number> {
    const result = new Map<string, number>()

    for (const plan of this.battlePlans) {
      const current = result.get(plan.assignedWorkerId) ?? 0
      const carryForward = plan.tasks.filter((task) => task.carryForward).length
      result.set(plan.assignedWorkerId, current + carryForward)
    }

    return result
  }

  private countReworkForJob(jobId: string): number {
    return this.activityLogs.filter(
      (entry) =>
        entry.entityId === jobId &&
        entry.entityType === 'WorkItem' &&
        (entry.action === 'STAGE_CHANGED' || entry.action === 'UPDATED') &&
        entry.metadata?.rework === true,
    ).length
  }

  private averageWorkerCapacity(): number {
    const workers = this.employees.filter((employee) => employee.role === 'WORKER' && employee.active)
    if (workers.length === 0) {
      return 0
    }

    return Math.round(
      workers.reduce((sum, worker) => sum + worker.defaultAvailableMinutes, 0) / workers.length,
    )
  }

  private missingStageAgeData(): boolean {
    return true
  }

  private buildDeadlineRecommendation(
    job: ProductionJob,
    riskLevel: RiskLevel,
    shortage: number,
    blocked: boolean,
  ): string {
    if (blocked) {
      return `${job.orderNumber} is ${riskLevel.toLowerCase()} risk because it is blocked and needs immediate unblock action.`
    }

    if (shortage > 0) {
      return `${job.orderNumber} is ${riskLevel.toLowerCase()} risk because it requires ${shortage} more minutes than currently available before due date.`
    }

    return `${job.orderNumber} is ${riskLevel.toLowerCase()} risk and should stay in priority sequencing.`
  }

  private passesConfidence(confidence: RecommendationConfidence): boolean {
    const score = confidence === 'HIGH' ? 1 : confidence === 'MEDIUM' ? 0.65 : 0.4
    return score >= this.config.minimumConfidenceThreshold
  }
}
