import type { AppActivityLog } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductType, ProductionJob, ProductionStepName } from '../types/production'
import {
  DEFAULT_FORECAST_CONFIG,
  type EmployeePerformanceProfile,
  type ForecastConfig,
  type HistoricalDurationRecord,
  type HistoricalProfileLookupKey,
  type HistoricalStats,
  type ProductTypePerformanceProfile,
  type StageDurationProfile,
} from '../types/productionForecasting'

interface HistoricalPerformanceInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  activityLogs: AppActivityLog[]
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
  if (notes.includes('pickup')) {
    return 'PICKUP'
  }
  if (notes.includes('gallery')) {
    return 'GALLERY'
  }
  return 'STANDARD_BOX'
}

const frameStyle = (job: ProductionJob): string => {
  const value = job.frameInfo.trim()
  return value.length > 0 ? value : 'UNSPECIFIED'
}

const toDayOfWeek = (isoDate: string): string => {
  const date = parseLocalDate(isoDate)
  return date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()
}

const batchSizeBand = (plan: BattlePlan): string => {
  const count = plan.tasks.length
  if (count <= 3) {
    return 'SMALL_BATCH'
  }
  if (count <= 7) {
    return 'MEDIUM_BATCH'
  }
  return 'LARGE_BATCH'
}

const quantile = (values: number[], percentile: number): number | null => {
  if (values.length === 0) {
    return null
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * percentile
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return sorted[lower]
  }

  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

const average = (values: number[]): number | null => {
  if (values.length === 0) {
    return null
  }

  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

const median = (values: number[]): number | null => quantile(values, 0.5)

const round2 = (value: number | null): number | null => {
  if (value === null) {
    return null
  }

  return Math.round(value * 100) / 100
}

const buildStats = (records: HistoricalDurationRecord[]): HistoricalStats => {
  const actualPairs = records.filter((record) => record.actualMinutes !== null)
  const actualMinutes = actualPairs.map((record) => record.actualMinutes as number)
  const standardMinutes = records.map((record) => record.standardMinutes).filter((value) => value > 0)
  const ratios = actualPairs
    .filter((record) => record.standardMinutes > 0)
    .map((record) => (record.actualMinutes as number) / record.standardMinutes)

  const reworkCount = records.filter((record) => record.rework).length
  const carryForwardCount = records.filter((record) => record.carryForward).length

  return {
    sampleCount: records.length,
    medianActualMinutes: round2(median(actualMinutes)),
    averageActualMinutes: round2(average(actualMinutes)),
    p75ActualMinutes: round2(quantile(actualMinutes, 0.75)),
    p90ActualMinutes: round2(quantile(actualMinutes, 0.9)),
    standardMinutesMedian: round2(median(standardMinutes)),
    actualToStandardRatio: round2(median(ratios)),
    reworkFrequency: records.length > 0 ? round2(reworkCount / records.length) ?? 0 : 0,
    carryForwardFrequency: records.length > 0 ? round2(carryForwardCount / records.length) ?? 0 : 0,
    missingActualTimes: records.length - actualPairs.length,
    excludedData: [],
  }
}

const parseNumberMetadata = (log: AppActivityLog, key: string): number | null => {
  const value = log.metadata?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

export class HistoricalPerformanceService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly activityLogs: AppActivityLog[]
  private readonly config: ForecastConfig

  constructor(input: HistoricalPerformanceInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.activityLogs = input.activityLogs
    this.config = {
      ...DEFAULT_FORECAST_CONFIG,
      ...input.config,
    }
  }

  getHistoricalRecords(): HistoricalDurationRecord[] {
    const jobsById = new Map(this.productionJobs.map((job) => [job.id, job]))

    return this.battlePlans
      .flatMap((plan) =>
        plan.tasks
          .filter((task) => task.completed)
          .map((task) => this.toRecord(task, plan, jobsById.get(task.productionJobId))),
      )
      .filter((record): record is HistoricalDurationRecord => record !== null)
  }

  getStageProfiles(): StageDurationProfile[] {
    const records = this.getHistoricalRecords()
    const profiles: StageDurationProfile[] = []

    const groupers: Array<{
      keyPrefix: string
      keyOf: (record: HistoricalDurationRecord) => string
      stageFrom: (record: HistoricalDurationRecord) => ProductionStepName
      decorate: (record: HistoricalDurationRecord) => Partial<StageDurationProfile>
    }> = [
      {
        keyPrefix: 'STAGE',
        keyOf: (record) => record.stage,
        stageFrom: (record) => record.stage,
        decorate: () => ({}),
      },
      {
        keyPrefix: 'STAGE_PRODUCT_SIZE',
        keyOf: (record) => `${record.stage}|${record.productType}|${record.sizeRange}`,
        stageFrom: (record) => record.stage,
        decorate: (record) => ({ productType: record.productType, sizeRange: record.sizeRange }),
      },
      {
        keyPrefix: 'STAGE_PRODUCT',
        keyOf: (record) => `${record.stage}|${record.productType}`,
        stageFrom: (record) => record.stage,
        decorate: (record) => ({ productType: record.productType }),
      },
      {
        keyPrefix: 'STAGE_EMPLOYEE',
        keyOf: (record) => `${record.stage}|${record.employeeId}`,
        stageFrom: (record) => record.stage,
        decorate: (record) => ({ employeeId: record.employeeId }),
      },
      {
        keyPrefix: 'STAGE_FRAME_PACKAGING',
        keyOf: (record) => `${record.stage}|${record.frameStyle}|${record.packagingType}`,
        stageFrom: (record) => record.stage,
        decorate: (record) => ({ frameStyle: record.frameStyle, packagingType: record.packagingType }),
      },
      {
        keyPrefix: 'STAGE_DAY_BATCH',
        keyOf: (record) => `${record.stage}|${record.dayOfWeek}|${record.batchSizeBand}`,
        stageFrom: (record) => record.stage,
        decorate: (record) => ({ dayOfWeek: record.dayOfWeek, batchSizeBand: record.batchSizeBand }),
      },
    ]

    for (const grouping of groupers) {
      const grouped = new Map<string, HistoricalDurationRecord[]>()
      for (const record of records) {
        const key = grouping.keyOf(record)
        grouped.set(key, [...(grouped.get(key) ?? []), record])
      }

      for (const [key, groupedRecords] of grouped.entries()) {
        const stats = buildStats(groupedRecords)
        profiles.push({
          key: `${grouping.keyPrefix}:${key}`,
          stage: grouping.stageFrom(groupedRecords[0]),
          ...grouping.decorate(groupedRecords[0]),
          ...stats,
          excludedData: this.buildExcludedData(groupedRecords),
        })
      }
    }

    return profiles
  }

  getEmployeeProfiles(): EmployeePerformanceProfile[] {
    const records = this.getHistoricalRecords()
    const grouped = new Map<string, HistoricalDurationRecord[]>()

    records.forEach((record) => {
      grouped.set(record.employeeId, [...(grouped.get(record.employeeId) ?? []), record])
    })

    return [...grouped.entries()].map(([employeeId, employeeRecords]) => {
      const employee = this.employees.find((candidate) => candidate.id === employeeId)
      const stageCounts = new Map<ProductionStepName, number>()
      employeeRecords.forEach((record) => {
        stageCounts.set(record.stage, (stageCounts.get(record.stage) ?? 0) + 1)
      })

      const primaryStages = [...stageCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([stage]) => stage)

      return {
        employeeId,
        employeeName: employee?.name ?? employeeId,
        primaryStages,
        ...buildStats(employeeRecords),
      }
    })
  }

  getProductTypeProfiles(): ProductTypePerformanceProfile[] {
    const records = this.getHistoricalRecords()
    const grouped = new Map<ProductType, HistoricalDurationRecord[]>()

    records.forEach((record) => {
      grouped.set(record.productType, [...(grouped.get(record.productType) ?? []), record])
    })

    return [...grouped.entries()].map(([productType, productRecords]) => {
      const stageCounts = new Map<ProductionStepName, number>()
      productRecords.forEach((record) => {
        stageCounts.set(record.stage, (stageCounts.get(record.stage) ?? 0) + 1)
      })

      const dominantStages = [...stageCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([stage]) => stage)

      return {
        productType,
        dominantStages,
        ...buildStats(productRecords),
      }
    })
  }

  resolveBestStageProfile(key: HistoricalProfileLookupKey): StageDurationProfile | null {
    const profiles = this.getStageProfiles()
    const minSample = this.config.minimumHistoricalSampleCount

    const priority = [
      (profile: StageDurationProfile) =>
        profile.stage === key.stage &&
        profile.productType === key.productType &&
        profile.sizeRange === key.sizeRange,
      (profile: StageDurationProfile) =>
        profile.stage === key.stage &&
        profile.productType === key.productType,
      (profile: StageDurationProfile) =>
        profile.stage === key.stage &&
        profile.employeeId === key.employeeId,
      (profile: StageDurationProfile) =>
        profile.stage === key.stage &&
        profile.frameStyle === key.frameStyle &&
        profile.packagingType === key.packagingType,
      (profile: StageDurationProfile) =>
        profile.stage === key.stage &&
        profile.dayOfWeek === key.dayOfWeek &&
        profile.batchSizeBand === key.batchSizeBand,
      (profile: StageDurationProfile) =>
        profile.stage === key.stage,
    ]

    for (const matches of priority) {
      const found = profiles.find((profile) => matches(profile) && profile.sampleCount >= minSample)
      if (found) {
        return found
      }
    }

    return null
  }

  hasEnoughData(profile: HistoricalStats): boolean {
    return profile.sampleCount >= this.config.minimumHistoricalSampleCount
  }

  private toRecord(
    task: BattlePlanTask,
    plan: BattlePlan,
    job: ProductionJob | undefined,
  ): HistoricalDurationRecord | null {
    if (!job) {
      return null
    }

    const completedDate = plan.date
    const standardMinutes = task.estimatedMinutes > 0 ? task.estimatedMinutes : job.estimatedMinutes[task.productionStep]
    const actualMinutes = this.resolveActualMinutes(task, job, completedDate)
    const usedStandardFallback = actualMinutes === null

    return {
      battlePlanTaskId: task.id,
      productionJobId: task.productionJobId,
      stage: task.productionStep,
      productType: job.productType,
      sizeRange: sizeRange(job),
      frameStyle: frameStyle(job),
      packagingType: packagingType(job),
      employeeId: plan.assignedWorkerId,
      dayOfWeek: toDayOfWeek(plan.date),
      batchSizeBand: batchSizeBand(plan),
      standardMinutes,
      actualMinutes,
      carryForward: task.carryForward,
      rework: task.carryForward && task.completed,
      completedDate,
      usedStandardFallback,
    }
  }

  private resolveActualMinutes(
    task: BattlePlanTask,
    job: ProductionJob,
    completedDate: string,
  ): number | null {
    const matchingLogs = this.activityLogs.filter((log) => {
      if (log.entityId !== task.id && log.entityId !== job.id) {
        return false
      }

      if (log.action !== 'STEP_COMPLETED' && log.action !== 'WORK_COMPLETED') {
        return false
      }

      const logDate = toIsoDate(new Date(log.occurredAt))
      return logDate === completedDate
    })

    for (const log of matchingLogs) {
      const minutes = parseNumberMetadata(log, 'actualMinutes')
      if (minutes !== null && minutes > 0) {
        return minutes
      }
    }

    return null
  }

  private buildExcludedData(records: HistoricalDurationRecord[]): string[] {
    const excluded: string[] = []
    const withMissing = records.filter((record) => record.actualMinutes === null).length
    if (withMissing > 0) {
      excluded.push(`${withMissing} samples missing actual minutes`) 
    }
    return excluded
  }
}
