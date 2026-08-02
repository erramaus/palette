import type { ProductionStepName } from './production'

export type IntelligenceAlertType =
  | 'OVERDUE'
  | 'DUE_TODAY'
  | 'DUE_SOON'
  | 'DEADLINE_RISK'
  | 'BLOCKED_WORK'
  | 'MISSING_DEPENDENCY'
  | 'CAPACITY_OVERLOAD'
  | 'CAPACITY_AVAILABLE'
  | 'BOTTLENECK_RISK'
  | 'CARRY_FORWARD_RISK'
  | 'QUALITY_RISK'
  | 'MATERIAL_RISK'
  | 'UNASSIGNED_WORK'
  | 'IDLE_WORKER'
  | 'SHIPMENT_RISK'

export type RiskLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type RecommendationConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export interface RecommendationReason {
  code: string
  description: string
  value?: number | string | boolean
  threshold?: number | string
}

export interface IntelligenceAlert {
  id: string
  type: IntelligenceAlertType
  riskLevel: RiskLevel
  title: string
  explanation: string
  reasons: RecommendationReason[]
  affectedWorkItemIds: string[]
  affectedEmployeeIds: string[]
  supportingData: Record<string, string | number | boolean | null>
  generatedAt: string
  confidence: RecommendationConfidence
  missingInputs: string[]
  reviewed?: boolean
  dismissed?: boolean
}

export interface IntelligenceRecommendation {
  id: string
  title: string
  shortExplanation: string
  supportingData: Record<string, string | number | boolean | null>
  affectedWorkItemIds: string[]
  affectedEmployeeIds: string[]
  priority: RiskLevel
  suggestedAction: string
  generatedAt: string
  confidence: RecommendationConfidence
  reasons: RecommendationReason[]
  sourceAlertIds: string[]
  actionTarget: {
    kind: 'WORK_ITEM' | 'BATTLE_PLAN'
    id?: string
  }
}

export interface DeadlineRisk {
  workItemId: string
  orderNumber: string
  riskLevel: RiskLevel
  estimatedCompletionDate: string
  minutesRequired: number
  availableMinutesBeforeDue: number
  reasons: RecommendationReason[]
  recommendedAction: string
  confidence: RecommendationConfidence
  missingInputs: string[]
}

export interface WorkerForecast {
  employeeId: string
  employeeName: string
  availableMinutesToday: number
  assignedMinutes: number
  completedMinutes: number
  remainingMinutes: number
  utilizationPercentage: number
  projectedFinishTime?: string
  likelyIdleMinutes: number
  overCapacityMinutes: number
  carryForwardRisk: RiskLevel
  nextRecommendedOperation?: ProductionStepName
  reasons: RecommendationReason[]
}

export interface BottleneckForecast {
  stage: ProductionStepName
  activeWorkItems: number
  estimatedMinutesWaiting: number
  availableSkilledMinutes: number
  oldestWorkItemAgeDays?: number
  incomingWorkFromPreviousStage: number
  capacityLoadPercentage: number
  projectedQueueGrowth: number
  riskLevel: RiskLevel
  reasons: RecommendationReason[]
}

export interface CapacityForecast {
  employeeId: string
  employeeName: string
  availableMinutes: number
  assignedMinutes: number
  completedMinutes: number
  remainingMinutes: number
  utilizationPercentage: number
  capacityGapMinutes: number
  status: 'OVERLOADED' | 'AVAILABLE' | 'BALANCED'
  recommendation?: string
  reasons: RecommendationReason[]
}

export interface ShipmentRisk {
  workItemId: string
  orderNumber: string
  dueDate: string
  remainingShippingMinutes: number
  availableMinutesBeforeDue: number
  riskLevel: RiskLevel
  reasons: RecommendationReason[]
}

export interface MorningBrief {
  dueToday: number
  overdue: number
  atRisk: number
  blocked: number
  shipmentsToday: number
  workerCapacity: {
    availableMinutes: number
    assignedMinutes: number
    utilizationPercentage: number
  }
  likelyBottleneck?: BottleneckForecast
  topRecommendations: IntelligenceRecommendation[]
}

export interface EndOfDaySummary {
  completedWorkItems: number
  completedStandardMinutes: number
  plannedMinutes: number
  completedMinutes: number
  carryForwardWorkItems: number
  newOverdueItems: number
  blockedItems: number
  qualityIssues: number
  topRisksTomorrow: DeadlineRisk[]
}

export interface ProductionForecast {
  generatedAt: string
  alerts: IntelligenceAlert[]
  recommendations: IntelligenceRecommendation[]
  deadlineRisks: DeadlineRisk[]
  workerForecasts: WorkerForecast[]
  bottleneckForecasts: BottleneckForecast[]
  capacityForecasts: CapacityForecast[]
  shipmentRisks: ShipmentRisk[]
}

export interface ProductionIntelligenceConfig {
  dueSoonDays: number
  stageAgeThresholdDays: number
  capacityWarningPercentage: number
  overloadPercentage: number
  carryForwardWarningCount: number
  qualityWarningThreshold: number
  bottleneckQueueThreshold: number
  minimumConfidenceThreshold: number
}
