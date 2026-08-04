import type { BattlePlanTask } from './battlePlans'
import type { ForecastConfidence } from './productionForecasting'
import type { ProductType, ProductionStepName } from './production'

export interface OptimizationReason {
  code: string
  description: string
  value?: string | number | boolean
}

export interface OptimizationWarning {
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  code: string
  message: string
  affectedWorkItemIds: string[]
}

export interface OptimizationConstraint {
  keepCurrentAssignments: boolean
  allowOvertime: boolean
  overtimeLimitMinutes: number
  excludedEmployeeIds: string[]
  protectedWorkItemIds: string[]
  prioritizeShipping: boolean
  prioritizeOriginals: boolean
  capOperationSwitching: number
  preserveLockedWork: boolean
  reserveEmergencyMinutes: number
  changeEmployeeAvailability: Record<string, number>
  prioritizeDepartment?: string
  scenarioMode: 'NONE' | 'DANIEL_ABSENT' | 'PRINTER_DOWN' | 'RUSH_ORDER' | 'OVERTIME_ALLOWED' | 'MOULDING_TOMORROW'
}

export interface OptimizationWeights {
  deadlineUrgency: number
  workItemPriority: number
  bottleneckRelief: number
  setupReduction: number
  workloadBalance: number
  carryForwardReduction: number
  qualityHistory: number
  materialReadiness: number
  employeeContinuity: number
  overtimePenalty: number
}

export interface EmployeeSkillProfile {
  employeeId: string
  employeeName: string
  skills: ProductionStepName[]
  qualityScore: number
  reworkScore: number
  carryForwardScore: number
  historicalPerformanceRatio: number
}

export interface OperationCompatibility {
  workItemId: string
  operation: ProductionStepName
  setupFamilyId: string
  compatibilityScore: number
  reasons: OptimizationReason[]
}

export interface SetupFamily {
  id: string
  name: string
  operation: ProductionStepName
  frameStyle?: string
  materialType?: string
  packagingType?: string
  workstation?: string
}

export interface OptimizationScoreBreakdown {
  totalScore: number
  deadlineUrgencyScore: number
  priorityScore: number
  bottleneckScore: number
  setupScore: number
  workloadBalanceScore: number
  carryForwardScore: number
  qualityScore: number
  materialScore: number
  continuityScore: number
  overtimePenaltyScore: number
}

export interface OptimizedOperationGroup {
  id: string
  operation: ProductionStepName
  setupFamily: SetupFamily
  workItemIds: string[]
  workItemNumbers: string[]
  estimatedGroupMinutes: number
  setupMinutes: number
  executionMinutes: number
  cleanupMinutes: number
  switchingCostMinutes: number
  expectedInterruptionMinutes: number
  estimateSource: 'HISTORICAL_MEDIAN' | 'PRODUCT_OPERATION_PROFILE' | 'EMPLOYEE_ADJUSTED' | 'STANDARD_FALLBACK'
  materialStatus: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE' | 'UNKNOWN' | 'NEEDS_REVIEW'
  deadlineImpact: string
  confidence: ForecastConfidence
  reasons: OptimizationReason[]
  scoreBreakdown: OptimizationScoreBreakdown
  lockedTaskIdsPreserved: string[]
}

export interface OptimizedEmployeePlan {
  employeeId: string
  employeeName: string
  availableMinutes: number
  proposedAssignedMinutes: number
  expectedCompletedMinutes: number
  projectedFinishTime: string
  utilization: number
  operationGroups: OptimizedOperationGroup[]
  warnings: OptimizationWarning[]
  confidence: ForecastConfidence
  protectedDeadlineCount: number
}

export interface UnscheduledOptimizationItem {
  workItemId: string
  orderNumber: string
  operation: ProductionStepName
  requiredMinutes: number
  reason: string
  blockingConstraint:
    | 'NO_SKILLED_EMPLOYEE'
    | 'NO_CAPACITY'
    | 'MATERIAL_UNAVAILABLE'
    | 'BLOCKED_WORKITEM'
    | 'DEPENDENCY_INCOMPLETE'
    | 'LOCKED_TASK_CONFLICT'
    | 'EXCLUDED_BY_SCENARIO'
    | 'APPROVAL_REQUIRED'
    | 'PLAN_DATE_MISMATCH'
}

export interface PlanComparisonSnapshot {
  minutesMoved: number
  reassignedWorkItemCount: number
  projectedLateJobsBefore: number
  projectedLateJobsAfter: number
  projectedCarryForwardBefore: number
  projectedCarryForwardAfter: number
  setupMinutesSaved: number
  capacityBalanceBefore: number
  capacityBalanceAfter: number
  bottleneckImpact: string
  supportingCalculations: string[]
}

export interface OptimizedBattlePlanProposal {
  id: string
  planDate: string
  generatedAt: string
  generatedBy: string
  constraints: OptimizationConstraint
  weights: OptimizationWeights
  employeePlans: OptimizedEmployeePlan[]
  unscheduledWork: UnscheduledOptimizationItem[]
  warnings: OptimizationWarning[]
  comparison: PlanComparisonSnapshot
  deadlineRisksProtected: number
  confidence: ForecastConfidence
  reasons: OptimizationReason[]
  proposalSnapshot: {
    preservedLockedTaskCount: number
    setupFamiliesUsed: number
    overtimeMinutesUsed: number
  }
}

export interface MaterialReadinessStatus {
  workItemId: string
  operation: ProductionStepName
  status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE' | 'UNKNOWN' | 'NEEDS_REVIEW'
  reason: string
  inventorySignals: string[]
}

export interface OptimizationCandidate {
  workItemId: string
  orderNumber: string
  productType: ProductType
  operation: ProductionStepName
  estimatedMinutes: number
  setupFamily: SetupFamily
  compatibility: OperationCompatibility
  blocked: boolean
  locked: boolean
  material: MaterialReadinessStatus
  carryForwardHistory: number
  scoreBreakdown: OptimizationScoreBreakdown
  reasons: OptimizationReason[]
  sourceTask?: BattlePlanTask
}

export type OptimizationAcceptMode = 'ENTIRE_PROPOSAL' | 'SELECTED_EMPLOYEE' | 'SELECTED_OPERATION'
