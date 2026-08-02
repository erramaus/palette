import type { BattlePlan } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductType, ProductionJob, ProductionStepName } from '../types/production'
import {
  DEFAULT_FORECAST_CONFIG,
  type CompletionTimeEstimate,
  type ForecastConfig,
  type ForecastReason,
  type StageDurationForecast,
} from '../types/productionForecasting'
import { HistoricalPerformanceService } from './HistoricalPerformanceService'

interface CompletionTimeEstimatorInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  historicalService: HistoricalPerformanceService
  stageForecasts: StageDurationForecast[]
  now?: Date
  config?: Partial<ForecastConfig>
}

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10)

const startOfDay = (value: Date): Date => {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

const isWorkingDay = (date: Date, workingDays: number[]): boolean => {
  const day = date.getDay()
  const normalized = day === 0 ? 7 : day
  return workingDays.includes(normalized)
}

const addBusinessMinutes = (start: Date, minutes: number, config: ForecastConfig): Date => {
  let remaining = Math.max(0, Math.round(minutes))
  const cursor = new Date(start)

  while (remaining > 0) {
    if (!isWorkingDay(cursor, config.weekendWorkingDays)) {
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(8, 0, 0, 0)
      continue
    }

    remaining -= config.dailyWorkingMinutes
    if (remaining > 0) {
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(8, 0, 0, 0)
    }
  }

  return cursor
}

const sizeRange = (job: ProductionJob): string => {
  const area = job.width * job.height
  if (area < 700) {
    return 'SMALL'
  }
  if (area < 1400) {
    return 'MEDIUM'
  }
  if (area < 2400) {
    return 'LARGE'
  }
  return 'XL'
}

const packagingType = (job: ProductionJob): string => {
  const notes = job.notes.toLowerCase()
  if (notes.includes('crate')) {
    return 'CRATE'
  }
  if (notes.includes('gallery')) {
    return 'GALLERY'
  }
  return 'STANDARD_BOX'
}

const frameStyle = (job: ProductionJob): string => {
  const info = job.frameInfo.trim()
  return info.length > 0 ? info : 'UNSPECIFIED'
}

const dayOfWeek = (date: Date): string => date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()

const inferBatchSizeBand = (plans: BattlePlan[], workerId: string, isoDate: string): string => {
  const plan = plans.find((candidate) => candidate.assignedWorkerId === workerId && candidate.date === isoDate)
  const taskCount = plan?.tasks.length ?? 0
  if (taskCount <= 3) {
    return 'SMALL_BATCH'
  }
  if (taskCount <= 7) {
    return 'MEDIUM_BATCH'
  }
  return 'LARGE_BATCH'
}

const confidenceFromScore = (score: number, config: ForecastConfig) => {
  if (score >= config.confidenceHighThreshold) {
    return 'HIGH' as const
  }
  if (score >= config.confidenceMediumThreshold) {
    return 'MEDIUM' as const
  }
  if (score > 0) {
    return 'LOW' as const
  }
  return 'INSUFFICIENT_DATA' as const
}

const getRemainingStages = (job: ProductionJob): ProductionStepName[] =>
  (Object.keys(job.steps) as ProductionStepName[])
    .filter((stage) => job.steps[stage] === 'WAITING')

export class CompletionTimeEstimator {
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly historicalService: HistoricalPerformanceService
  private readonly stageForecasts: StageDurationForecast[]
  private readonly now: Date
  private readonly config: ForecastConfig

  constructor(input: CompletionTimeEstimatorInput) {
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.historicalService = input.historicalService
    this.stageForecasts = input.stageForecasts
    this.now = input.now ?? new Date()
    this.config = {
      ...DEFAULT_FORECAST_CONFIG,
      ...input.config,
    }
  }

  estimateForJob(job: ProductionJob): CompletionTimeEstimate {
    const remainingStages = getRemainingStages(job)
    const worker = this.employees.find((employee) => employee.id === job.assignedWorkerId)
    const reasons: ForecastReason[] = []
    const dataSources = new Set<string>()

    if (remainingStages.length === 0) {
      const doneDate = toIsoDate(startOfDay(this.now))
      return {
        workItemId: job.id,
        orderNumber: job.orderNumber,
        dueDate: job.dueDate,
        remainingRequiredStages: [],
        remainingEstimatedMinutes: 0,
        optimisticDate: doneDate,
        expectedDate: doneDate,
        conservativeDate: doneDate,
        estimatedShipReadyDate: doneDate,
        expectedWaitingMinutes: 0,
        confidence: 'HIGH',
        reasons: [{ code: 'NO_REMAINING_STAGES', description: 'All required stages are complete.' }],
        dataSourcesUsed: ['current_workflow_state'],
        historicalSampleSize: 0,
        missingActualTimes: 0,
        usedStandardFallback: false,
        excludedData: [],
      }
    }

    let expectedMinutes = 0
    let optimisticMinutes = 0
    let conservativeMinutes = 0
    let totalSampleSize = 0
    let totalMissingActual = 0
    let usedStandardFallback = false
    const excludedData: string[] = []

    for (const stage of remainingStages) {
      const standardMinutes = job.estimatedMinutes[stage]
      const profile = this.historicalService.resolveBestStageProfile({
        stage,
        productType: job.productType as ProductType,
        sizeRange: sizeRange(job),
        frameStyle: frameStyle(job),
        packagingType: packagingType(job),
        employeeId: job.assignedWorkerId,
        dayOfWeek: dayOfWeek(this.now),
        batchSizeBand: inferBatchSizeBand(this.battlePlans, job.assignedWorkerId, toIsoDate(this.now)),
      })

      if (!profile) {
        usedStandardFallback = true
        expectedMinutes += standardMinutes * this.config.standardFallbackRatio
        optimisticMinutes += standardMinutes * 0.9
        conservativeMinutes += standardMinutes * (1 + this.config.forecastBufferHours / 24)
        reasons.push({
          code: 'STANDARD_FALLBACK',
          description: `${stage} used standard duration due to insufficient historical samples.`,
          value: standardMinutes,
        })
        dataSources.add('standard_minutes')
        continue
      }

      const medianActual = profile.medianActualMinutes ?? standardMinutes
      const p75 = profile.p75ActualMinutes ?? medianActual * 1.1
      const p90 = profile.p90ActualMinutes ?? medianActual * 1.2
      const ratio = profile.actualToStandardRatio ?? 1
      const reworkMultiplier = 1 + profile.reworkFrequency * this.config.reworkAdjustment

      const adjustedExpected = medianActual * ratio * reworkMultiplier
      expectedMinutes += adjustedExpected
      optimisticMinutes += Math.max(1, medianActual * 0.9)
      conservativeMinutes += this.config.conservativePercentile >= 90 ? p90 : p75

      totalSampleSize += profile.sampleCount
      totalMissingActual += profile.missingActualTimes
      excludedData.push(...profile.excludedData)

      reasons.push({
        code: 'HISTORICAL_MEDIAN_USED',
        description: `${stage} forecast uses historical median ${Math.round(medianActual)} minutes from ${profile.sampleCount} samples.`,
        value: profile.sampleCount,
      })
      dataSources.add('historical_median')
    }

    const waitingMinutes = this.estimateWaitingMinutes(remainingStages)
    expectedMinutes += waitingMinutes
    optimisticMinutes += waitingMinutes * 0.5
    conservativeMinutes += waitingMinutes * (1 + this.config.stageQueueWeight)

    if (job.onHold) {
      expectedMinutes += this.config.dailyWorkingMinutes
      conservativeMinutes += this.config.dailyWorkingMinutes * 2
      reasons.push({
        code: 'BLOCKED_OR_ON_HOLD',
        description: 'Job is on hold, adding one full-day delay to expected estimate.',
      })
    }

    if (/approval|approved/i.test(job.notes)) {
      expectedMinutes += 45
      conservativeMinutes += 90
      reasons.push({
        code: 'APPROVAL_DELAY',
        description: 'Approval dependency detected in notes.',
      })
    }

    if (/material|crate|supply/i.test(job.notes)) {
      expectedMinutes += 60
      conservativeMinutes += 120
      reasons.push({
        code: 'MATERIAL_DELAY',
        description: 'Material dependency detected in notes.',
      })
    }

    const overloadFactor = this.getDepartmentWorkloadFactor()
    expectedMinutes *= overloadFactor
    optimisticMinutes *= Math.max(1, overloadFactor - 0.08)
    conservativeMinutes *= overloadFactor + 0.12

    reasons.push({
      code: 'QUEUE_WAIT_TIME',
      description: `Expected stage-queue waiting adds about ${Math.round(waitingMinutes)} minutes.`,
      value: Math.round(waitingMinutes),
    })
    reasons.push({
      code: 'DEPARTMENT_WORKLOAD',
      description: `Department workload factor applied: ${Math.round(overloadFactor * 100)}%.`,
      value: Math.round(overloadFactor * 100),
    })

    const optimisticDate = addBusinessMinutes(startOfDay(this.now), optimisticMinutes, this.config)
    const expectedDate = addBusinessMinutes(startOfDay(this.now), expectedMinutes, this.config)
    const conservativeDate = addBusinessMinutes(startOfDay(this.now), conservativeMinutes, this.config)

    const sampleQuality = totalSampleSize <= 0
      ? 0
      : Math.max(0, (totalSampleSize - totalMissingActual) / totalSampleSize)

    let confidenceScore = 0.35
    confidenceScore += Math.min(0.35, sampleQuality * 0.35)
    confidenceScore += usedStandardFallback ? 0 : 0.15
    confidenceScore += waitingMinutes > 0 ? 0.08 : 0
    confidenceScore += worker ? 0.07 : 0

    const confidence = confidenceFromScore(confidenceScore, this.config)

    if (!worker) {
      reasons.push({
        code: 'MISSING_ASSIGNMENT',
        description: 'Assigned worker profile missing; used team capacity fallback.',
      })
    }

    if (totalSampleSize < this.config.minimumHistoricalSampleCount) {
      reasons.push({
        code: 'INSUFFICIENT_HISTORY',
        description: `Only ${totalSampleSize} historical samples available; minimum is ${this.config.minimumHistoricalSampleCount}.`,
      })
    }

    return {
      workItemId: job.id,
      orderNumber: job.orderNumber,
      dueDate: job.dueDate,
      remainingRequiredStages: remainingStages,
      remainingEstimatedMinutes: Math.round(expectedMinutes),
      optimisticDate: toIsoDate(optimisticDate),
      expectedDate: toIsoDate(expectedDate),
      conservativeDate: toIsoDate(conservativeDate),
      estimatedShipReadyDate: toIsoDate(expectedDate),
      expectedWaitingMinutes: Math.round(waitingMinutes),
      confidence,
      reasons,
      dataSourcesUsed: [...dataSources],
      historicalSampleSize: totalSampleSize,
      missingActualTimes: totalMissingActual,
      usedStandardFallback,
      excludedData,
    }
  }

  private estimateWaitingMinutes(remainingStages: ProductionStepName[]): number {
    return remainingStages.reduce((sum, stage) => {
      const forecast = this.stageForecasts.find((item) => item.stage === stage)
      if (!forecast) {
        return sum
      }

      const weighted = forecast.predictedActualMinutes * this.config.stageQueueWeight
      return sum + Math.max(0, weighted / Math.max(1, forecast.currentQueueCount || 1))
    }, 0)
  }

  private getDepartmentWorkloadFactor(): number {
    const today = toIsoDate(this.now)
    const plansToday = this.battlePlans.filter((plan) => plan.date === today)
    const plannedMinutes = plansToday
      .flatMap((plan) => plan.tasks)
      .reduce((sum, task) => sum + task.estimatedMinutes, 0)

    const availableMinutes = this.employees
      .filter((employee) => employee.role === 'WORKER' && employee.active)
      .reduce((sum, worker) => sum + worker.defaultAvailableMinutes, 0)

    if (availableMinutes <= 0) {
      return 1.2
    }

    const ratio = plannedMinutes / availableMinutes
    if (ratio <= 0.85) {
      return 1
    }

    return 1 + Math.min(0.35, ratio - 0.85)
  }
}
