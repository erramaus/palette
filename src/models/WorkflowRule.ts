import type { WorkflowRule as WorkflowRuleShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class WorkflowRule extends BaseEntity implements WorkflowRuleShape {
  workflowId: string
  code: string
  name: string
  description?: string
  fieldPath: string
  operator: WorkflowRuleShape['operator']
  expectedValue?: WorkflowRuleShape['expectedValue']
  errorMessage?: string
  isActive: boolean

  constructor(init: EntityInit<WorkflowRuleShape>) {
    super(init)
    this.id = init.id ?? createEntityId('workflow_rule')
    this.workflowId = init.workflowId
    this.code = init.code
    this.name = init.name
    this.description = init.description
    this.fieldPath = init.fieldPath
    this.operator = init.operator
    this.expectedValue = init.expectedValue
    this.errorMessage = init.errorMessage
    this.isActive = init.isActive
  }
}
