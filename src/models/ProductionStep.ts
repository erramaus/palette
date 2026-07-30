import type { ProductionStep as ProductionStepShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ProductionStep extends BaseEntity implements ProductionStepShape {
  workflowId: string
  workItemId: string
  name: string
  departmentId?: string
  sequence: number
  estimatedMinutes: number
  status: ProductionStepShape['status']
  dependsOnStepIds: string[]
  assignedEmployeeId?: string
  startedAt?: string
  completedAt?: string

  constructor(init: EntityInit<ProductionStepShape>) {
    super(init)
    this.id = init.id ?? createEntityId('step')
    this.workflowId = init.workflowId
    this.workItemId = init.workItemId
    this.name = init.name
    this.departmentId = init.departmentId
    this.sequence = init.sequence
    this.estimatedMinutes = init.estimatedMinutes
    this.status = init.status
    this.dependsOnStepIds = init.dependsOnStepIds ?? []
    this.assignedEmployeeId = init.assignedEmployeeId
    this.startedAt = init.startedAt
    this.completedAt = init.completedAt
  }
}
