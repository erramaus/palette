import {
  Workflow,
  WorkflowRule,
  WorkflowStage,
  WorkflowTransition,
  WorkItem,
} from '../models'
import type {
  WorkflowApprovalRequirement,
  WorkflowRuleOperator,
  WorkflowStage as WorkflowStageShape,
  WorkItemStatus,
} from '../types/entities'

interface CreateWorkflowStageInput {
  name: string
  description?: string
  sequence: number
  department?: string
  requiredRoles?: string[]
  requiredApprovals?: WorkflowApprovalRequirement[]
  estimatedDuration: number
  isRequired?: boolean
  canSkip?: boolean
  completionRules?: string[]
}

interface CreateWorkflowTransitionInput {
  fromStageSequence: number
  toStageSequence: number
  transitionName?: string
  allowBackward?: boolean
  requiredApprovals?: WorkflowApprovalRequirement[]
  validationRuleCodes?: string[]
}

interface CreateWorkflowRuleInput {
  code: string
  name: string
  description?: string
  fieldPath: string
  operator: WorkflowRuleOperator
  expectedValue?: string | number | boolean | string[] | number[]
  errorMessage?: string
  isActive?: boolean
}

interface CreateWorkflowInput {
  name: string
  workflowType: string
  version?: number
  departmentId?: string
  isActive?: boolean
  initialStageSequence?: number
  stages: CreateWorkflowStageInput[]
  transitions?: CreateWorkflowTransitionInput[]
  rules?: CreateWorkflowRuleInput[]
}

interface TransitionApproval {
  role: string
  approvedByEmployeeId: string
}

interface TransitionValidationRequest {
  workItem: WorkItem
  workflow: Workflow
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
  rules: WorkflowRule[]
  toStageId: string
  approvals?: TransitionApproval[]
  facts?: Record<string, unknown>
}

export interface WorkflowTransitionContext extends Omit<TransitionValidationRequest, 'toStageId'> {}
export interface WorkflowTransitionApproval extends TransitionApproval {}

interface TransitionValidationResult {
  valid: boolean
  errors: string[]
}

interface ApprovalValidationResult {
  valid: boolean
  errors: string[]
}

interface WorkflowBundle {
  workflow: Workflow
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
  rules: WorkflowRule[]
}

export class WorkflowService {
  createWorkflow(input: CreateWorkflowInput): WorkflowBundle {
    const workflow = new Workflow({
      name: input.name,
      workflowType: input.workflowType,
      version: input.version ?? 1,
      departmentId: input.departmentId,
      isActive: input.isActive ?? true,
      stageIds: [],
      transitionIds: [],
      ruleIds: [],
      stepTemplateIds: [],
    })

    const sortedStageInputs = [...input.stages].sort((a, b) => a.sequence - b.sequence)
    const stages = sortedStageInputs.map(
      (stageInput) =>
        new WorkflowStage({
          workflowId: workflow.id,
          name: stageInput.name,
          description: stageInput.description,
          sequence: stageInput.sequence,
          department: stageInput.department,
          requiredRoles: stageInput.requiredRoles ?? [],
          requiredApprovals: stageInput.requiredApprovals ?? [],
          estimatedDuration: stageInput.estimatedDuration,
          isRequired: stageInput.isRequired ?? true,
          canSkip: stageInput.canSkip ?? false,
          completionRules: stageInput.completionRules ?? [],
        }),
    )

    const rules = (input.rules ?? []).map(
      (ruleInput) =>
        new WorkflowRule({
          workflowId: workflow.id,
          code: ruleInput.code,
          name: ruleInput.name,
          description: ruleInput.description,
          fieldPath: ruleInput.fieldPath,
          operator: ruleInput.operator,
          expectedValue: ruleInput.expectedValue,
          errorMessage: ruleInput.errorMessage,
          isActive: ruleInput.isActive ?? true,
        }),
    )

    const ruleIdByCode = new Map(rules.map((rule) => [rule.code, rule.id]))
    const stageBySequence = new Map(stages.map((stage) => [stage.sequence, stage]))

    for (const stage of stages) {
      stage.completionRules = stage.completionRules
        .map((ruleCodeOrId) => ruleIdByCode.get(ruleCodeOrId) ?? ruleCodeOrId)
        .filter((value): value is string => value.length > 0)
      stage.touch()
    }

    const transitions = (input.transitions ?? this.createDefaultSequentialTransitions(stages)).map(
      (transitionInput) => {
        const fromStage = stageBySequence.get(transitionInput.fromStageSequence)
        const toStage = stageBySequence.get(transitionInput.toStageSequence)

        if (!fromStage || !toStage) {
          throw new Error('Transition references unknown stage sequence')
        }

        return new WorkflowTransition({
          workflowId: workflow.id,
          fromStageId: fromStage.id,
          toStageId: toStage.id,
          transitionName: transitionInput.transitionName,
          allowBackward: transitionInput.allowBackward ?? false,
          requiredApprovals: transitionInput.requiredApprovals ?? [],
          validationRuleIds: (transitionInput.validationRuleCodes ?? [])
            .map((ruleCode) => ruleIdByCode.get(ruleCode))
            .filter((ruleId): ruleId is string => Boolean(ruleId)),
        })
      },
    )

    workflow.stageIds = stages.map((stage) => stage.id)
    workflow.transitionIds = transitions.map((transition) => transition.id)
    workflow.ruleIds = rules.map((rule) => rule.id)

    const configuredInitial =
      input.initialStageSequence !== undefined
        ? stageBySequence.get(input.initialStageSequence)
        : stages[0]

    workflow.initialStageId = configuredInitial?.id
    workflow.touch()

    return {
      workflow,
      stages,
      transitions,
      rules,
    }
  }

  assignWorkflow(workItem: WorkItem, workflow: Workflow, stages: WorkflowStage[]): WorkItem {
    const sortedStages = this.sortedStages(stages)
    const initialStageId = workflow.initialStageId ?? sortedStages[0]?.id

    if (!initialStageId) {
      throw new Error(`Workflow ${workflow.id} has no stages to assign`)
    }

    workItem.workflowId = workflow.id
    workItem.currentStageId = initialStageId
    workItem.currentWorkflowStageId = initialStageId
    workItem.status = this.mapWorkflowStatusToWorkItemStatus(false, false)
    workItem.touch()

    return workItem
  }

  moveToNextStage(request: Omit<TransitionValidationRequest, 'toStageId'>): WorkItem {
    const currentStage = this.getCurrentStage(request.workItem, request.stages)
    if (!currentStage) {
      throw new Error(`WorkItem ${request.workItem.id} does not have a current stage`)
    }

    const sorted = this.sortedStages(request.stages)
    const currentIndex = sorted.findIndex((stage) => stage.id === currentStage.id)
    if (currentIndex < 0 || currentIndex === sorted.length - 1) {
      return request.workItem
    }

    const targetStage = sorted[currentIndex + 1]
    return this.applyStageChange({
      ...request,
      toStageId: targetStage.id,
    })
  }

  moveToPreviousStage(request: Omit<TransitionValidationRequest, 'toStageId'>): WorkItem {
    const currentStage = this.getCurrentStage(request.workItem, request.stages)
    if (!currentStage) {
      throw new Error(`WorkItem ${request.workItem.id} does not have a current stage`)
    }

    const sorted = this.sortedStages(request.stages)
    const currentIndex = sorted.findIndex((stage) => stage.id === currentStage.id)
    if (currentIndex <= 0) {
      return request.workItem
    }

    const targetStage = sorted[currentIndex - 1]
    return this.applyStageChange({
      ...request,
      toStageId: targetStage.id,
    })
  }

  jumpToStage(request: TransitionValidationRequest): WorkItem {
    return this.applyStageChange(request)
  }

  validateTransition(request: TransitionValidationRequest): TransitionValidationResult {
    const errors: string[] = []
    const currentStage = this.getCurrentStage(request.workItem, request.stages)
    const targetStage = request.stages.find((stage) => stage.id === request.toStageId)

    if (!currentStage) {
      errors.push('WorkItem does not currently reference a valid workflow stage')
      return { valid: false, errors }
    }

    if (!targetStage) {
      errors.push(`Target stage ${request.toStageId} was not found in the workflow`)
      return { valid: false, errors }
    }

    const transition = request.transitions.find(
      (candidate) =>
        candidate.workflowId === request.workflow.id &&
        candidate.fromStageId === currentStage.id &&
        candidate.toStageId === targetStage.id,
    )

    if (!transition) {
      errors.push(`No configured transition from ${currentStage.name} to ${targetStage.name}`)
      return { valid: false, errors }
    }

    const currentSequence = currentStage.sequence
    const targetSequence = targetStage.sequence

    if (targetSequence < currentSequence && !transition.allowBackward) {
      errors.push(`Backward transition from ${currentStage.name} to ${targetStage.name} is not allowed`)
    }

    const isSkippingRequiredStage = request.stages
      .filter(
        (stage) =>
          stage.sequence > currentSequence &&
          stage.sequence < targetSequence &&
          stage.isRequired &&
          !stage.canSkip,
      )
      .map((stage) => stage.name)

    if (isSkippingRequiredStage.length > 0) {
      errors.push(`Cannot skip required stages: ${isSkippingRequiredStage.join(', ')}`)
    }

    this.validateApprovalRequirements(currentStage.requiredApprovals, request.approvals, errors)
    this.validateApprovalRequirements(transition.requiredApprovals, request.approvals, errors)

    const activeRules = request.rules.filter((rule) => rule.isActive)

    for (const ruleId of currentStage.completionRules) {
      const rule = activeRules.find((candidate) => candidate.id === ruleId)
      if (!rule) {
        errors.push(`Missing completion rule ${ruleId} for stage ${currentStage.name}`)
        continue
      }

      if (!this.evaluateRule(rule, request.facts)) {
        errors.push(rule.errorMessage ?? `Completion rule ${rule.code} failed`)
      }
    }

    for (const ruleId of transition.validationRuleIds) {
      const rule = activeRules.find((candidate) => candidate.id === ruleId)
      if (!rule) {
        errors.push(`Missing transition rule ${ruleId} for transition ${transition.id}`)
        continue
      }

      if (!this.evaluateRule(rule, request.facts)) {
        errors.push(rule.errorMessage ?? `Transition rule ${rule.code} failed`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  getCurrentStage(workItem: WorkItem, stages: WorkflowStage[]): WorkflowStage | null {
    const stageId = workItem.currentStageId || workItem.currentWorkflowStageId
    if (!stageId) {
      return null
    }

    return stages.find((stage) => stage.id === stageId) ?? null
  }

  getRemainingStages(workItem: WorkItem, stages: WorkflowStage[]): WorkflowStage[] {
    const currentStage = this.getCurrentStage(workItem, stages)
    if (!currentStage) {
      return this.sortedStages(stages)
    }

    return this.sortedStages(stages).filter((stage) => stage.sequence > currentStage.sequence)
  }

  isWorkflowComplete(workItem: WorkItem, stages: WorkflowStage[]): boolean {
    if (stages.length === 0) {
      return true
    }

    const currentStage = this.getCurrentStage(workItem, stages)
    if (!currentStage) {
      return false
    }

    const terminalSequence = Math.max(...stages.map((stage) => stage.sequence))
    return currentStage.sequence >= terminalSequence
  }

  validateApprovals(
    requirements: WorkflowApprovalRequirement[],
    approvals?: TransitionApproval[],
  ): ApprovalValidationResult {
    const errors: string[] = []
    this.validateApprovalRequirements(requirements, approvals, errors)

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private applyStageChange(request: TransitionValidationRequest): WorkItem {
    const validation = this.validateTransition(request)
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '))
    }

    const targetStage = request.stages.find((stage) => stage.id === request.toStageId)
    if (!targetStage) {
      throw new Error(`Target stage ${request.toStageId} was not found`)
    }

    request.workItem.currentStageId = targetStage.id
    request.workItem.currentWorkflowStageId = targetStage.id

    const isComplete = this.isLastStage(targetStage, request.stages)
    request.workItem.status = this.mapWorkflowStatusToWorkItemStatus(false, isComplete)
    request.workItem.touch()

    return request.workItem
  }

  private validateApprovalRequirements(
    requirements: WorkflowApprovalRequirement[],
    approvals: TransitionApproval[] | undefined,
    errors: string[],
  ): void {
    if (requirements.length === 0) {
      return
    }

    const providedApprovals = approvals ?? []

    for (const requirement of requirements) {
      const approvalCount = providedApprovals.filter(
        (approval) => approval.role === requirement.role,
      ).length

      if (approvalCount < requirement.minimumApprovals) {
        errors.push(
          `Approval requirement not met for role ${requirement.role}: required ${requirement.minimumApprovals}, received ${approvalCount}`,
        )
      }
    }
  }

  private evaluateRule(rule: WorkflowRule, facts: Record<string, unknown> | undefined): boolean {
    const currentValue = this.getValueByPath(facts ?? {}, rule.fieldPath)

    if (rule.operator === 'EXISTS') {
      return currentValue !== undefined && currentValue !== null
    }

    if (rule.operator === 'INCLUDES') {
      if (!Array.isArray(currentValue)) {
        return false
      }

      return currentValue.includes(rule.expectedValue as never)
    }

    if (currentValue === undefined) {
      return false
    }

    switch (rule.operator) {
      case 'EQUALS':
        return currentValue === rule.expectedValue
      case 'NOT_EQUALS':
        return currentValue !== rule.expectedValue
      case 'GREATER_THAN':
        return Number(currentValue) > Number(rule.expectedValue)
      case 'GREATER_THAN_OR_EQUAL':
        return Number(currentValue) >= Number(rule.expectedValue)
      case 'LESS_THAN':
        return Number(currentValue) < Number(rule.expectedValue)
      case 'LESS_THAN_OR_EQUAL':
        return Number(currentValue) <= Number(rule.expectedValue)
      default:
        return false
    }
  }

  private getValueByPath(source: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.').filter((part) => part.length > 0)

    let cursor: unknown = source
    for (const part of parts) {
      if (typeof cursor !== 'object' || cursor === null || !(part in cursor)) {
        return undefined
      }

      cursor = (cursor as Record<string, unknown>)[part]
    }

    return cursor
  }

  private sortedStages(stages: WorkflowStage[]): WorkflowStage[] {
    return [...stages].sort((a, b) => a.sequence - b.sequence)
  }

  private createDefaultSequentialTransitions(
    stages: WorkflowStage[],
  ): CreateWorkflowTransitionInput[] {
    const sorted = this.sortedStages(stages)

    const defaults: CreateWorkflowTransitionInput[] = []
    for (let index = 0; index < sorted.length - 1; index += 1) {
      defaults.push({
        fromStageSequence: sorted[index].sequence,
        toStageSequence: sorted[index + 1].sequence,
        allowBackward: false,
      })
    }

    return defaults
  }

  private isLastStage(stage: WorkflowStageShape, allStages: WorkflowStage[]): boolean {
    const maxSequence = Math.max(...allStages.map((candidate) => candidate.sequence))
    return stage.sequence === maxSequence
  }

  private mapWorkflowStatusToWorkItemStatus(
    isBlocked: boolean,
    isComplete: boolean,
  ): WorkItemStatus {
    if (isComplete) {
      return 'COMPLETE'
    }

    if (isBlocked) {
      return 'BLOCKED'
    }

    return 'READY'
  }
}
