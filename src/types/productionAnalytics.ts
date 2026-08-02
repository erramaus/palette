import type { ProductionStepName, ProductType } from './production'

export type MetricTrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA'

export interface MetricBenchmark {
  target: number
  warningThreshold?: number
  overloadThreshold?: number
  unit: 'PERCENT' | 'MINUTES' | 'HOURS' | 'COUNT' | 'DAYS'
  higherIsBetter: boolean
  startingTarget: boolean
}

export interface DataQualityDescriptor {
  confidence: number
  missingData: string[]
  excludedRecords: string[]
  calculationNotes: string[]
}

export interface MetricTrend {
  currentWeek: number | null
  previousWeek: number | null
  absoluteChange: number | null
  percentageChange: number | null
  rolling4WeekAverage: number | null
  baseline8Week: number | null
  direction: MetricTrendDirection
  warningStatus: 'OK' | 'WATCH' | 'ALERT' | 'INSUFFICIENT_DATA'
}

export interface ProductionMetricDefinition {
  key:
    | 'ON_TIME_COMPLETION_RATE'
    | 'SCHEDULE_ATTAINMENT'
    | 'FIRST_PASS_QUALITY'
    | 'STANDARD_MINUTES_EARNED'
    | 'FINISHED_PIECE_THROUGHPUT'
    | 'MEDIAN_LEAD_TIME'
    | 'CARRY_FORWARD_RATE'
    | 'REWORK_RATE'
    | 'BLOCKED_TIME'
    | 'CAPACITY_LOAD'
  label: string
  description: string
  formula: string
  benchmark: MetricBenchmark
  trend: MetricTrend
  valueByCohort: Record<string, number | null>
  dataQuality: DataQualityDescriptor
}

export interface ProductionStageSnapshot {
  stage: ProductionStepName
  activePieceCount: number
  totalStandardMinutesWaiting: number
  medianAgeDaysInStage: number | null
  oldestWorkItemId?: string
  oldestWorkItemOrderNumber?: string
  itemsAboveStageAgeThreshold: number
  dataQuality: DataQualityDescriptor
}

export interface OperatorWeeklyScorecard {
  employeeId: string
  employeeName: string
  standardMinutesEarned: number
  productiveMinutes: number | null
  laborEfficiency: number | null
  scheduleAttainment: number | null
  firstPassQuality: number | null
  finishedPieces: number
  carryForwardMinutes: number
  reworkMinutes: number
  blockedMinutes: number
  plannedMinutes: number
  completedMinutes: number
  productMix: Record<string, number>
  assignedWorkloadMinutes: number
  approvedNonProductionMinutes: number
  trainingOrMeetingMinutes: number
  dataQuality: DataQualityDescriptor
}

export interface DirectorWeeklyScorecard {
  departmentOnTimeCompletion: number | null
  departmentScheduleAttainment: number | null
  departmentFirstPassQuality: number | null
  finishedPieceThroughput: number
  standardHoursEarned: number
  medianLeadTimeDays: number | null
  atRiskBacklog: number
  overdueBacklog: number
  carryForwardHours: number
  reworkHours: number
  capacityImbalanceMinutes: number
  bottleneckStage?: ProductionStepName
  vsd: number | null
  particlesHandled: number | null
  dataQuality: DataQualityDescriptor
}

export interface WeeklyProductionSnapshot {
  id: string
  weekStartDate: string
  weekEndDate: string
  generatedAt: string
  metricDefinitions: ProductionMetricDefinition[]
  stageSnapshots: ProductionStageSnapshot[]
  operatorScorecards: OperatorWeeklyScorecard[]
  directorScorecard: DirectorWeeklyScorecard
  dataQuality: DataQualityDescriptor
}

export interface WeeklyProductionAnalyticsResult {
  currentWeek: WeeklyProductionSnapshot
  previousWeek: WeeklyProductionSnapshot | null
  comparisonMode: 'PREVIOUS_WEEK' | 'ROLLING_4_WEEK' | 'BASELINE_8_WEEK'
}

export interface ProductionAnalyticsTargets {
  onTimeCompletionRateTarget: number
  scheduleAttainmentTarget: number
  firstPassQualityTarget: number
  carryForwardRateMax: number
  reworkRateMax: number
  capacityWarningPercent: number
  capacityOverloadPercent: number
}

export const DEFAULT_PRODUCTION_ANALYTICS_TARGETS: ProductionAnalyticsTargets = {
  onTimeCompletionRateTarget: 95,
  scheduleAttainmentTarget: 90,
  firstPassQualityTarget: 95,
  carryForwardRateMax: 10,
  reworkRateMax: 5,
  capacityWarningPercent: 90,
  capacityOverloadPercent: 100,
}

export const PRODUCT_COHORTS: Array<{
  key: 'ALL' | 'ORIGINAL' | 'TEXTURED_REPLICA_3D' | 'CANVAS' | 'PAPER' | 'GALLERY_INVENTORY' | 'RESTORATION'
  label: string
  matches: (productType: ProductType) => boolean
}> = [
  { key: 'ALL', label: 'All Work', matches: () => true },
  { key: 'ORIGINAL', label: 'Originals', matches: (type) => type === 'ORIGINAL' },
  {
    key: 'TEXTURED_REPLICA_3D',
    label: '3D Textured Replicas',
    matches: (type) => type === 'TEXTURED_REPLICA_3D',
  },
  { key: 'CANVAS', label: 'Canvas', matches: (type) => type === 'CANVAS' },
  { key: 'PAPER', label: 'Paper', matches: () => false },
  { key: 'GALLERY_INVENTORY', label: 'Gallery Inventory', matches: (type) => type === 'GALLERY_INVENTORY' },
  { key: 'RESTORATION', label: 'Restoration', matches: () => false },
]
