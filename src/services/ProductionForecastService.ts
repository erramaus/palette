import type { AppActivityLog } from '../state/AppStateContext'
import type { BattlePlan } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductType, ProductionJob } from '../types/production'
import {
  DEFAULT_FORECAST_CONFIG,
  type CarryForwardEvaluationContext,
  type CarryForwardPrediction,
  type CompletionTimeEstimate,
  type DeadlineForecast,
  type DeadlineRiskLevel,
  type ForecastAccuracySummary,
  type ForecastCapacityRecommendation,
  type ForecastConfidence,
  type ForecastConfig,
  type ForecastReason,
  type ProductionForecastResult,
  type StageDurationForecast,
  type WorkItemForecastPanelData,
  type WorkerFinishProjection,
} from '../types/productionForecasting'
import { HistoricalPerformanceService } from './HistoricalPerformanceService'
import { CompletionTimeEstimator } from './CompletionTimeEstimator'
import { PRODUCTION_STEP_NAMES } from '../types/production'

export interface ProductionForecastInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  activityLogs: AppActivityLog[]
  now?: Date
  config?: Partial<ForecastConfig>
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

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10)

const startOfDay = (value: Date): Date => {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

const dayDiff = (leftIso: string, rightIso: string): number => {
  const left = startOfDay(parseLocalDate(leftIso)).getTime()
  const right = startOfDay(parseLocalDate(rightIso)).getTime()
  return Math.round((left - right) / (24 * 60 * 60 * 1000))
}

const confidenceRank: Record<ForecastConfidence, number> = {
  INSUFFICIENT_DATA: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

const inferPackagingType = (job: ProductionJob): string => {
  const notes = job.notes.toLowerCase()
  if (notes.includes('crate')) {
    return 'CRATE'
  }
  if (notes.includes('gallery')) {
    return 'GALLERY'
  }
  return 'STANDARD_BOX'
}

const safeRangeMinutes = (minutes: number): string => {
  const low = Math.max(0, Math.round(minutes * 0.7))
  const high = Math.max(low, Math.round(minutes * 1.1))
  return `${low}-${high}`
}

const carryBandFromScore = (score: number): CarryForwardPrediction['probabilityBand'] => {
  if (score >= 0.8) {
    return 'VERY_HIGH'
  }
  if (score >= 0.6) {
    return 'HIGH'
  }
  if (score >= 0.4) {
    return 'MODERATE'
  }
  return 'LOW'
}

const confidenceFromSampleAndFallback = (
  sampleCount: number,
  minimum: number,
  usedFallback: boolean,
): ForecastConfidence => {
  if (sampleCount <= 0) {
    return 'INSUFFICIENT_DATA'
  }
  if (sampleCount >= minimum * 2 && !usedFallback) {
    return 'HIGH'
  }
  if (sampleCount >= minimum && !usedFallback) {
    return 'MEDIUM'
  }
  if (sampleCount >= minimum) {
    return 'LOW'
  }
  return 'INSUFFICIENT_DATA'
}

export class ProductionForecastService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly activityLogs: AppActivityLog[]
  private readonly now: Date
  private readonly today: string
  private readonly config: ForecastConfig

  constructor(input: ProductionForecastInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.activityLogs = input.activityLogs
    this.now = input.now ?? new Date()
    this.today = toIsoDate(this.now)
    this.config = {
      ...DEFAULT_FORECAST_CONFIG,
      ...input.config,
    }
  }

  getForecast(): ProductionForecastResult {
    const historicalService = new HistoricalPerformanceService({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
      employees: this.employees,
      activityLogs: this.activityLogs,
      config: this.config,
    })

    const stageForecasts = this.buildStageDurationForecasts(historicalService)
    const estimator = new CompletionTimeEstimator({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
      employees: this.employees,
      historicalService,
      stageForecasts,
      now: this.now,
      config: this.config,
    })

    const deadlineForecasts = this.buildDeadlineForecasts(estimator)
    const carryForwardPredictions = this.buildCarryForwardPredictions(historicalService)
    const workerFinishProjections = this.buildWorkerFinishProjections(carryForwardPredictions)
    const capacityRecommendations = this.buildCapacityRecommendations(
      deadlineForecasts,
      carryForwardPredictions,
      workerFinishProjections,
      historicalService,
    )
    const forecastAccuracy = this.buildForecastAccuracy(estimator)

    const likelyLateJobs = deadlineForecasts
      .filter((forecast) => ['HIGH_RISK', 'LIKELY_LATE', 'OVERDUE'].includes(forecast.riskLevel))
      .sort((left, right) => this.riskRank(right.riskLevel) - this.riskRank(left.riskLevel))
      .slice(0, 8)

    const likelyCarryForwardOperations = carryForwardPredictions
      .filter((prediction) => prediction.probabilityBand === 'HIGH' || prediction.probabilityBand === 'VERY_HIGH')
      .slice(0, 8)

    const probableBottleneckTomorrow = [...stageForecasts]
      .sort((left, right) => this.riskRank(right.backlogGrowthRisk) - this.riskRank(left.backlogGrowthRisk))[0]

    const projectedEarlyFinishWorkers = workerFinishProjections
      .filter((projection) => projection.projectedIdleMinutes > 0)
      .sort((left, right) => right.projectedIdleMinutes - left.projectedIdleMinutes)
      .slice(0, 5)

    const projectedOverCapacityWorkers = workerFinishProjections
      .filter((projection) => projection.projectedOverloadMinutes > 0)
      .sort((left, right) => right.projectedOverloadMinutes - left.projectedOverloadMinutes)
      .slice(0, 5)

    const confidenceWarnings = [
      ...deadlineForecasts
        .filter((forecast) => forecast.confidence === 'INSUFFICIENT_DATA' || forecast.confidence === 'LOW')
        .slice(0, 5)
        .map((forecast) => `${forecast.orderNumber}: confidence ${forecast.confidence} due to limited historical samples.`),
      ...stageForecasts
        .filter((forecast) => forecast.confidence === 'INSUFFICIENT_DATA')
        .slice(0, 3)
        .map((forecast) => `${forecast.stage}: insufficient stage history; collecting actual completion times is required.`),
    ]

    const historicalRecords = historicalService.getHistoricalRecords()

    return {
      generatedAt: this.now.toISOString(),
      forecastConfig: this.config,
      deadlineForecasts,
      stageForecasts,
      carryForwardPredictions,
      workerFinishProjections,
      capacityRecommendations,
      historicalProfiles: {
        stageProfiles: historicalService.getStageProfiles(),
        employeeProfiles: historicalService.getEmployeeProfiles(),
        productTypeProfiles: historicalService.getProductTypeProfiles(),
      },
      forecastAccuracy,
      dashboardSnapshot: {
        likelyLateJobs,
        likelyCarryForwardOperations,
        probableBottleneckTomorrow,
        projectedEarlyFinishWorkers,
        projectedOverCapacityWorkers,
        confidenceWarnings,
      },
      dataQuality: {
        totalHistoricalSamples: historicalRecords.length,
        missingActualTimes: historicalRecords.filter((record) => record.actualMinutes === null).length,
        usedStandardFallback: historicalRecords.some((record) => record.usedStandardFallback),
        excludedData: historicalRecords.filter((record) => record.actualMinutes === null).map((record) => record.battlePlanTaskId),
      },
    }
  }

  getWorkItemForecastPanelData(productionJobId: string): WorkItemForecastPanelData {
    const forecast = this.getForecast().deadlineForecasts.find((item) => item.workItemId === productionJobId)

    if (!forecast) {
      return {
        status: 'INSUFFICIENT_DATA',
        reasons: [
          'No forecasted production job mapping was found for this work item.',
          'Collect production job linkage and historical actual completion times.',
        ],
      }
    }

    if (forecast.confidence === 'INSUFFICIENT_DATA') {
      return {
        status: 'INSUFFICIENT_DATA',
        forecast,
        reasons: [
          `Historical sample size ${forecast.historicalSampleSize} is below minimum ${this.config.minimumHistoricalSampleCount}.`,
          'Record actual stage completion minutes in activity logs for better forecasts.',
        ],
      }
    }

    return {
      status: 'READY',
      forecast,
      reasons: [],
    }
  }

  private buildDeadlineForecasts(estimator: CompletionTimeEstimator): DeadlineForecast[] {
    return this.activeJobs().map((job) => {
      const estimate = estimator.estimateForJob(job)
      const riskLevel = this.toDeadlineRisk(job, estimate)
      const recommendedAction = this.recommendedAction(job, riskLevel, estimate)

      const reasons: ForecastReason[] = [
        ...estimate.reasons,
        {
          code: 'DEADLINE_COMPARISON',
          description: `${job.orderNumber} due ${job.dueDate}; expected ${estimate.expectedDate}; conservative ${estimate.conservativeDate}.`,
        },
      ]

      if (estimate.remainingEstimatedMinutes > estimate.expectedWaitingMinutes + this.config.dailyWorkingMinutes) {
        reasons.push({
          code: 'LARGE_REMAINING_LOAD',
          description: `${estimate.remainingEstimatedMinutes} estimated minutes remain across ${estimate.remainingRequiredStages.length} stages.`,
          value: estimate.remainingEstimatedMinutes,
        })
      }

      if (/approval|material|blocked|waiting/i.test(job.notes)) {
        reasons.push({
          code: 'DEPENDENCY_FLAGGED',
          description: 'Work notes indicate blocking dependencies that increase delay risk.',
          evidence: job.notes,
        })
      }

      return {
        ...estimate,
        riskLevel,
        recommendedAction,
        reasons,
      }
    })
  }

  private buildStageDurationForecasts(
    historicalService: HistoricalPerformanceService,
  ): StageDurationForecast[] {
    return PRODUCTION_STEP_NAMES.map((stage, index) => {
      const stageQueue = this.activeJobs().filter((job) => job.steps[stage] === 'WAITING' && !job.onHold)
      const queuedStandardMinutes = stageQueue.reduce((sum, job) => sum + job.estimatedMinutes[stage], 0)

      const profile = historicalService.resolveBestStageProfile({
        stage,
        productType: (stageQueue[0]?.productType ?? 'CANVAS') as ProductType,
        sizeRange: 'MEDIUM',
        frameStyle: stageQueue[0]?.frameInfo ?? 'UNSPECIFIED',
        packagingType: inferPackagingType(stageQueue[0] ?? this.productionJobs[0]),
        employeeId: stageQueue[0]?.assignedWorkerId ?? this.employees[0]?.id ?? 'UNASSIGNED',
        dayOfWeek: startOfDay(this.now).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        batchSizeBand: 'MEDIUM_BATCH',
      })

      const ratio = profile?.actualToStandardRatio ?? this.config.standardFallbackRatio
      const predictedActualMinutes = Math.round(queuedStandardMinutes * ratio)

      const skilledWorkers = this.employees.filter(
        (employee) => employee.role === 'WORKER' && employee.active && employee.skills.includes(stage),
      )
      const availableSkilledCapacityMinutes = skilledWorkers
        .reduce((sum, worker) => sum + worker.defaultAvailableMinutes, 0)

      const daysToClear =
        availableSkilledCapacityMinutes <= 0
          ? 5
          : Math.ceil(predictedActualMinutes / Math.max(1, availableSkilledCapacityMinutes))
      const expectedQueueClearDate = toIsoDate(addDays(startOfDay(this.now), Math.max(0, daysToClear - 1)))

      const oldestItemAgeDays = stageQueue.length > 0
        ? Math.max(...stageQueue.map((job) => Math.max(0, dayDiff(this.today, job.dueDate))))
        : null

      const priorStage = index > 0 ? PRODUCTION_STEP_NAMES[index - 1] : null
      const incomingWorkExpectedFromPriorStage = priorStage
        ? this.activeJobs().filter((job) => job.steps[priorStage] === 'WAITING').length
        : 0

      const projectedLoadRatio = availableSkilledCapacityMinutes > 0
        ? predictedActualMinutes / availableSkilledCapacityMinutes
        : 2

      const backlogGrowthRisk =
        projectedLoadRatio > 1.4
          ? 'HIGH_RISK'
          : projectedLoadRatio > 1.1
            ? 'AT_RISK'
            : projectedLoadRatio > 0.95
              ? 'WATCH'
              : 'ON_TRACK'

      const usedStandardFallback = !profile
      const sampleSize = profile?.sampleCount ?? 0
      const confidence = confidenceFromSampleAndFallback(
        sampleSize,
        this.config.minimumHistoricalSampleCount,
        usedStandardFallback,
      )

      return {
        stage,
        currentQueueCount: stageQueue.length,
        queuedStandardMinutes,
        predictedActualMinutes,
        availableSkilledCapacityMinutes,
        expectedQueueClearDate,
        oldestItemAgeDays,
        incomingWorkExpectedFromPriorStage,
        backlogGrowthRisk,
        confidence,
        reasons: [
          {
            code: 'QUEUE_LOAD',
            description: `${stage} queue has ${stageQueue.length} item(s) and ${queuedStandardMinutes} standard minutes.`,
          },
          {
            code: 'CAPACITY',
            description: `${skilledWorkers.length} skilled worker(s) contribute ${availableSkilledCapacityMinutes} available minutes.`,
          },
          {
            code: profile ? 'HISTORICAL_RATIO' : 'STANDARD_FALLBACK',
            description: profile
              ? `Historical actual-to-standard ratio ${Math.round(ratio * 100)}% from ${profile.sampleCount} samples.`
              : 'Insufficient historical samples; stage forecast uses standard-time fallback.',
          },
        ],
        dataQuality: {
          sampleSize,
          missingActualTimes: profile?.missingActualTimes ?? 0,
          usedStandardFallback,
          excludedData: profile?.excludedData ?? [],
        },
      }
    })
  }

  private buildCarryForwardPredictions(
    historicalService: HistoricalPerformanceService,
  ): CarryForwardPrediction[] {
    const plansToday = this.battlePlans.filter((plan) => plan.date === this.today)

    return plansToday.flatMap((plan) => {
      const worker = this.employees.find((employee) => employee.id === plan.assignedWorkerId)
      const completedMinutes = plan.tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.estimatedMinutes, 0)
      const remainingWorkerMinutes = Math.max(0, plan.availableMinutes - completedMinutes)
      const activeTasks = plan.tasks
        .filter((task) => !task.completed)
        .sort((left, right) => left.sortOrder - right.sortOrder)

      return activeTasks.map((task, index) => {
        const job = this.productionJobs.find((candidate) => candidate.id === task.productionJobId)
        const stageProfile = historicalService.resolveBestStageProfile({
          stage: task.productionStep,
          productType: (job?.productType ?? 'CANVAS') as ProductType,
          sizeRange: 'MEDIUM',
          frameStyle: job?.frameInfo ?? 'UNSPECIFIED',
          packagingType: inferPackagingType(job ?? this.productionJobs[0]),
          employeeId: plan.assignedWorkerId,
          dayOfWeek: startOfDay(this.now).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
          batchSizeBand: plan.tasks.length <= 3 ? 'SMALL_BATCH' : plan.tasks.length <= 7 ? 'MEDIUM_BATCH' : 'LARGE_BATCH',
        })

        const employeeRatio = stageProfile?.actualToStandardRatio ?? this.config.standardFallbackRatio
        const interruptions = /material|approval|blocked|waiting|repair|customer/i.test(task.notes) ? 1 : 0

        const context: CarryForwardEvaluationContext = {
          task,
          workerAvailableMinutes: plan.availableMinutes,
          workerRemainingMinutes: remainingWorkerMinutes,
          employeePerformanceRatio: employeeRatio,
          interruptionCount: interruptions,
          sequencePosition: index + 1,
          blockedDependency: /blocked|waiting on|dependency/i.test(task.notes),
        }

        return this.predictCarryForward(context, worker?.name ?? plan.assignedWorkerId, job?.orderNumber ?? task.productionJobId)
      })
    })
  }

  private buildWorkerFinishProjections(
    carryForwardPredictions: CarryForwardPrediction[],
  ): WorkerFinishProjection[] {
    const plansToday = this.battlePlans.filter((plan) => plan.date === this.today)

    return plansToday.map((plan) => {
      const worker = this.employees.find((employee) => employee.id === plan.assignedWorkerId)
      const plannedMinutes = plan.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
      const completedMinutes = plan.tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.estimatedMinutes, 0)
      const remainingMinutes = Math.max(0, plannedMinutes - completedMinutes)
      const projectedOverloadMinutes = Math.max(0, plannedMinutes - plan.availableMinutes)
      const projectedIdleMinutes = Math.max(0, plan.availableMinutes - plannedMinutes)

      const predictedFinishMinutes = Math.min(plan.availableMinutes, plannedMinutes)
      const finishHour = 8 + Math.floor(predictedFinishMinutes / 60)
      const finishMinute = predictedFinishMinutes % 60
      const predictedFinishTime = `${String(finishHour).padStart(2, '0')}:${String(finishMinute).padStart(2, '0')}`

      const likelyCarryForwardTaskIds = carryForwardPredictions
        .filter((prediction) =>
          plan.tasks.some((task) => task.id === prediction.taskId) &&
          (prediction.probabilityBand === 'HIGH' || prediction.probabilityBand === 'VERY_HIGH'),
        )
        .map((prediction) => prediction.taskId)

      return {
        employeeId: plan.assignedWorkerId,
        employeeName: worker?.name ?? plan.assignedWorkerId,
        predictedFinishTime,
        projectedOverloadMinutes,
        projectedIdleMinutes,
        unassignedCapacityMinutes: Math.max(0, plan.availableMinutes - remainingMinutes),
        likelyCarryForwardTaskIds,
      }
    })
  }

  private buildCapacityRecommendations(
    deadlineForecasts: DeadlineForecast[],
    carryForwardPredictions: CarryForwardPrediction[],
    workerFinishProjections: WorkerFinishProjection[],
    historicalService: HistoricalPerformanceService,
  ): ForecastCapacityRecommendation[] {
    const recommendations: ForecastCapacityRecommendation[] = []

    const overloaded = workerFinishProjections
      .filter((projection) => projection.projectedOverloadMinutes > 0)
      .sort((left, right) => right.projectedOverloadMinutes - left.projectedOverloadMinutes)

    const available = workerFinishProjections
      .filter((projection) => projection.projectedIdleMinutes > this.config.carryForwardWarningThresholdMinutes)
      .sort((left, right) => right.projectedIdleMinutes - left.projectedIdleMinutes)

    for (const over of overloaded) {
      const target = available.find((candidate) => candidate.employeeId !== over.employeeId)
      if (!target) {
        continue
      }

      const impactedMinutes = Math.min(over.projectedOverloadMinutes, target.projectedIdleMinutes)
      const protectedDueDates = deadlineForecasts
        .filter((forecast) => forecast.riskLevel === 'HIGH_RISK' || forecast.riskLevel === 'LIKELY_LATE')
        .slice(0, 3)
        .map((forecast) => forecast.dueDate)

      const affectedEmployees = [over.employeeName, target.employeeName]
      const matchingProfiles = historicalService.getEmployeeProfiles().filter((profile) =>
        affectedEmployees.includes(profile.employeeName),
      )

      recommendations.push({
        id: `MOVE-${over.employeeId}-${target.employeeId}`,
        summary: `Move compatible work from ${over.employeeName} to ${target.employeeName}.`,
        productionImpact: `Reduces overload by about ${impactedMinutes} minutes and protects near-term due dates.`,
        estimatedMinutesAffected: impactedMinutes,
        dueDatesProtected: protectedDueDates,
        affectedEmployees,
        confidence: this.combineConfidence(matchingProfiles.map((profile) =>
          confidenceFromSampleAndFallback(profile.sampleCount, this.config.minimumHistoricalSampleCount, false),
        )),
        supportingHistoricalEvidence: matchingProfiles.map((profile) =>
          `${profile.employeeName}: median ratio ${profile.actualToStandardRatio ?? 1} over ${profile.sampleCount} samples.`,
        ),
      })
    }

    const highCarry = carryForwardPredictions
      .filter((prediction) => prediction.probabilityBand === 'VERY_HIGH')
      .slice(0, 3)

    for (const prediction of highCarry) {
      recommendations.push({
        id: `PULL-FWD-${prediction.taskId}`,
        summary: `Pull ${prediction.orderNumber} ${prediction.stage} operation forward today.`,
        productionImpact: `Expected to reduce carry-forward risk by ${prediction.likelyCarryForwardMinutes} minutes.`,
        estimatedMinutesAffected: Number(prediction.likelyCarryForwardMinutes.split('-')[0]) || 0,
        dueDatesProtected: deadlineForecasts
          .filter((forecast) => forecast.workItemId === prediction.workItemId)
          .map((forecast) => forecast.dueDate),
        affectedEmployees: [],
        confidence: prediction.confidence,
        supportingHistoricalEvidence: prediction.reasons.map((reason) => reason.description),
      })
    }

    return recommendations
  }

  private buildForecastAccuracy(estimator: CompletionTimeEstimator): ForecastAccuracySummary {
    const completedOrShipped = this.productionJobs.filter((job) => job.steps.SHIPPED === 'COMPLETE')

    if (completedOrShipped.length === 0) {
      return {
        comparedForecasts: 0,
        medianForecastErrorMinutes: null,
        forecastBiasMinutes: null,
        percentageWithinForecastRange: null,
        falseRiskRate: null,
        missedRiskRate: null,
        missingDataCount: 1,
        status: 'INSUFFICIENT_DATA',
        reasons: ['No shipped-complete jobs available to compare predicted completion with actual completion.'],
      }
    }

    const errors: number[] = []
    const biases: number[] = []
    let withinRange = 0
    let falseRisk = 0
    let missedRisk = 0

    for (const job of completedOrShipped) {
      const estimate = estimator.estimateForJob(job)
      const actualCompletionDate = job.dueDate
      const predictedExpectedDate = estimate.expectedDate
      const deltaDays = dayDiff(predictedExpectedDate, actualCompletionDate)
      const deltaMinutes = deltaDays * this.config.dailyWorkingMinutes
      errors.push(Math.abs(deltaMinutes))
      biases.push(deltaMinutes)

      const optimisticLead = dayDiff(actualCompletionDate, estimate.optimisticDate)
      const conservativeLag = dayDiff(estimate.conservativeDate, actualCompletionDate)
      if (optimisticLead >= 0 && conservativeLag >= 0) {
        withinRange += 1
      }

      const predictedRisk = this.toDeadlineRisk(job, estimate)
      const actuallyLate = dayDiff(actualCompletionDate, job.dueDate) > 0
      const predictedLate = predictedRisk === 'HIGH_RISK' || predictedRisk === 'LIKELY_LATE' || predictedRisk === 'OVERDUE'

      if (predictedLate && !actuallyLate) {
        falseRisk += 1
      }
      if (!predictedLate && actuallyLate) {
        missedRisk += 1
      }
    }

    errors.sort((a, b) => a - b)
    const medianError = errors.length > 0 ? errors[Math.floor(errors.length / 2)] : null
    const bias = biases.length > 0 ? biases.reduce((sum, value) => sum + value, 0) / biases.length : null

    return {
      comparedForecasts: completedOrShipped.length,
      medianForecastErrorMinutes: medianError,
      forecastBiasMinutes: bias,
      percentageWithinForecastRange: completedOrShipped.length > 0 ? (withinRange / completedOrShipped.length) * 100 : null,
      falseRiskRate: completedOrShipped.length > 0 ? (falseRisk / completedOrShipped.length) * 100 : null,
      missedRiskRate: completedOrShipped.length > 0 ? (missedRisk / completedOrShipped.length) * 100 : null,
      missingDataCount: 0,
      status: 'READY',
      reasons: [],
    }
  }

  private predictCarryForward(
    context: CarryForwardEvaluationContext,
    employeeName: string,
    orderNumber: string,
  ): CarryForwardPrediction {
    const minutesPressure = context.task.estimatedMinutes / Math.max(1, context.workerRemainingMinutes)
    const sequencePressure = context.sequencePosition > 2 ? 0.2 : 0.05
    const interruptionPressure = context.interruptionCount * 0.18
    const dependencyPressure = context.blockedDependency ? 0.2 : 0
    const performancePressure = Math.max(0, context.employeePerformanceRatio - 1) * 0.35

    const score = Math.min(
      1,
      minutesPressure * 0.45 + sequencePressure + interruptionPressure + dependencyPressure + performancePressure,
    )

    const probabilityBand = carryBandFromScore(score)
    const likelyCarryForwardMinutes = safeRangeMinutes(
      Math.max(0, context.task.estimatedMinutes - context.workerRemainingMinutes * 0.55),
    )

    const confidence = score >= 0.75
      ? 'HIGH'
      : score >= 0.5
        ? 'MEDIUM'
        : score >= 0.25
          ? 'LOW'
          : 'INSUFFICIENT_DATA'

    const reasons: ForecastReason[] = [
      {
        code: 'REMAINING_MINUTES',
        description: `${context.task.estimatedMinutes} remaining minutes for ${orderNumber} ${context.task.productionStep}.`,
      },
      {
        code: 'WORKER_REMAINING_CAPACITY',
        description: `${context.workerRemainingMinutes} worker minutes remain today for ${employeeName}.`,
      },
      {
        code: 'EMPLOYEE_RATIO',
        description: `Employee actual-to-standard ratio is ${Math.round(context.employeePerformanceRatio * 100)}%.`,
      },
    ]

    if (context.interruptionCount > 0) {
      reasons.push({
        code: 'INTERRUPTIONS',
        description: 'Interruption indicators found in operation notes.',
      })
    }

    if (context.blockedDependency) {
      reasons.push({
        code: 'BLOCKED_DEPENDENCY',
        description: 'Blocked dependency detected for this operation.',
      })
    }

    return {
      taskId: context.task.id,
      workItemId: context.task.productionJobId,
      orderNumber,
      stage: context.task.productionStep,
      probabilityBand,
      likelyCarryForwardMinutes,
      reasons,
      recommendedAction:
        probabilityBand === 'VERY_HIGH' || probabilityBand === 'HIGH'
          ? 'Re-sequence earlier or split operation across qualified workers.'
          : 'Keep in sequence and monitor progress after next completion checkpoint.',
      confidence,
    }
  }

  private toDeadlineRisk(job: ProductionJob, estimate: CompletionTimeEstimate): DeadlineRiskLevel {
    if (job.dueStatus === 'OVERDUE') {
      return 'OVERDUE'
    }

    const due = parseLocalDate(job.dueDate)
    const optimistic = parseLocalDate(estimate.optimisticDate)
    const expected = parseLocalDate(estimate.expectedDate)
    const conservative = parseLocalDate(estimate.conservativeDate)

    const bufferMs = this.config.forecastBufferHours * 60 * 60 * 1000

    if (optimistic.getTime() > due.getTime()) {
      return 'LIKELY_LATE'
    }
    if (expected.getTime() > due.getTime()) {
      return 'HIGH_RISK'
    }
    if (conservative.getTime() > due.getTime()) {
      return 'AT_RISK'
    }
    if (due.getTime() - expected.getTime() <= bufferMs) {
      return 'WATCH'
    }

    return 'ON_TRACK'
  }

  private recommendedAction(
    job: ProductionJob,
    riskLevel: DeadlineRiskLevel,
    estimate: CompletionTimeEstimate,
  ): string {
    if (riskLevel === 'OVERDUE') {
      return `Prioritize ${job.orderNumber} immediately and assign next available qualified worker.`
    }
    if (riskLevel === 'LIKELY_LATE') {
      return `Even optimistic completion misses ${job.dueDate}; split remaining stages and protect due date.`
    }
    if (riskLevel === 'HIGH_RISK') {
      return `Expected completion ${estimate.expectedDate} exceeds due date; re-prioritize and reduce queue wait.`
    }
    if (riskLevel === 'AT_RISK') {
      return `Conservative completion overlaps due date; pull one stage forward and monitor every completion.`
    }
    if (riskLevel === 'WATCH') {
      return `Limited buffer remains; avoid adding non-customer work ahead of this item.`
    }
    return `On track; keep sequence and monitor stage queue clearance.`
  }

  private combineConfidence(values: ForecastConfidence[]): ForecastConfidence {
    if (values.length === 0) {
      return 'INSUFFICIENT_DATA'
    }

    const averageRank = values.reduce((sum, value) => sum + confidenceRank[value], 0) / values.length
    if (averageRank >= 2.5) {
      return 'HIGH'
    }
    if (averageRank >= 1.7) {
      return 'MEDIUM'
    }
    if (averageRank >= 1) {
      return 'LOW'
    }
    return 'INSUFFICIENT_DATA'
  }

  private activeJobs(): ProductionJob[] {
    return this.productionJobs.filter((job) => !job.onHold && job.steps.SHIPPED !== 'COMPLETE')
  }

  private riskRank(level: DeadlineRiskLevel): number {
    if (level === 'OVERDUE') {
      return 5
    }
    if (level === 'LIKELY_LATE') {
      return 4
    }
    if (level === 'HIGH_RISK') {
      return 3
    }
    if (level === 'AT_RISK') {
      return 2
    }
    if (level === 'WATCH') {
      return 1
    }
    return 0
  }
}
