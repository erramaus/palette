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

const STORAGE_KEY = 'palette.battlePlanOptimization.v1'

const hasWindow = (): boolean => typeof window !== 'undefined'

export const loadOptimizationWeights = (): OptimizationWeights => {
  if (!hasWindow()) {
    return DEFAULT_OPTIMIZATION_WEIGHTS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_OPTIMIZATION_WEIGHTS
    }

    const parsed = JSON.parse(raw) as { weights?: Partial<OptimizationWeights> }
    return {
      ...DEFAULT_OPTIMIZATION_WEIGHTS,
      ...(parsed.weights ?? {}),
    }
  } catch {
    return DEFAULT_OPTIMIZATION_WEIGHTS
  }
}

export const saveOptimizationWeights = (weights: OptimizationWeights): void => {
  if (!hasWindow()) {
    return
  }

  const existing = hasWindow() ? window.localStorage.getItem(STORAGE_KEY) : null
  let parsed: { constraints?: Partial<OptimizationConstraint>; weights?: Partial<OptimizationWeights> } = {}
  if (existing) {
    try {
      parsed = JSON.parse(existing) as typeof parsed
    } catch {
      parsed = {}
    }
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...parsed,
      weights,
    }),
  )
}

export const loadDefaultOptimizationConstraints = (): OptimizationConstraint => {
  if (!hasWindow()) {
    return DEFAULT_OPTIMIZATION_CONSTRAINTS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_OPTIMIZATION_CONSTRAINTS
    }

    const parsed = JSON.parse(raw) as { constraints?: Partial<OptimizationConstraint> }
    return {
      ...DEFAULT_OPTIMIZATION_CONSTRAINTS,
      ...(parsed.constraints ?? {}),
    }
  } catch {
    return DEFAULT_OPTIMIZATION_CONSTRAINTS
  }
}

export const saveDefaultOptimizationConstraints = (constraints: OptimizationConstraint): void => {
  if (!hasWindow()) {
    return
  }

  const existing = hasWindow() ? window.localStorage.getItem(STORAGE_KEY) : null
  let parsed: { constraints?: Partial<OptimizationConstraint>; weights?: Partial<OptimizationWeights> } = {}
  if (existing) {
    try {
      parsed = JSON.parse(existing) as typeof parsed
    } catch {
      parsed = {}
    }
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...parsed,
      constraints,
    }),
  )
}
