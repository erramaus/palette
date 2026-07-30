import type { WorkflowStage as WorkflowStageShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class WorkflowStage extends BaseEntity implements WorkflowStageShape {
  workflowId: string
  name: string
  description?: string
  sequence: number
  department?: string
  requiredRoles: string[]
  requiredApprovals: WorkflowStageShape['requiredApprovals']
  estimatedDuration: number
  isRequired: boolean
  canSkip: boolean
  completionRules: string[]

  constructor(init: EntityInit<WorkflowStageShape>) {
    super(init)
    this.id = init.id ?? createEntityId('workflow_stage')
    this.workflowId = init.workflowId
    this.name = init.name
    this.description = init.description
    this.sequence = init.sequence
    this.department = init.department
    this.requiredRoles = init.requiredRoles ?? []
    this.requiredApprovals = init.requiredApprovals ?? []
    this.estimatedDuration = init.estimatedDuration
    this.isRequired = init.isRequired
    this.canSkip = init.canSkip
    this.completionRules = init.completionRules ?? []
  }
}
