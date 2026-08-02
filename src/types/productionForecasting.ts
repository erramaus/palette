import type { BattlePlanTask } from './battlePlans'
import type { ProductType, ProductionStepName } from './production'

export type ForecastConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA'

export interface ForecastReason {
  code: string
  description: string
  value?: string | number | boolean
  evidence?: string
}

export type DeadlineRiskLevel =
  | 'ON_TRACK'
  | 'WATCH'
  | 'AT_RISK'
  | 'HIGH_RISK'
  | 'LIKELY_LATE'
  | 'OVERDUE'

export type CarryForwardProbabilityBand = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'

export interface ForecastConfig {
  minimumHistoricalSampleCount: number
  confidenceHighThreshold: number
  confidenceMediumThreshold: number
  forecastBufferHours: number
  conservativePercentile: 75 | 80 | 85 | 90 | 95
  employeePerformanceWeight: number
  stageQueueWeight: number
  reworkAdjustment: number
  carryForwardWarningThresholdMinutes: number
  standardFallbackRatio: number
  weekendWorkingDays: number[]
  dailyWorkingMinutes: number
}

export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  minimumHistoricalSampleCount: 3,
  confidenceHighThreshold: 0.8,
  confidenceMediumThreshold: 0.55,
  forecastBufferHours: 8,
  conservativePercentile: 90,
  employeePerformanceWeight: 0.35,
  stageQueueWeight: 0.3,
  reworkAdjustment: 0.15,
  carryForwardWarningThresholdMinutes: 45,
  standardFallbackRatio: 1,
  weekendWorkingDays: [1, 2, 3, 4, 5],
  dailyWorkingMinutes: 420,
}

export interface HistoricalDurationRecord {
  battlePlanTaskId: string
  productionJobId: string
  stage: ProductionStepName
  productType: ProductType
  sizeRange: string
  frameStyle: string
  packagingType: string
  employeeId: string
  dayOfWeek: string
  batchSizeBand: string
  standardMinutes: number
  actualMinutes: number | null
  carryForward: boolean
  rework: boolean
  completedDate: string
  usedStandardFallback: boolean
}

export interface HistoricalStats {
  sampleCount: number
  medianActualMinutes: number | null
  averageActualMinutes: number | null
  p75ActualMinutes: number | null
  p90ActualMinutes: number | null
  standardMinutesMedian: number | null
  actualToStandardRatio: number | null
  reworkFrequency: number
  carryForwardFrequency: number
  missingActualTimes: number
  excludedData: string[]
}

export interface StageDurationProfile extends HistoricalStats {
  key: string
  stage: ProductionStepName
  productType?: ProductType
  sizeRange?: string
  frameStyle?: string
  packagingType?: string
  employeeId?: string
  dayOfWeek?: string
  batchSizeBand?: string
}

export interface EmployeePerformanceProfile extends HistoricalStats {
  employeeId: string
  employeeName: string
  primaryStages: ProductionStepName[]
}

export interface ProductTypePerformanceProfile extends HistoricalStats {
  productType: ProductType
  dominantStages: ProductionStepName[]
}

export interface StageDurationForecast {
  stage: ProductionStepName
  currentQueueCount: number
  queuedStandardMinutes: number
  predictedActualMinutes: number
  availableSkilledCapacityMinutes: number
  expectedQueueClearDate: string
  oldestItemAgeDays: number | null
  incomingWorkExpectedFromPriorStage: number
  backlogGrowthRisk: DeadlineRiskLevel
  confidence: ForecastConfidence
  reasons: ForecastReason[]
  dataQuality: {
    sampleSize: number
    missingActualTimes: number
    usedStandardFallback: boolean
    excludedData: string[]
  }
}

export interface CompletionTimeEstimate {
  workItemId: string
  orderNumber: string
  dueDate: string
  remainingRequiredStages: ProductionStepName[]
  remainingEstimatedMinutes: number
  optimisticDate: string
  expectedDate: string
  conservativeDate: string
  estimatedShipReadyDate: string
  expectedWaitingMinutes: number
  confidence: ForecastConfidence
  reasons: ForecastReason[]
  dataSourcesUsed: string[]
  historicalSampleSize: number
  missingActualTimes: number
  usedStandardFallback: boolean
  excludedData: string[]
}

export interface DeadlineForecast extends CompletionTimeEstimate {
  riskLevel: DeadlineRiskLevel
  recommendedAction: string
}

export interface CarryForwardPrediction {
  taskId: string
  workItemId: string
  orderNumber: string
  stage: ProductionStepName
  probabilityBand: CarryForwardProbabilityBand
  likelyCarryForwardMinutes: string
  reasons: ForecastReason[]
  recommendedAction: string
  confidence: ForecastConfidence
}

export interface WorkerFinishProjection {
  employeeId: string
  employeeName: string
  predictedFinishTime: string
  projectedOverloadMinutes: number
  projectedIdleMinutes: number
  unassignedCapacityMinutes: number
  likelyCarryForwardTaskIds: string[]
}

export interface ForecastCapacityRecommendation {
  id: string
  summary: string
  productionImpact: string
  estimatedMinutesAffected: number
  dueDatesProtected: string[]
  affectedEmployees: string[]
  confidence: ForecastConfidence
  supportingHistoricalEvidence: string[]
}

export interface ForecastAccuracySummary {
  comparedForecasts: number
  medianForecastErrorMinutes: number | null
  forecastBiasMinutes: number | null
  percentageWithinForecastRange: number | null
  falseRiskRate: number | null
  missedRiskRate: number | null
  missingDataCount: number
  status: 'READY' | 'INSUFFICIENT_DATA'
  reasons: string[]
}

export interface DashboardPredictiveSnapshot {
  likelyLateJobs: DeadlineForecast[]
  likelyCarryForwardOperations: CarryForwardPrediction[]
  probableBottleneckTomorrow?: StageDurationForecast
  projectedEarlyFinishWorkers: WorkerFinishProjection[]
  projectedOverCapacityWorkers: WorkerFinishProjection[]
  confidenceWarnings: string[]
}

export interface ProductionForecastResult {
  generatedAt: string
  forecastConfig: ForecastConfig
  deadlineForecasts: DeadlineForecast[]
  stageForecasts: StageDurationForecast[]
  carryForwardPredictions: CarryForwardPrediction[]
  workerFinishProjections: WorkerFinishProjection[]
  capacityRecommendations: ForecastCapacityRecommendation[]
  historicalProfiles: {
    stageProfiles: StageDurationProfile[]
    employeeProfiles: EmployeePerformanceProfile[]
    productTypeProfiles: ProductTypePerformanceProfile[]
  }
  forecastAccuracy: ForecastAccuracySummary
  dashboardSnapshot: DashboardPredictiveSnapshot
  dataQuality: {
    totalHistoricalSamples: number
    missingActualTimes: number
    usedStandardFallback: boolean
    excludedData: string[]
  }
}

export interface WorkItemForecastPanelData {
  status: 'READY' | 'INSUFFICIENT_DATA'
  forecast?: DeadlineForecast
  reasons: string[]
}

export interface HistoricalProfileLookupKey {
  stage: ProductionStepName
  productType: ProductType
  sizeRange: string
  frameStyle: string
  packagingType: string
  employeeId: string
  dayOfWeek: string
  batchSizeBand: string
}

export interface CarryForwardEvaluationContext {
  task: BattlePlanTask
  workerAvailableMinutes: number
  workerRemainingMinutes: number
  employeePerformanceRatio: number
  interruptionCount: number
  sequencePosition: number
  blockedDependency: boolean
}
