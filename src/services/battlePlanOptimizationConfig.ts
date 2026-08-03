import type { OptimizationConstraint, OptimizationWeights } from '../types/battlePlanOptimization'

export const DEFAULT_OPTIMIZATION_WEIGHTS: OptimizationWeights = {
  deadlineUrgency: 1.2,
  workItemPriority: 1.0,
  bottleneckRelief: 0.8,
  setupReduction: 0.7,
  workloadBalance: 0.9,
  carryForwardReduction: 0.85,
  qualityHistory: 0.65,
  materialReadiness: 1.1,
  employeeContinuity: 0.55,
  overtimePenalty: 1.25,
}

export const DEFAULT_OPTIMIZATION_CONSTRAINTS: OptimizationConstraint = {
  keepCurrentAssignments: false,
  allowOvertime: false,
  overtimeLimitMinutes: 90,
  excludedEmployeeIds: [],
  protectedWorkItemIds: [],
  prioritizeShipping: false,
  prioritizeOriginals: false,
  capOperationSwitching: 6,
  preserveLockedWork: true,
  reserveEmergencyMinutes: 30,
  changeEmployeeAvailability: {},
  scenarioMode: 'NONE',
}

let currentWeights: OptimizationWeights = DEFAULT_OPTIMIZATION_WEIGHTS
let currentConstraints: OptimizationConstraint = DEFAULT_OPTIMIZATION_CONSTRAINTS

export const loadOptimizationWeights = (): OptimizationWeights => {
  return currentWeights
}

export const saveOptimizationWeights = (weights: OptimizationWeights): void => {
  currentWeights = weights
}

export const loadDefaultOptimizationConstraints = (): OptimizationConstraint => {
  return currentConstraints
}

export const saveDefaultOptimizationConstraints = (constraints: OptimizationConstraint): void => {
  currentConstraints = constraints
}
