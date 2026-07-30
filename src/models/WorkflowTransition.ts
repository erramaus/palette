import type { WorkflowTransition as WorkflowTransitionShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class WorkflowTransition extends BaseEntity implements WorkflowTransitionShape {
  workflowId: string
  fromStageId: string
  toStageId: string
  transitionName?: string
  allowBackward: boolean
  requiredApprovals: WorkflowTransitionShape['requiredApprovals']
  validationRuleIds: string[]

  constructor(init: EntityInit<WorkflowTransitionShape>) {
    super(init)
    this.id = init.id ?? createEntityId('workflow_transition')
    this.workflowId = init.workflowId
    this.fromStageId = init.fromStageId
    this.toStageId = init.toStageId
    this.transitionName = init.transitionName
    this.allowBackward = init.allowBackward
    this.requiredApprovals = init.requiredApprovals ?? []
    this.validationRuleIds = init.validationRuleIds ?? []
  }
}
