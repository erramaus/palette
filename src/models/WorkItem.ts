import type { WorkItem as WorkItemShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class WorkItem extends BaseEntity implements WorkItemShape {
  workItemNumber: string
  type: string
  customerId: string
  orderId: string
  productId: string
  artworkId?: string
  workflowId: string
  currentStageId: string
  assignedDepartmentId?: string
  assignedEmployeeId?: string
  dueDate?: string
  startDate?: string
  completedDate?: string
  notes: string[]
  attachments: WorkItemShape['attachments']
  tags: string[]
  customFields: Record<string, unknown>
  activityHistory: WorkItemShape['activityHistory']

  // Legacy compatibility fields.
  currentWorkflowStageId?: string
  dueAt?: string
  currentStepId?: string
  productionStepIds: string[]
  tagLabels: string[]
  quantity: number
  status: WorkItemShape['status']
  priority: number

  constructor(init: EntityInit<WorkItemShape>) {
    super(init)
    this.id = init.id ?? createEntityId('workitem')
    this.workItemNumber = init.workItemNumber ?? `WI-${this.id.slice(-8).toUpperCase()}`
    this.type = init.type
    this.customerId = init.customerId
    this.orderId = init.orderId
    this.productId = init.productId
    this.artworkId = init.artworkId
    this.workflowId = init.workflowId
    this.currentStageId = init.currentStageId
    this.assignedDepartmentId = init.assignedDepartmentId
    this.assignedEmployeeId = init.assignedEmployeeId
    this.dueDate = init.dueDate
    this.startDate = init.startDate
    this.completedDate = init.completedDate
    this.notes = init.notes ?? []
    this.attachments = init.attachments ?? []
    this.tags = init.tags ?? []
    this.customFields = init.customFields ?? {}
    this.activityHistory = init.activityHistory ?? []

    this.currentWorkflowStageId = init.currentWorkflowStageId ?? this.currentStageId
    this.quantity = init.quantity
    this.status = init.status
    this.priority = init.priority
    this.dueAt = init.dueAt ?? this.dueDate
    this.currentStepId = init.currentStepId
    this.productionStepIds = init.productionStepIds ?? []
    this.tagLabels = init.tagLabels ?? this.tags
  }
}
