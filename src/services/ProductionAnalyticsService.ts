import type { AppActivityLog } from '../state/AppStateContext'
import type { BattlePlan } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import { PRODUCTION_STEP_NAMES } from '../types/production'
import {
  DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
  type DataQualityDescriptor,
  type DirectorWeeklyScorecard,
  type MetricBenchmark,
  type MetricTrend,
  type MetricTrendDirection,
  type OperatorWeeklyScorecard,
  PRODUCT_COHORTS,
  type ProductionAnalyticsTargets,
  type ProductionMetricDefinition,
  type ProductionStageSnapshot,
  type WeeklyProductionAnalyticsResult,
  type WeeklyProductionSnapshot,
} from '../types/productionAnalytics'

interface ProductionAnalyticsInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  activityLogs: AppActivityLog[]
  now?: Date
  targets?: Partial<ProductionAnalyticsTargets>
}

interface RawMetricSnapshot {
  onTimeCompletionRate: number | null
  scheduleAttainment: number | null
  firstPassQuality: number | null
  standardMinutesEarned: number
  finishedPieceThroughput: number
  medianLeadTimeDays: number | null
  carryForwardRate: number | null
  reworkRate: number | null
  blockedTimeMinutes: number
  capacityLoad: number | null
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

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

const startOfWeek = (value: Date): Date => {
  const date = startOfDay(value)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  return date
}

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null
  }

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

const safePercent = (numerator: number, denominator: number): number | null => {
  if (denominator <= 0) {
    return null
  }

  return (numerator / denominator) * 100
}

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0)

const round2 = (value: number | null): number | null => {
  if (value === null) {
    return null
  }

  return Math.round(value * 100) / 100
}

const blockedReasonKeywords: Array<{ reason: string; pattern: RegExp }> = [
  { reason: 'materials', pattern: /material|crate|supply/i },
  { reason: 'equipment', pattern: /equipment|printer|machine|repair/i },
  { reason: 'approval', pattern: /approval|approved/i },
  { reason: 'upstream dependency', pattern: /upstream|dependency|waiting on/i },
  { reason: 'customer', pattern: /customer|collector/i },
  { reason: 'Erin', pattern: /erin/i },
  { reason: 'staffing', pattern: /staff|coverage|absence/i },
]

const inferBlockedReason = (text: string): string => {
  const normalized = text.trim()
  for (const candidate of blockedReasonKeywords) {
    if (candidate.pattern.test(normalized)) {
      return candidate.reason
    }
  }

  return 'other'
}

export class ProductionAnalyticsService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly now: Date
  private readonly targets: ProductionAnalyticsTargets

  constructor(input: ProductionAnalyticsInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.now = input.now ?? new Date()
    this.targets = {
      ...DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
      ...input.targets,
    }
  }

  getWeeklyAnalytics(comparisonMode: 'PREVIOUS_WEEK' | 'ROLLING_4_WEEK' | 'BASELINE_8_WEEK' = 'PREVIOUS_WEEK'): WeeklyProductionAnalyticsResult {
    const currentWeekStart = startOfWeek(this.now)
    const currentWeek = this.buildWeeklySnapshot(currentWeekStart)
    const previousWeekStart = addDays(currentWeekStart, -7)
    const previousWeek = this.buildWeeklySnapshot(previousWeekStart)

    return {
      currentWeek,
      previousWeek,
      comparisonMode,
    }
  }

  getWeeklySnapshot(weekStartDate?: string): WeeklyProductionSnapshot {
    const base = weekStartDate ? parseLocalDate(weekStartDate) : startOfWeek(this.now)
    return this.buildWeeklySnapshot(base)
  }

  private buildWeeklySnapshot(weekStart: Date): WeeklyProductionSnapshot {
    const normalizedWeekStart = startOfDay(weekStart)
    const weekEnd = addDays(normalizedWeekStart, 6)
    const weekStartIso = toIsoDate(normalizedWeekStart)
    const weekEndIso = toIsoDate(weekEnd)

    const jobsDueThisWeek = this.productionJobs.filter((job) => {
      const dueDate = parseLocalDate(job.dueDate)
      return dueDate >= normalizedWeekStart && dueDate <= weekEnd
    })

    const plansThisWeek = this.battlePlans.filter((plan) => {
      const planDate = parseLocalDate(plan.date)
      return planDate >= normalizedWeekStart && planDate <= weekEnd
    })

    const raw = this.computeRawMetrics(jobsDueThisWeek, plansThisWeek)
    const benchmarks = this.buildBenchmarks()
    const definitions = this.buildMetricDefinitions(raw, benchmarks, jobsDueThisWeek, plansThisWeek, normalizedWeekStart)
    const stageSnapshots = this.buildStageSnapshots(jobsDueThisWeek, normalizedWeekStart)
    const operatorScorecards = this.buildOperatorScorecards(plansThisWeek)
    const directorScorecard = this.buildDirectorScorecard(raw, stageSnapshots, jobsDueThisWeek, plansThisWeek)

    const missingData = [
      'Explicit production start timestamps per job',
      'Inspection acceptance records for first-pass quality',
      'Actual productive labor minutes by operator',
      'Due-date snapshot history at completion time',
    ]

    return {
      id: `WEEKLY-SNAPSHOT-${weekStartIso}`,
      weekStartDate: weekStartIso,
      weekEndDate: weekEndIso,
      generatedAt: this.now.toISOString(),
      metricDefinitions: definitions,
      stageSnapshots,
      operatorScorecards,
      directorScorecard,
      dataQuality: {
        confidence: 0.66,
        missingData,
        excludedRecords: this.buildExcludedRecords(jobsDueThisWeek),
        calculationNotes: [
          'Standard minutes are sourced from ProductionJob estimatedMinutes and BattlePlan task estimates.',
          'Lead time uses inferred start from earliest weekly plan assignment when direct start timestamps are unavailable.',
        ],
      },
    }
  }

  private computeRawMetrics(
    jobsDueThisWeek: ProductionJob[],
    plansThisWeek: BattlePlan[],
  ): RawMetricSnapshot {
    const completedByShipReady = jobsDueThisWeek.filter((job) => job.steps.SHIPPED === 'COMPLETE').length
    const onTimeCompletionRate = safePercent(completedByShipReady, jobsDueThisWeek.length)

    const allTasks = plansThisWeek.flatMap((plan) => plan.tasks)
    const scheduledMinutes = sum(allTasks.map((task) => task.estimatedMinutes))
    const completedMinutes = sum(allTasks.filter((task) => task.completed).map((task) => task.estimatedMinutes))
    const scheduleAttainment = safePercent(completedMinutes, scheduledMinutes)

    const inspectedCompletedOps = allTasks.filter((task) => task.completed)
    const acceptedWithoutRework = inspectedCompletedOps.filter((task) => !task.carryForward)
    const firstPassQuality = safePercent(acceptedWithoutRework.length, inspectedCompletedOps.length)

    const standardMinutesEarned = sum(acceptedWithoutRework.map((task) => task.estimatedMinutes))

    const finishedPieceThroughput = new Set(
      jobsDueThisWeek
        .filter((job) => job.steps.SHIPPED === 'COMPLETE' || job.steps.SHIPPED === 'NOT_APPLICABLE')
        .map((job) => job.id),
    ).size

    const leadTimes = jobsDueThisWeek
      .map((job) => {
        const planDates = plansThisWeek
          .filter((plan) => plan.tasks.some((task) => task.productionJobId === job.id))
          .map((plan) => parseLocalDate(plan.date).getTime())

        if (planDates.length === 0) {
          return null
        }

        const inferredStart = new Date(Math.min(...planDates))
        const completionDate = job.steps.SHIPPED === 'COMPLETE' ? parseLocalDate(job.dueDate) : null

        if (!completionDate) {
          return null
        }

        return Math.max(0, (startOfDay(completionDate).getTime() - startOfDay(inferredStart).getTime()) / DAY_IN_MS)
      })
      .filter((value): value is number => value !== null)

    const medianLeadTimeDays = median(leadTimes)

    const carryForwardMinutes = sum(allTasks.filter((task) => task.carryForward).map((task) => task.estimatedMinutes))
    const carryForwardRate = safePercent(carryForwardMinutes, scheduledMinutes)

    const reworkMinutes = sum(allTasks.filter((task) => task.carryForward && task.completed).map((task) => task.estimatedMinutes))
    const reworkRate = safePercent(reworkMinutes, completedMinutes)

    const blockedJobs = jobsDueThisWeek.filter((job) => /waiting on|blocked|pending|hold/i.test(job.notes) || job.onHold)
    const blockedTimeMinutes = sum(
      blockedJobs.map((job) => {
        const currentStage = this.getCurrentWaitingStage(job)
        return currentStage ? job.estimatedMinutes[currentStage] : 0
      }),
    )

    const requiredStandardMinutes = sum(
      jobsDueThisWeek.map((job) => {
        const currentStage = this.getCurrentWaitingStage(job)
        if (!currentStage) {
          return 0
        }
        return job.estimatedMinutes[currentStage]
      }),
    )

    const availableSkilledMinutes = sum(
      this.employees
        .filter((employee) => employee.role === 'WORKER' && employee.active)
        .map((employee) => employee.defaultAvailableMinutes),
    )

    const capacityLoad = safePercent(requiredStandardMinutes, availableSkilledMinutes)

    return {
      onTimeCompletionRate: round2(onTimeCompletionRate),
      scheduleAttainment: round2(scheduleAttainment),
      firstPassQuality: round2(firstPassQuality),
      standardMinutesEarned,
      finishedPieceThroughput,
      medianLeadTimeDays: round2(medianLeadTimeDays),
      carryForwardRate: round2(carryForwardRate),
      reworkRate: round2(reworkRate),
      blockedTimeMinutes,
      capacityLoad: round2(capacityLoad),
    }
  }

  private buildBenchmarks(): Record<string, MetricBenchmark> {
    return {
      ON_TIME_COMPLETION_RATE: {
        target: this.targets.onTimeCompletionRateTarget,
        unit: 'PERCENT',
        higherIsBetter: true,
        startingTarget: true,
      },
      SCHEDULE_ATTAINMENT: {
        target: this.targets.scheduleAttainmentTarget,
        unit: 'PERCENT',
        higherIsBetter: true,
        startingTarget: true,
      },
      FIRST_PASS_QUALITY: {
        target: this.targets.firstPassQualityTarget,
        unit: 'PERCENT',
        higherIsBetter: true,
        startingTarget: true,
      },
      STANDARD_MINUTES_EARNED: {
        target: 0,
        unit: 'MINUTES',
        higherIsBetter: true,
        startingTarget: true,
      },
      FINISHED_PIECE_THROUGHPUT: {
        target: 0,
        unit: 'COUNT',
        higherIsBetter: true,
        startingTarget: true,
      },
      MEDIAN_LEAD_TIME: {
        target: 5,
        unit: 'DAYS',
        higherIsBetter: false,
        startingTarget: true,
      },
      CARRY_FORWARD_RATE: {
        target: this.targets.carryForwardRateMax,
        unit: 'PERCENT',
        higherIsBetter: false,
        startingTarget: true,
      },
      REWORK_RATE: {
        target: this.targets.reworkRateMax,
        unit: 'PERCENT',
        higherIsBetter: false,
        startingTarget: true,
      },
      BLOCKED_TIME: {
        target: 0,
        unit: 'MINUTES',
        higherIsBetter: false,
        startingTarget: true,
      },
      CAPACITY_LOAD: {
        target: this.targets.capacityWarningPercent,
        warningThreshold: this.targets.capacityWarningPercent,
        overloadThreshold: this.targets.capacityOverloadPercent,
        unit: 'PERCENT',
        higherIsBetter: false,
        startingTarget: true,
      },
    }
  }

  private buildMetricDefinitions(
    raw: RawMetricSnapshot,
    benchmarks: Record<string, MetricBenchmark>,
    jobsDueThisWeek: ProductionJob[],
    plansThisWeek: BattlePlan[],
    weekStart: Date,
  ): ProductionMetricDefinition[] {
    const priorRaw = this.computeRawMetrics(
      this.productionJobs.filter((job) => {
        const due = parseLocalDate(job.dueDate)
        const previousWeekStart = addDays(weekStart, -7)
        const previousWeekEnd = addDays(previousWeekStart, 6)
        return due >= previousWeekStart && due <= previousWeekEnd
      }),
      this.battlePlans.filter((plan) => {
        const planDate = parseLocalDate(plan.date)
        const previousWeekStart = addDays(weekStart, -7)
        const previousWeekEnd = addDays(previousWeekStart, 6)
        return planDate >= previousWeekStart && planDate <= previousWeekEnd
      }),
    )

    const metricSpecs: Array<{
      key: ProductionMetricDefinition['key']
      label: string
      description: string
      formula: string
      value: number | null
      previousValue: number | null
      benchmark: MetricBenchmark
    }> = [
      {
        key: 'ON_TIME_COMPLETION_RATE',
        label: 'On-Time Completion Rate',
        description: 'Jobs completed by ship-ready due date divided by jobs due in the week.',
        formula: 'jobs completed by internal ship-ready due date / jobs due that week',
        value: raw.onTimeCompletionRate,
        previousValue: priorRaw.onTimeCompletionRate,
        benchmark: benchmarks.ON_TIME_COMPLETION_RATE,
      },
      {
        key: 'SCHEDULE_ATTAINMENT',
        label: 'Production Schedule Attainment',
        description: 'Standard production minutes completed as planned divided by standard minutes scheduled.',
        formula: 'standard production minutes completed as planned / standard production minutes scheduled',
        value: raw.scheduleAttainment,
        previousValue: priorRaw.scheduleAttainment,
        benchmark: benchmarks.SCHEDULE_ATTAINMENT,
      },
      {
        key: 'FIRST_PASS_QUALITY',
        label: 'First-Pass Quality',
        description: 'Operations accepted without rework divided by inspected completed operations.',
        formula: 'operations accepted without rework / inspected completed operations',
        value: raw.firstPassQuality,
        previousValue: priorRaw.firstPassQuality,
        benchmark: benchmarks.FIRST_PASS_QUALITY,
      },
      {
        key: 'STANDARD_MINUTES_EARNED',
        label: 'Standard Production Minutes Earned',
        description: 'Sum of standard minutes for accepted completed operations.',
        formula: 'sum(standard minutes for accepted completed operations)',
        value: raw.standardMinutesEarned,
        previousValue: priorRaw.standardMinutesEarned,
        benchmark: benchmarks.STANDARD_MINUTES_EARNED,
      },
      {
        key: 'FINISHED_PIECE_THROUGHPUT',
        label: 'Finished-Piece Throughput',
        description: 'Count of unique pieces leaving production.',
        formula: 'count(unique pieces leaving production)',
        value: raw.finishedPieceThroughput,
        previousValue: priorRaw.finishedPieceThroughput,
        benchmark: benchmarks.FINISHED_PIECE_THROUGHPUT,
      },
      {
        key: 'MEDIAN_LEAD_TIME',
        label: 'Median Production Lead Time',
        description: 'Median time from production start to ship-ready date.',
        formula: 'median(ship-ready date - production start date)',
        value: raw.medianLeadTimeDays,
        previousValue: priorRaw.medianLeadTimeDays,
        benchmark: benchmarks.MEDIAN_LEAD_TIME,
      },
      {
        key: 'CARRY_FORWARD_RATE',
        label: 'Carry-Forward Rate',
        description: 'Scheduled minutes carried forward divided by scheduled standard minutes.',
        formula: 'scheduled standard minutes carried forward / scheduled standard minutes',
        value: raw.carryForwardRate,
        previousValue: priorRaw.carryForwardRate,
        benchmark: benchmarks.CARRY_FORWARD_RATE,
      },
      {
        key: 'REWORK_RATE',
        label: 'Rework Rate',
        description: 'Rework standard minutes divided by completed standard minutes.',
        formula: 'rework standard minutes / completed standard minutes',
        value: raw.reworkRate,
        previousValue: priorRaw.reworkRate,
        benchmark: benchmarks.REWORK_RATE,
      },
      {
        key: 'BLOCKED_TIME',
        label: 'Blocked Time',
        description: 'Minutes lost to material, equipment, approval, dependency, customer, Erin, staffing, or other.',
        formula: 'sum(standard minutes for blocked jobs in current waiting stage)',
        value: raw.blockedTimeMinutes,
        previousValue: priorRaw.blockedTimeMinutes,
        benchmark: benchmarks.BLOCKED_TIME,
      },
      {
        key: 'CAPACITY_LOAD',
        label: 'Capacity Load',
        description: 'Required standard minutes divided by available skilled minutes.',
        formula: 'required standard minutes / available skilled minutes',
        value: raw.capacityLoad,
        previousValue: priorRaw.capacityLoad,
        benchmark: benchmarks.CAPACITY_LOAD,
      },
    ]

    return metricSpecs.map((spec) => {
      const trend = this.buildTrend(spec.value, spec.previousValue, spec.benchmark.higherIsBetter, spec.benchmark)
      return {
        key: spec.key,
        label: spec.label,
        description: spec.description,
        formula: spec.formula,
        benchmark: spec.benchmark,
        trend,
        valueByCohort: this.calculateCohortMetricValues(spec.key, jobsDueThisWeek, plansThisWeek),
        dataQuality: this.buildMetricDataQuality(spec.key, jobsDueThisWeek),
      }
    })
  }

  private buildTrend(
    currentWeek: number | null,
    previousWeek: number | null,
    higherIsBetter: boolean,
    benchmark: MetricBenchmark,
  ): MetricTrend {
    const absoluteChange = currentWeek !== null && previousWeek !== null ? currentWeek - previousWeek : null
    let percentageChange: number | null = null
    if (absoluteChange !== null && previousWeek !== null && previousWeek !== 0) {
      percentageChange = (absoluteChange / previousWeek) * 100
    }

    let direction: MetricTrendDirection = 'INSUFFICIENT_DATA'
    if (absoluteChange !== null) {
      const improving = higherIsBetter ? absoluteChange > 0 : absoluteChange < 0
      const stable = Math.abs(absoluteChange) < 0.01
      direction = stable ? 'STABLE' : improving ? 'IMPROVING' : 'DECLINING'
    }

    let warningStatus: MetricTrend['warningStatus'] = 'INSUFFICIENT_DATA'
    if (currentWeek !== null) {
      const meetsTarget = higherIsBetter ? currentWeek >= benchmark.target : currentWeek <= benchmark.target
      warningStatus = meetsTarget ? 'OK' : 'WATCH'

      if (!meetsTarget && benchmark.overloadThreshold !== undefined) {
        const alert = higherIsBetter
          ? currentWeek < benchmark.overloadThreshold
          : currentWeek > benchmark.overloadThreshold
        if (alert) {
          warningStatus = 'ALERT'
        }
      }
    }

    return {
      currentWeek,
      previousWeek,
      absoluteChange: round2(absoluteChange),
      percentageChange: round2(percentageChange),
      rolling4WeekAverage: currentWeek,
      baseline8Week: previousWeek,
      direction,
      warningStatus,
    }
  }

  private calculateCohortMetricValues(
    key: ProductionMetricDefinition['key'],
    jobs: ProductionJob[],
    plans: BattlePlan[],
  ): Record<string, number | null> {
    const values: Record<string, number | null> = {}

    for (const cohort of PRODUCT_COHORTS) {
      const cohortJobs = jobs.filter((job) => cohort.matches(job.productType))
      const cohortTasks = plans
        .flatMap((plan) => plan.tasks)
        .filter((task) => cohortJobs.some((job) => job.id === task.productionJobId))

      if (cohortJobs.length === 0 && cohort.key !== 'ALL') {
        values[cohort.label] = null
        continue
      }

      if (key === 'MEDIAN_LEAD_TIME') {
        const leadTimes = cohortJobs
          .map((job) => {
            const assignedPlanDates = plans
              .filter((plan) => plan.tasks.some((task) => task.productionJobId === job.id))
              .map((plan) => parseLocalDate(plan.date).getTime())
            if (assignedPlanDates.length === 0 || job.steps.SHIPPED !== 'COMPLETE') {
              return null
            }

            const start = new Date(Math.min(...assignedPlanDates))
            const finish = parseLocalDate(job.dueDate)
            return Math.max(0, (startOfDay(finish).getTime() - startOfDay(start).getTime()) / DAY_IN_MS)
          })
          .filter((value): value is number => value !== null)

        values[cohort.label] = round2(median(leadTimes))
        continue
      }

      if (key === 'STANDARD_MINUTES_EARNED') {
        values[cohort.label] = sum(cohortTasks.filter((task) => task.completed && !task.carryForward).map((task) => task.estimatedMinutes))
        continue
      }

      if (key === 'FINISHED_PIECE_THROUGHPUT') {
        values[cohort.label] = new Set(cohortJobs.filter((job) => job.steps.SHIPPED === 'COMPLETE').map((job) => job.id)).size
        continue
      }

      const defaultValue = cohortTasks.length > 0 ? sum(cohortTasks.map((task) => task.estimatedMinutes)) : null
      values[cohort.label] = defaultValue
    }

    return values
  }

  private buildMetricDataQuality(
    key: ProductionMetricDefinition['key'],
    jobsDueThisWeek: ProductionJob[],
  ): DataQualityDescriptor {
    const missingData: string[] = []
    const calculationNotes: string[] = []
    let confidence = 0.8

    if (key === 'FIRST_PASS_QUALITY') {
      missingData.push('Inspection acceptance status per operation')
      calculationNotes.push('Carry-forward marker is used as proxy for rework acceptance.')
      confidence = 0.62
    }

    if (key === 'MEDIAN_LEAD_TIME') {
      missingData.push('Explicit production start timestamps')
      calculationNotes.push('Earliest weekly plan assignment date used as inferred production start.')
      confidence = 0.55
    }

    if (key === 'BLOCKED_TIME') {
      missingData.push('Actual blocked duration timestamps')
      calculationNotes.push('Current-stage standard minutes are used as blocked-time proxy.')
      confidence = 0.58
    }

    if (jobsDueThisWeek.length === 0) {
      missingData.push('No jobs due in selected week')
      confidence = Math.min(confidence, 0.4)
    }

    return {
      confidence,
      missingData,
      excludedRecords: this.buildExcludedRecords(jobsDueThisWeek),
      calculationNotes,
    }
  }

  private buildStageSnapshots(jobsDueThisWeek: ProductionJob[], weekStart: Date): ProductionStageSnapshot[] {
    const thresholdDays = 2
    return PRODUCTION_STEP_NAMES.map((stage) => {
      const stageJobs = jobsDueThisWeek.filter((job) => this.getCurrentWaitingStage(job) === stage)
      const waitingMinutes = sum(stageJobs.map((job) => job.estimatedMinutes[stage]))

      const ageDays = stageJobs.map((job) => {
        const dueDays = (startOfDay(parseLocalDate(job.dueDate)).getTime() - startOfDay(this.now).getTime()) / DAY_IN_MS
        return Math.max(0, -dueDays)
      })

      const oldestJob = stageJobs
        .map((job) => ({
          id: job.id,
          orderNumber: job.orderNumber,
          age: Math.max(0, -((startOfDay(parseLocalDate(job.dueDate)).getTime() - startOfDay(weekStart).getTime()) / DAY_IN_MS)),
        }))
        .sort((left, right) => right.age - left.age)[0]

      const itemsAboveThreshold = ageDays.filter((age) => age >= thresholdDays).length

      return {
        stage,
        activePieceCount: stageJobs.length,
        totalStandardMinutesWaiting: waitingMinutes,
        medianAgeDaysInStage: round2(median(ageDays)),
        oldestWorkItemId: oldestJob?.id,
        oldestWorkItemOrderNumber: oldestJob?.orderNumber,
        itemsAboveStageAgeThreshold: itemsAboveThreshold,
        dataQuality: {
          confidence: 0.64,
          missingData: ['Stage entered-at timestamps'],
          excludedRecords: [],
          calculationNotes: ['Stage age approximated from due-date pressure rather than true entered-at timestamps.'],
        },
      }
    })
  }

  private buildOperatorScorecards(plansThisWeek: BattlePlan[]): OperatorWeeklyScorecard[] {
    const workers = this.employees.filter((employee) => employee.role === 'WORKER' && employee.active)

    return workers.map((worker) => {
      const plans = plansThisWeek.filter((plan) => plan.assignedWorkerId === worker.id)
      const tasks = plans.flatMap((plan) => plan.tasks)
      const plannedMinutes = sum(tasks.map((task) => task.estimatedMinutes))
      const completedMinutes = sum(tasks.filter((task) => task.completed).map((task) => task.estimatedMinutes))
      const acceptedMinutes = sum(tasks.filter((task) => task.completed && !task.carryForward).map((task) => task.estimatedMinutes))
      const carryForwardMinutes = sum(tasks.filter((task) => task.carryForward).map((task) => task.estimatedMinutes))
      const reworkMinutes = sum(tasks.filter((task) => task.carryForward && task.completed).map((task) => task.estimatedMinutes))

      const finishedPieces = new Set(
        this.productionJobs
          .filter((job) => job.assignedWorkerId === worker.id && job.steps.SHIPPED === 'COMPLETE')
          .map((job) => job.id),
      ).size

      const blockedMinutes = sum(
        this.productionJobs
          .filter((job) => job.assignedWorkerId === worker.id && /waiting on|blocked|hold/i.test(job.notes))
          .map((job) => {
            const stage = this.getCurrentWaitingStage(job)
            return stage ? job.estimatedMinutes[stage] : 0
          }),
      )

      const firstPassQuality = safePercent(
        tasks.filter((task) => task.completed && !task.carryForward).length,
        tasks.filter((task) => task.completed).length,
      )

      const productMix = tasks.reduce<Record<string, number>>((acc, task) => {
        const productType = this.productionJobs.find((job) => job.id === task.productionJobId)?.productType ?? 'UNKNOWN'
        acc[productType] = (acc[productType] ?? 0) + task.estimatedMinutes
        return acc
      }, {})

      return {
        employeeId: worker.id,
        employeeName: worker.name,
        standardMinutesEarned: acceptedMinutes,
        productiveMinutes: null,
        laborEfficiency: null,
        scheduleAttainment: round2(safePercent(completedMinutes, plannedMinutes)),
        firstPassQuality: round2(firstPassQuality),
        finishedPieces,
        carryForwardMinutes,
        reworkMinutes,
        blockedMinutes,
        plannedMinutes,
        completedMinutes,
        productMix,
        assignedWorkloadMinutes: plannedMinutes,
        approvedNonProductionMinutes: 0,
        trainingOrMeetingMinutes: 0,
        dataQuality: {
          confidence: 0.6,
          missingData: ['Actual productive labor minutes', 'Approved non-production time entries', 'Training/meeting time entries'],
          excludedRecords: [],
          calculationNotes: ['Labor efficiency omitted when actual productive minutes are unavailable.'],
        },
      }
    })
  }

  private buildDirectorScorecard(
    raw: RawMetricSnapshot,
    stageSnapshots: ProductionStageSnapshot[],
    jobsDueThisWeek: ProductionJob[],
    plansThisWeek: BattlePlan[],
  ): DirectorWeeklyScorecard {
    const atRiskBacklog = jobsDueThisWeek.filter((job) => job.dueStatus === 'AT_RISK').length
    const overdueBacklog = jobsDueThisWeek.filter((job) => job.dueStatus === 'OVERDUE').length

    const workers = this.employees.filter((employee) => employee.role === 'WORKER' && employee.active)
    const imbalanceMinutes = sum(
      workers.map((worker) => {
        const planned = sum(
          plansThisWeek
            .filter((plan) => plan.assignedWorkerId === worker.id)
            .flatMap((plan) => plan.tasks)
            .map((task) => task.estimatedMinutes),
        )
        return Math.abs(planned - worker.defaultAvailableMinutes)
      }),
    )

    const bottleneckStage = [...stageSnapshots]
      .sort((left, right) => right.totalStandardMinutesWaiting - left.totalStandardMinutesWaiting)[0]
      ?.stage

    const finishedPieces = raw.finishedPieceThroughput
    const standardHoursEarned = round2(raw.standardMinutesEarned / 60) ?? 0

    const particlesHandled = round2(
      sum(
        jobsDueThisWeek.map((job) => job.width * job.height),
      ),
    )

    return {
      departmentOnTimeCompletion: raw.onTimeCompletionRate,
      departmentScheduleAttainment: raw.scheduleAttainment,
      departmentFirstPassQuality: raw.firstPassQuality,
      finishedPieceThroughput: finishedPieces,
      standardHoursEarned,
      medianLeadTimeDays: raw.medianLeadTimeDays,
      atRiskBacklog,
      overdueBacklog,
      carryForwardHours: round2((raw.carryForwardRate ?? 0) * 0.01 * (sum(plansThisWeek.flatMap((plan) => plan.tasks).map((task) => task.estimatedMinutes)) / 60)) ?? 0,
      reworkHours: round2((raw.reworkRate ?? 0) * 0.01 * (sum(plansThisWeek.flatMap((plan) => plan.tasks).filter((task) => task.completed).map((task) => task.estimatedMinutes)) / 60)) ?? 0,
      capacityImbalanceMinutes: imbalanceMinutes,
      bottleneckStage,
      vsd: raw.scheduleAttainment,
      particlesHandled,
      dataQuality: {
        confidence: 0.61,
        missingData: ['Business-defined VSD measure', 'Particles handled event logs'],
        excludedRecords: [],
        calculationNotes: ['VSD is proxied from schedule attainment until dedicated VSD source is connected.'],
      },
    }
  }

  private getCurrentWaitingStage(job: ProductionJob): ProductionStepName | undefined {
    return PRODUCTION_STEP_NAMES.find((stage) => job.steps[stage] === 'WAITING')
  }

  private buildExcludedRecords(jobs: ProductionJob[]): string[] {
    return jobs
      .filter((job) => job.onHold)
      .map((job) => `${job.orderNumber} excluded because job is on hold`)
  }

  getBlockedTimeByReasonForWeek(weekStartDate?: string): Record<string, number> {
    const weekStart = weekStartDate ? parseLocalDate(weekStartDate) : startOfWeek(this.now)
    const weekEnd = addDays(weekStart, 6)
    const jobsDueThisWeek = this.productionJobs.filter((job) => {
      const dueDate = parseLocalDate(job.dueDate)
      return dueDate >= weekStart && dueDate <= weekEnd
    })

    return jobsDueThisWeek.reduce<Record<string, number>>((acc, job) => {
      if (!/waiting on|blocked|hold|pending|material|approval|customer|erin|staff/i.test(job.notes) && !job.onHold) {
        return acc
      }

      const reason = inferBlockedReason(job.notes)
      const stage = this.getCurrentWaitingStage(job)
      const minutes = stage ? job.estimatedMinutes[stage] : 0
      acc[reason] = (acc[reason] ?? 0) + minutes
      return acc
    }, {})
  }
}
