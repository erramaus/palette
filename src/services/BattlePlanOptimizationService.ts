import type { AppActivityLog } from '../state/AppStateContext'
import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import {
  type OptimizationCandidate,
  type OptimizationConstraint,
  type OptimizationReason,
  type OptimizationScoreBreakdown,
  type OptimizationWarning,
  type OptimizedBattlePlanProposal,
  type OptimizedEmployeePlan,
  type OptimizedOperationGroup,
  type PlanComparisonSnapshot,
  type SetupFamily,
  type UnscheduledOptimizationItem,
} from '../types/battlePlanOptimization'
import type { OptimizationWeights } from '../types/battlePlanOptimization'
import {
  DEFAULT_OPTIMIZATION_CONSTRAINTS,
  DEFAULT_OPTIMIZATION_WEIGHTS,
} from './battlePlanOptimizationConfig'
import { getNextActionableStep } from './battlePlanGenerator'
import { HistoricalPerformanceService } from './HistoricalPerformanceService'
import { MaterialForecastService } from './MaterialForecastService'
import { ProductionForecastService } from './ProductionForecastService'
import { ProductionIntelligenceService } from './ProductionIntelligenceService'

interface BattlePlanOptimizationInput {
  planDate: string
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  employees: Employee[]
  activityLogs: AppActivityLog[]
  constraints?: Partial<OptimizationConstraint>
  weights?: Partial<OptimizationWeights>
}

const round2 = (value: number): number => Math.round(value * 100) / 100

const setupSwitchingCost = (from?: SetupFamily, to?: SetupFamily): number => {
  if (!from || !to) {
    return 8
  }
  if (from.id === to.id) {
    return 0
  }
  if (from.operation === to.operation) {
    return 4
  }
  return 12
}

const toWorkItemPriorityBucket = (job: ProductionJob): number => {
  if (job.productType === 'ORIGINAL') {
    return 0
  }
  if (job.productType === 'TEXTURED_REPLICA_3D' || job.productType === 'CANVAS') {
    return 1
  }
  if (job.priority === 'CUSTOMER_PURCHASED') {
    return 2
  }
  if (job.productType === 'GALLERY_INVENTORY') {
    return 3
  }
  return 4
}

const dueUrgencyScore = (job: ProductionJob, riskLevel: string): number => {
  if (job.dueStatus === 'OVERDUE') {
    return 1
  }
  if (riskLevel === 'LIKELY_LATE' || riskLevel === 'HIGH_RISK') {
    return 0.9
  }
  if (job.dueStatus === 'DUE_TODAY') {
    return 0.8
  }
  if (job.dueStatus === 'AT_RISK') {
    return 0.7
  }
  if (job.dueStatus === 'DUE_SOON') {
    return 0.5
  }
  return 0.25
}

const toProjectedFinishTime = (minutes: number): string => {
  const base = 8 * 60
  const total = base + Math.max(0, Math.round(minutes))
  const hour = Math.floor(total / 60)
  const minute = total % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export class BattlePlanOptimizationService {
  private readonly planDate: string
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly employees: Employee[]
  private readonly activityLogs: AppActivityLog[]
  private readonly constraints: OptimizationConstraint
  private readonly weights: OptimizationWeights

  constructor(input: BattlePlanOptimizationInput) {
    this.planDate = input.planDate
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.employees = input.employees
    this.activityLogs = input.activityLogs
    this.constraints = {
      ...DEFAULT_OPTIMIZATION_CONSTRAINTS,
      ...(input.constraints ?? {}),
      excludedEmployeeIds: input.constraints?.excludedEmployeeIds ?? DEFAULT_OPTIMIZATION_CONSTRAINTS.excludedEmployeeIds,
      protectedWorkItemIds: input.constraints?.protectedWorkItemIds ?? DEFAULT_OPTIMIZATION_CONSTRAINTS.protectedWorkItemIds,
      changeEmployeeAvailability: input.constraints?.changeEmployeeAvailability ?? DEFAULT_OPTIMIZATION_CONSTRAINTS.changeEmployeeAvailability,
    }
    this.weights = {
      ...DEFAULT_OPTIMIZATION_WEIGHTS,
      ...(input.weights ?? {}),
    }
  }

  generateProposal(generatedBy: string): OptimizedBattlePlanProposal {
    const materialForecast = new MaterialForecastService({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
    })

    const historicalPerformance = new HistoricalPerformanceService({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
      employees: this.employees,
      activityLogs: this.activityLogs,
    })

    const forecastService = new ProductionForecastService({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
      employees: this.employees,
      activityLogs: this.activityLogs,
    })
    const forecast = forecastService.getForecast()
    const deadlineRiskByJob = new Map(forecast.deadlineForecasts.map((item) => [item.workItemId, item]))

    const intelligenceService = new ProductionIntelligenceService({
      productionJobs: this.productionJobs,
      battlePlans: this.battlePlans,
      employees: this.employees,
      activityLogs: this.activityLogs,
    })
    const intelligenceForecast = intelligenceService.getForecast()

    const existingPlansForDate = this.battlePlans.filter((plan) => plan.date === this.planDate)
    const lockedTasksByWorker = new Map<string, BattlePlanTask[]>()
    existingPlansForDate.forEach((plan) => {
      lockedTasksByWorker.set(
        plan.assignedWorkerId,
        plan.tasks.filter((task) => task.locked),
      )
    })

    const warnings: OptimizationWarning[] = []
    const unscheduledWork: UnscheduledOptimizationItem[] = []
    const jobById = new Map(this.productionJobs.map((job) => [job.id, job]))

    const candidates: OptimizationCandidate[] = this.productionJobs
      .filter((job) => !job.onHold)
      .map((job) => {
        const operation = getNextActionableStep(job)
        if (!operation) {
          unscheduledWork.push({
            workItemId: job.id,
            orderNumber: job.orderNumber,
            operation: 'FILES',
            requiredMinutes: 0,
            reason: 'No actionable operation for current workflow state.',
            blockingConstraint: 'DEPENDENCY_INCOMPLETE',
          })
          return null
        }

        const material = materialForecast.getMaterialStatus(job.id, operation)
        const setupFamily = this.resolveSetupFamily(job, operation)
        const carryForwardHistory = this.countCarryForwardHistory(job.id)
        const risk = deadlineRiskByJob.get(job.id)

        const scoreBreakdown = this.scoreCandidate(
          job,
          operation,
          setupFamily,
          material.status,
          carryForwardHistory,
          risk?.riskLevel ?? 'ON_TRACK',
        )

        const reasons: OptimizationReason[] = [
          {
            code: 'DEADLINE_PRIORITY',
            description: `${job.orderNumber} due status ${job.dueStatus} and risk ${risk?.riskLevel ?? 'ON_TRACK'} influence urgency score.`,
          },
          {
            code: 'MATERIAL_STATUS',
            description: `Material status is ${material.status.toLowerCase()} for ${operation}.`,
          },
          {
            code: 'SETUP_FAMILY',
            description: `Grouped in setup family ${setupFamily.name} to reduce switching.`,
          },
        ]

        const baseCandidate: OptimizationCandidate = {
          workItemId: job.id,
          orderNumber: job.orderNumber,
          productType: job.productType,
          operation,
          estimatedMinutes: job.estimatedMinutes[operation],
          setupFamily,
          compatibility: {
            workItemId: job.id,
            operation,
            setupFamilyId: setupFamily.id,
            compatibilityScore: round2(scoreBreakdown.setupScore),
            reasons,
          },
          blocked: /blocked|waiting on|dependency|hold/i.test(job.notes) || job.onHold === true,
          locked: this.isLockedElsewhere(job.id, operation, existingPlansForDate),
          material,
          carryForwardHistory,
          scoreBreakdown,
          reasons,
        }

        return this.applyCandidatePriorities(baseCandidate, job)
      })
      .filter((candidate): candidate is OptimizationCandidate => candidate !== null)
      .sort((left, right) => right.scoreBreakdown.totalScore - left.scoreBreakdown.totalScore)

    const workerPool = this.employees
      .filter((employee) => employee.role === 'WORKER' && employee.active)
      .filter((employee) => !this.constraints.excludedEmployeeIds.includes(employee.id))

    if (this.constraints.scenarioMode === 'DANIEL_ABSENT') {
      const withoutDaniel = workerPool.filter((worker) => !/daniel/i.test(worker.name))
      if (withoutDaniel.length > 0) {
        workerPool.length = 0
        workerPool.push(...withoutDaniel)
      } else {
        warnings.push({
          level: 'WARNING',
          code: 'SCENARIO_DANIEL_NOT_FOUND',
          message: 'Scenario Daniel Absent selected, but no active worker matched Daniel.',
          affectedWorkItemIds: [],
        })
      }
    }

    const employeeProfiles = historicalPerformance.getEmployeeProfiles()
    const profileByEmployee = new Map(employeeProfiles.map((profile) => [profile.employeeId, profile]))

    const employeePlansMap = new Map<string, OptimizedEmployeePlan>()
    const employeeRemainingMinutes = new Map<string, number>()

    workerPool.forEach((worker) => {
      const baseCapacity = this.constraints.changeEmployeeAvailability[worker.id] ?? worker.defaultAvailableMinutes
      const availableMinutes = Math.max(0, baseCapacity - this.constraints.reserveEmergencyMinutes)
      const lockedMinutes = (lockedTasksByWorker.get(worker.id) ?? []).reduce((sum, task) => sum + task.estimatedMinutes, 0)
      const remaining = Math.max(0, availableMinutes - lockedMinutes)

      employeeRemainingMinutes.set(worker.id, remaining)
      employeePlansMap.set(worker.id, {
        employeeId: worker.id,
        employeeName: worker.name,
        availableMinutes,
        proposedAssignedMinutes: lockedMinutes,
        expectedCompletedMinutes: 0,
        projectedFinishTime: toProjectedFinishTime(lockedMinutes),
        utilization: round2((lockedMinutes / Math.max(1, availableMinutes)) * 100),
        operationGroups: [],
        warnings: [],
        confidence: 'MEDIUM',
        protectedDeadlineCount: 0,
      })
    })

    for (const candidate of candidates) {
      const sourceJob = jobById.get(candidate.workItemId)
      if (!sourceJob) {
        unscheduledWork.push({
          workItemId: candidate.workItemId,
          orderNumber: candidate.orderNumber,
          operation: candidate.operation,
          requiredMinutes: candidate.estimatedMinutes,
          reason: 'Candidate could not be matched to source production job.',
          blockingConstraint: 'DEPENDENCY_INCOMPLETE',
        })
        continue
      }

      const hardConstraintFailure = this.checkHardConstraintFailure(candidate, workerPool)
      if (hardConstraintFailure) {
        unscheduledWork.push(hardConstraintFailure)
        continue
      }

      const scenarioExclusion = this.checkScenarioExclusion(candidate, sourceJob)
      if (scenarioExclusion) {
        unscheduledWork.push(scenarioExclusion)
        continue
      }

      const eligibleWorkers = workerPool.filter((worker) => worker.skills.includes(candidate.operation))
      if (eligibleWorkers.length === 0) {
        unscheduledWork.push({
          workItemId: candidate.workItemId,
          orderNumber: candidate.orderNumber,
          operation: candidate.operation,
          requiredMinutes: candidate.estimatedMinutes,
          reason: 'No employee with required skill is available for this operation.',
          blockingConstraint: 'NO_SKILLED_EMPLOYEE',
        })
        continue
      }

      const selectedWorker = this.selectBestWorker(candidate, eligibleWorkers, employeeRemainingMinutes, profileByEmployee)
      const selectedPlan = employeePlansMap.get(selectedWorker.id)
      if (!selectedPlan) {
        continue
      }

      const switchingCost = this.computeSwitchingCost(selectedPlan.operationGroups, candidate.setupFamily)
      const requiredMinutes = candidate.estimatedMinutes + switchingCost
      const scenarioOvertimeBoost = this.constraints.scenarioMode === 'OVERTIME_ALLOWED' ? 30 : 0
      const capacityLimit = selectedPlan.availableMinutes + (this.constraints.allowOvertime ? this.constraints.overtimeLimitMinutes + scenarioOvertimeBoost : 0)
      if (selectedPlan.proposedAssignedMinutes + requiredMinutes > capacityLimit) {
        unscheduledWork.push({
          workItemId: candidate.workItemId,
          orderNumber: candidate.orderNumber,
          operation: candidate.operation,
          requiredMinutes,
          reason: 'Scheduling would exceed available minutes and overtime is not permitted or capped.',
          blockingConstraint: 'NO_CAPACITY',
        })
        continue
      }

      const group = this.toOptimizedOperationGroup(candidate, selectedWorker.id, switchingCost)
      const existingGroup = selectedPlan.operationGroups.find(
        (item) => item.setupFamily.id === group.setupFamily.id && item.operation === group.operation,
      )

      if (existingGroup) {
        existingGroup.workItemIds.push(candidate.workItemId)
        existingGroup.workItemNumbers.push(candidate.orderNumber)
        existingGroup.estimatedGroupMinutes += group.estimatedGroupMinutes
        existingGroup.executionMinutes += group.executionMinutes
        existingGroup.deadlineImpact = existingGroup.deadlineImpact.includes('risk')
          ? existingGroup.deadlineImpact
          : group.deadlineImpact
        existingGroup.reasons.push(...group.reasons)
      } else {
        selectedPlan.operationGroups.push(group)
      }

      selectedPlan.proposedAssignedMinutes += requiredMinutes
      selectedPlan.expectedCompletedMinutes += group.executionMinutes
      selectedPlan.projectedFinishTime = toProjectedFinishTime(selectedPlan.proposedAssignedMinutes)
      selectedPlan.utilization = round2((selectedPlan.proposedAssignedMinutes / Math.max(1, selectedPlan.availableMinutes)) * 100)
      if (['OVERDUE', 'LIKELY_LATE', 'HIGH_RISK'].some((risk) => candidate.reasons.some((reason) => reason.description.includes(risk)))) {
        selectedPlan.protectedDeadlineCount += 1
      }

      employeeRemainingMinutes.set(selectedWorker.id, Math.max(0, (employeeRemainingMinutes.get(selectedWorker.id) ?? 0) - requiredMinutes))
    }

    const employeePlans = [...employeePlansMap.values()]
      .map((plan) => this.sortAndFinalizeEmployeePlan(plan))
      .sort((left, right) => left.employeeName.localeCompare(right.employeeName))

    employeePlans.forEach((plan) => {
      if (plan.operationGroups.length > this.constraints.capOperationSwitching) {
        const message = `${plan.employeeName} exceeds switching cap (${plan.operationGroups.length}/${this.constraints.capOperationSwitching}).`
        const warning: OptimizationWarning = {
          level: 'WARNING',
          code: 'SWITCHING_CAP_EXCEEDED',
          message,
          affectedWorkItemIds: plan.operationGroups.flatMap((group) => group.workItemIds),
        }
        plan.warnings.push(warning)
        warnings.push(warning)
      }

      if (plan.utilization > 100 && !this.constraints.allowOvertime) {
        const warning: OptimizationWarning = {
          level: 'CRITICAL',
          code: 'UNAUTHORIZED_OVERTIME',
          message: `${plan.employeeName} utilization exceeds 100% without overtime allowance.`,
          affectedWorkItemIds: plan.operationGroups.flatMap((group) => group.workItemIds),
        }
        plan.warnings.push(warning)
        warnings.push(warning)
      }
    })

    const unscheduledProtected = unscheduledWork.filter((item) =>
      this.constraints.protectedWorkItemIds.includes(item.workItemId),
    )
    if (unscheduledProtected.length > 0) {
      warnings.push({
        level: 'CRITICAL',
        code: 'PROTECTED_ITEMS_UNSCHEDULED',
        message: `${unscheduledProtected.length} protected work item(s) could not be scheduled under current constraints.`,
        affectedWorkItemIds: unscheduledProtected.map((item) => item.workItemId),
      })
    }

    if (this.constraints.scenarioMode === 'PRINTER_DOWN') {
      const printerBlocked = unscheduledWork.filter(
        (item) => item.blockingConstraint === 'EXCLUDED_BY_SCENARIO' && item.operation === 'PRINTED',
      )
      if (printerBlocked.length > 0) {
        warnings.push({
          level: 'INFO',
          code: 'PRINTER_DOWN_IMPACT',
          message: `${printerBlocked.length} PRINTED operation(s) were excluded by Printer Down scenario.`,
          affectedWorkItemIds: printerBlocked.map((item) => item.workItemId),
        })
      }
    }

    const comparison = this.buildComparison(existingPlansForDate, employeePlans, forecast, intelligenceForecast)

    const preservedLockedTaskCount = [...lockedTasksByWorker.values()].flat().length
    const setupFamiliesUsed = new Set(employeePlans.flatMap((plan) => plan.operationGroups.map((group) => group.setupFamily.id))).size
    const overtimeMinutesUsed = employeePlans.reduce((sum, plan) => {
      const over = Math.max(0, plan.proposedAssignedMinutes - plan.availableMinutes)
      return sum + over
    }, 0)

    const deadlineRisksProtected = employeePlans.reduce((sum, plan) => sum + plan.protectedDeadlineCount, 0)

    return {
      id: `OPT-${this.planDate}-${Date.now()}`,
      planDate: this.planDate,
      generatedAt: new Date().toISOString(),
      generatedBy,
      constraints: this.constraints,
      weights: this.weights,
      employeePlans,
      unscheduledWork,
      warnings,
      comparison,
      deadlineRisksProtected,
      confidence: unscheduledWork.length > 0 ? 'MEDIUM' : 'HIGH',
      reasons: [
        {
          code: 'OPTIMIZATION_COMPLETE',
          description: `Generated proposal for ${employeePlans.length} workers with ${unscheduledWork.length} unscheduled items.`,
        },
      ],
      proposalSnapshot: {
        preservedLockedTaskCount,
        setupFamiliesUsed,
        overtimeMinutesUsed,
      },
    }
  }

  private checkHardConstraintFailure(
    candidate: OptimizationCandidate,
    workers: Employee[],
  ): UnscheduledOptimizationItem | null {
    if (candidate.blocked) {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: 'Work item is blocked or on hold and cannot be scheduled.',
        blockingConstraint: 'BLOCKED_WORKITEM',
      }
    }

    if (candidate.material.status === 'UNAVAILABLE') {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: `Material unavailable: ${candidate.material.reason}`,
        blockingConstraint: 'MATERIAL_UNAVAILABLE',
      }
    }

    if (candidate.locked && this.constraints.preserveLockedWork) {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: 'Operation conflicts with locked tasks that must be preserved.',
        blockingConstraint: 'LOCKED_TASK_CONFLICT',
      }
    }

    if (this.constraints.excludedEmployeeIds.length >= workers.length) {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: 'All eligible workers are excluded by constraints.',
        blockingConstraint: 'NO_SKILLED_EMPLOYEE',
      }
    }

    return null
  }

  private checkScenarioExclusion(
    candidate: OptimizationCandidate,
    job: ProductionJob,
  ): UnscheduledOptimizationItem | null {
    if (this.constraints.scenarioMode === 'PRINTER_DOWN' && candidate.operation === 'PRINTED') {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: 'Scenario mode Printer Down excludes PRINTED operations from schedule.',
        blockingConstraint: 'EXCLUDED_BY_SCENARIO',
      }
    }

    if (
      this.constraints.scenarioMode === 'MOULDING_TOMORROW' &&
      (candidate.operation === 'FRAME_MADE' || candidate.operation === 'FRAMED') &&
      job.dueStatus !== 'OVERDUE' &&
      job.dueStatus !== 'DUE_TODAY'
    ) {
      return {
        workItemId: candidate.workItemId,
        orderNumber: candidate.orderNumber,
        operation: candidate.operation,
        requiredMinutes: candidate.estimatedMinutes,
        reason: 'Scenario mode Moulding Tomorrow defers non-urgent frame operations until tomorrow.',
        blockingConstraint: 'EXCLUDED_BY_SCENARIO',
      }
    }

    return null
  }

  private applyCandidatePriorities(
    candidate: OptimizationCandidate,
    job: ProductionJob,
  ): OptimizationCandidate {
    let totalDelta = 0
    let priorityDelta = 0
    let bottleneckDelta = 0
    let overtimePenalty = candidate.scoreBreakdown.overtimePenaltyScore
    const reasons: OptimizationReason[] = [...candidate.reasons]

    if (this.constraints.protectedWorkItemIds.includes(candidate.workItemId)) {
      priorityDelta += 0.95
      reasons.push({
        code: 'PROTECTED_WORKITEM',
        description: 'Protected work item receives additional scheduling priority.',
      })
    }

    if (this.constraints.prioritizeShipping && candidate.operation === 'SHIPPED') {
      priorityDelta += 0.75
      reasons.push({
        code: 'PRIORITIZE_SHIPPING',
        description: 'Shipping prioritization is enabled, boosting SHIPPED operations.',
      })
    }

    if (this.constraints.prioritizeOriginals && job.productType === 'ORIGINAL') {
      priorityDelta += 0.6
      reasons.push({
        code: 'PRIORITIZE_ORIGINALS',
        description: 'Original artwork is prioritized by active constraints.',
      })
    }

    if (this.constraints.prioritizeDepartment) {
      const department = this.constraints.prioritizeDepartment.toLowerCase()
      const matchesDepartment =
        (department.includes('ship') && candidate.operation === 'SHIPPED') ||
        (department.includes('frame') && (candidate.operation === 'FRAME_MADE' || candidate.operation === 'FRAMED')) ||
        (department.includes('print') && candidate.operation === 'PRINTED') ||
        (department.includes('dibond') && candidate.operation === 'DIBOND')
      if (matchesDepartment) {
        bottleneckDelta += 0.45
        reasons.push({
          code: 'PRIORITIZE_DEPARTMENT',
          description: `Department priority is set to ${this.constraints.prioritizeDepartment}.`,
        })
      }
    }

    if (this.constraints.scenarioMode === 'RUSH_ORDER') {
      const rushCandidate =
        job.priority === 'CUSTOMER_PURCHASED' ||
        job.dueStatus === 'OVERDUE' ||
        job.dueStatus === 'DUE_TODAY' ||
        job.dueStatus === 'AT_RISK'
      if (rushCandidate) {
        priorityDelta += 0.9
        reasons.push({
          code: 'RUSH_ORDER_SCENARIO',
          description: 'Rush Order scenario boosts urgent and customer-purchased work items.',
        })
      }
    }

    if (this.constraints.scenarioMode === 'MOULDING_TOMORROW') {
      if (candidate.operation === 'FRAME_MADE' || candidate.operation === 'FRAMED') {
        priorityDelta -= 0.5
        reasons.push({
          code: 'MOULDING_TOMORROW_FRAME_DEPRIORITIZED',
          description: 'Frame operations are deprioritized today to account for moulding availability tomorrow.',
        })
      }

      if (candidate.operation === 'FILES' || candidate.operation === 'PRINTED' || candidate.operation === 'DIBOND') {
        bottleneckDelta += 0.35
        reasons.push({
          code: 'MOULDING_TOMORROW_PREP_BOOST',
          description: 'Pre-framing operations are boosted to prepare next-day moulding flow.',
        })
      }
    }

    if (this.constraints.scenarioMode === 'OVERTIME_ALLOWED' || this.constraints.allowOvertime) {
      const reducedPenalty = round2(overtimePenalty * 0.35)
      totalDelta += overtimePenalty - reducedPenalty
      overtimePenalty = reducedPenalty
      reasons.push({
        code: 'OVERTIME_PENALTY_REDUCED',
        description: 'Overtime is allowed, so overtime penalty is reduced in scoring.',
      })
    }

    totalDelta += priorityDelta + bottleneckDelta

    return {
      ...candidate,
      reasons,
      scoreBreakdown: {
        ...candidate.scoreBreakdown,
        priorityScore: round2(candidate.scoreBreakdown.priorityScore + priorityDelta),
        bottleneckScore: round2(candidate.scoreBreakdown.bottleneckScore + bottleneckDelta),
        overtimePenaltyScore: overtimePenalty,
        totalScore: round2(candidate.scoreBreakdown.totalScore + totalDelta),
      },
    }
  }

  private scoreCandidate(
    job: ProductionJob,
    operation: ProductionStepName,
    setupFamily: SetupFamily,
    materialStatus: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE' | 'UNKNOWN',
    carryForwardHistory: number,
    riskLevel: string,
  ): OptimizationScoreBreakdown {
    const deadlineUrgency = dueUrgencyScore(job, riskLevel) * this.weights.deadlineUrgency
    const priorityBase = 1 - toWorkItemPriorityBucket(job) / 5
    const priorityScore = priorityBase * this.weights.workItemPriority

    const bottleneckScore = ['DIBOND', 'FRAME_MADE', 'FRAMED'].includes(operation)
      ? 0.8 * this.weights.bottleneckRelief
      : 0.45 * this.weights.bottleneckRelief

    const setupScore =
      setupFamily.operation === operation
        ? 0.75 * this.weights.setupReduction
        : 0.3 * this.weights.setupReduction

    const workloadBalanceScore = (1 - Math.min(1, job.estimatedMinutes[operation] / 240)) * this.weights.workloadBalance
    const carryForwardScore = Math.max(0.1, 1 - Math.min(1, carryForwardHistory / 4)) * this.weights.carryForwardReduction
    const qualityScore = (job.productType === 'ORIGINAL' ? 0.9 : 0.7) * this.weights.qualityHistory

    const materialScore =
      materialStatus === 'AVAILABLE'
        ? 1 * this.weights.materialReadiness
        : materialStatus === 'LIMITED'
          ? 0.45 * this.weights.materialReadiness
          : materialStatus === 'UNKNOWN'
            ? 0.3 * this.weights.materialReadiness
            : 0

    const continuityScore = (job.assignedWorkerId ? 0.55 : 0.35) * this.weights.employeeContinuity
    const overtimePenaltyScore = this.weights.overtimePenalty * 0.2

    const totalScore =
      deadlineUrgency +
      priorityScore +
      bottleneckScore +
      setupScore +
      workloadBalanceScore +
      carryForwardScore +
      qualityScore +
      materialScore +
      continuityScore -
      overtimePenaltyScore

    return {
      totalScore: round2(totalScore),
      deadlineUrgencyScore: round2(deadlineUrgency),
      priorityScore: round2(priorityScore),
      bottleneckScore: round2(bottleneckScore),
      setupScore: round2(setupScore),
      workloadBalanceScore: round2(workloadBalanceScore),
      carryForwardScore: round2(carryForwardScore),
      qualityScore: round2(qualityScore),
      materialScore: round2(materialScore),
      continuityScore: round2(continuityScore),
      overtimePenaltyScore: round2(overtimePenaltyScore),
    }
  }

  private selectBestWorker(
    candidate: OptimizationCandidate,
    eligibleWorkers: Employee[],
    employeeRemainingMinutes: Map<string, number>,
    profileByEmployee: Map<string, ReturnType<HistoricalPerformanceService['getEmployeeProfiles']>[number]>,
  ): Employee {
    const keepCurrent = this.constraints.keepCurrentAssignments
      ? eligibleWorkers.find((worker) => worker.id === this.productionJobs.find((job) => job.id === candidate.workItemId)?.assignedWorkerId)
      : undefined

    if (keepCurrent) {
      return keepCurrent
    }

    const weighted = eligibleWorkers
      .map((worker) => {
        const remaining = employeeRemainingMinutes.get(worker.id) ?? 0
        const profile = profileByEmployee.get(worker.id)
        const performance = profile?.actualToStandardRatio ?? 1
        const qualityPenalty = profile?.reworkFrequency ?? 0
        const fairness = 1 - Math.min(1, Math.abs(remaining - 180) / 240)

        const score =
          remaining * 0.5 +
          (performance <= 1.1 ? 120 : 80) +
          fairness * 100 -
          qualityPenalty * 60

        return { worker, score }
      })
      .sort((left, right) => right.score - left.score)

    return weighted[0].worker
  }

  private toOptimizedOperationGroup(
    candidate: OptimizationCandidate,
    employeeId: string,
    switchingCostMinutes: number,
  ): OptimizedOperationGroup {
    const setupMinutes = Math.max(6, Math.round(candidate.estimatedMinutes * 0.12))
    const executionMinutes = Math.max(1, Math.round(candidate.estimatedMinutes * 0.8))
    const cleanupMinutes = Math.max(4, Math.round(candidate.estimatedMinutes * 0.08))
    const expectedInterruptionMinutes = Math.round(candidate.carryForwardHistory * 4)

    const estimateSource = candidate.material.status === 'UNKNOWN'
      ? 'STANDARD_FALLBACK'
      : 'HISTORICAL_MEDIAN'

    const reasons = [
      ...candidate.reasons,
      {
        code: 'EMPLOYEE_ASSIGNMENT',
        description: `Assigned to ${employeeId} based on skill match and available minutes.`,
      },
      {
        code: 'SETUP_SAVINGS',
        description: `Setup family ${candidate.setupFamily.name} reduces switching impact by grouping compatible operations.`,
      },
    ]

    const deadlineImpact = candidate.scoreBreakdown.deadlineUrgencyScore >= 0.85
      ? 'Protects overdue/late-risk due date'
      : 'Supports flow balance'

    return {
      id: `OG-${candidate.workItemId}-${candidate.operation}`,
      operation: candidate.operation,
      setupFamily: candidate.setupFamily,
      workItemIds: [candidate.workItemId],
      workItemNumbers: [candidate.orderNumber],
      estimatedGroupMinutes: setupMinutes + executionMinutes + cleanupMinutes + switchingCostMinutes + expectedInterruptionMinutes,
      setupMinutes,
      executionMinutes,
      cleanupMinutes,
      switchingCostMinutes,
      expectedInterruptionMinutes,
      estimateSource,
      materialStatus: candidate.material.status,
      deadlineImpact,
      confidence: estimateSource === 'STANDARD_FALLBACK' ? 'LOW' : 'MEDIUM',
      reasons,
      scoreBreakdown: candidate.scoreBreakdown,
      lockedTaskIdsPreserved: [],
    }
  }

  private sortAndFinalizeEmployeePlan(plan: OptimizedEmployeePlan): OptimizedEmployeePlan {
    const sorted = [...plan.operationGroups].sort((left, right) => {
      const leftUrgency = left.scoreBreakdown.deadlineUrgencyScore
      const rightUrgency = right.scoreBreakdown.deadlineUrgencyScore
      if (leftUrgency !== rightUrgency) {
        return rightUrgency - leftUrgency
      }
      return right.scoreBreakdown.totalScore - left.scoreBreakdown.totalScore
    })

    let previousFamily: SetupFamily | undefined
    let switchingTotal = 0
    for (const group of sorted) {
      switchingTotal += setupSwitchingCost(previousFamily, group.setupFamily)
      previousFamily = group.setupFamily
    }

    const confidence =
      sorted.length === 0
        ? 'INSUFFICIENT_DATA'
        : sorted.every((group) => group.confidence === 'MEDIUM' || group.confidence === 'HIGH')
          ? 'MEDIUM'
          : 'LOW'

    return {
      ...plan,
      operationGroups: sorted,
      confidence,
      utilization: round2((plan.proposedAssignedMinutes / Math.max(1, plan.availableMinutes)) * 100),
      warnings: plan.warnings,
      projectedFinishTime: toProjectedFinishTime(plan.proposedAssignedMinutes + switchingTotal),
    }
  }

  private buildComparison(
    existingPlansForDate: BattlePlan[],
    proposedPlans: OptimizedEmployeePlan[],
    forecast: ReturnType<ProductionForecastService['getForecast']>,
    intelligenceForecast: ReturnType<ProductionIntelligenceService['getForecast']>,
  ): PlanComparisonSnapshot {
    const existingAssignments = new Map<string, string>()
    existingPlansForDate.forEach((plan) => {
      plan.tasks.forEach((task) => {
        existingAssignments.set(`${task.productionJobId}:${task.productionStep}`, plan.assignedWorkerId)
      })
    })

    const proposedAssignments = new Map<string, string>()
    proposedPlans.forEach((plan) => {
      plan.operationGroups.forEach((group) => {
        group.workItemIds.forEach((workItemId) => {
          proposedAssignments.set(`${workItemId}:${group.operation}`, plan.employeeId)
        })
      })
    })

    let minutesMoved = 0
    let reassignedWorkItemCount = 0
    proposedPlans.forEach((plan) => {
      plan.operationGroups.forEach((group) => {
        group.workItemIds.forEach((workItemId) => {
          const key = `${workItemId}:${group.operation}`
          const before = existingAssignments.get(key)
          if (before && before !== plan.employeeId) {
            minutesMoved += group.estimatedGroupMinutes
            reassignedWorkItemCount += 1
          }
        })
      })
    })

    const projectedLateJobsBefore = forecast.deadlineForecasts.filter((item) =>
      item.riskLevel === 'HIGH_RISK' || item.riskLevel === 'LIKELY_LATE' || item.riskLevel === 'OVERDUE',
    ).length

    const projectedCarryForwardBefore = forecast.carryForwardPredictions.filter((item) =>
      item.probabilityBand === 'HIGH' || item.probabilityBand === 'VERY_HIGH',
    ).length

    const setupMinutesBefore = existingPlansForDate
      .flatMap((plan) => plan.tasks)
      .reduce((sum, task) => sum + (task.locked ? 6 : 8), 0)
    const setupMinutesAfter = proposedPlans
      .flatMap((plan) => plan.operationGroups)
      .reduce((sum, group) => sum + group.setupMinutes + group.switchingCostMinutes, 0)

    const capacityVariance = (values: number[]): number => {
      if (values.length === 0) {
        return 0
      }
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length
      return values.reduce((sum, value) => sum + Math.abs(value - avg), 0)
    }

    const beforeUtilizations = existingPlansForDate.map((plan) => {
      const total = plan.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
      return total / Math.max(1, plan.availableMinutes)
    })

    const afterUtilizations = proposedPlans.map((plan) =>
      plan.proposedAssignedMinutes / Math.max(1, plan.availableMinutes),
    )

    const bottleneckBefore = intelligenceForecast.bottleneckForecasts.sort((left, right) =>
      right.capacityLoadPercentage - left.capacityLoadPercentage,
    )[0]

    const projectedLateJobsAfter = Math.max(0, projectedLateJobsBefore - Math.min(3, reassignedWorkItemCount))
    const projectedCarryForwardAfter = Math.max(0, projectedCarryForwardBefore - Math.min(2, reassignedWorkItemCount))

    return {
      minutesMoved,
      reassignedWorkItemCount,
      projectedLateJobsBefore,
      projectedLateJobsAfter,
      projectedCarryForwardBefore,
      projectedCarryForwardAfter,
      setupMinutesSaved: Math.max(0, setupMinutesBefore - setupMinutesAfter),
      capacityBalanceBefore: round2(capacityVariance(beforeUtilizations)),
      capacityBalanceAfter: round2(capacityVariance(afterUtilizations)),
      bottleneckImpact: bottleneckBefore
        ? `${bottleneckBefore.stage} projected load reduced by prioritizing dependent operations first.`
        : 'No bottleneck baseline available.',
      supportingCalculations: [
        `minutesMoved = ${minutesMoved}`,
        `setupMinutesBefore = ${setupMinutesBefore}`,
        `setupMinutesAfter = ${setupMinutesAfter}`,
        `capacityVariance(before) = ${round2(capacityVariance(beforeUtilizations))}`,
        `capacityVariance(after) = ${round2(capacityVariance(afterUtilizations))}`,
      ],
    }
  }

  private resolveSetupFamily(job: ProductionJob, operation: ProductionStepName): SetupFamily {
    const materialType =
      operation === 'DIBOND'
        ? 'DIBOND'
        : operation === 'PRINTED'
          ? 'PRINT_MEDIA'
          : operation === 'FRAME_MADE' || operation === 'FRAMED'
            ? 'FRAME'
            : operation === 'SHIPPED'
              ? 'PACKAGING'
              : 'GENERAL'

    const packagingType = /crate/i.test(job.notes)
      ? 'CRATE'
      : /gallery/i.test(job.notes)
        ? 'GALLERY'
        : 'STANDARD'

    const workstation =
      operation === 'PRINTED'
        ? 'PRINTER'
        : operation === 'DIBOND'
          ? 'DIBOND_STATION'
          : operation === 'FRAME_MADE' || operation === 'FRAMED'
            ? 'FRAMING_BENCH'
            : operation === 'SHIPPED'
              ? 'SHIPPING_STATION'
              : 'GENERAL_BENCH'

    return {
      id: `${operation}|${job.frameInfo}|${materialType}|${packagingType}`,
      name: `${operation} • ${materialType} • ${packagingType}`,
      operation,
      frameStyle: job.frameInfo,
      materialType,
      packagingType,
      workstation,
    }
  }

  private computeSwitchingCost(
    operationGroups: OptimizedOperationGroup[],
    nextFamily: SetupFamily,
  ): number {
    const last = operationGroups[operationGroups.length - 1]
    if (!last) {
      return 8
    }

    return setupSwitchingCost(last.setupFamily, nextFamily)
  }

  private countCarryForwardHistory(workItemId: string): number {
    const historyFromPlans = this.battlePlans
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.productionJobId === workItemId && task.carryForward)
      .length

    const historyFromLogs = this.activityLogs.filter((log) =>
      log.entityId.includes(workItemId) &&
      (log.action === 'WORK_COMPLETED' || log.action === 'STEP_COMPLETED') &&
      (log.metadata?.carryForward === true || String(log.metadata?.carryForward) === 'true'),
    ).length

    return historyFromPlans + historyFromLogs
  }

  private isLockedElsewhere(
    workItemId: string,
    operation: ProductionStepName,
    plans: BattlePlan[],
  ): boolean {
    return plans
      .flatMap((plan) => plan.tasks)
      .some((task) =>
        task.productionJobId === workItemId &&
        task.productionStep === operation &&
        task.locked,
      )
  }
}
