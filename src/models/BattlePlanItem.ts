import type { BattlePlanItem as BattlePlanItemShape } from '../types/entities'

export class BattlePlanItem implements BattlePlanItemShape {
  workItemId: string
  sequence: number
  assignedEmployee?: string
  assignedDepartment?: string
  estimatedMinutes: number
  currentWorkflowStage: string
  dueDate?: string
  priority: number
  notes: string[]

  constructor(init: BattlePlanItemShape) {
    this.workItemId = init.workItemId
    this.sequence = init.sequence
    this.assignedEmployee = init.assignedEmployee
    this.assignedDepartment = init.assignedDepartment
    this.estimatedMinutes = init.estimatedMinutes
    this.currentWorkflowStage = init.currentWorkflowStage
    this.dueDate = init.dueDate
    this.priority = init.priority
    this.notes = init.notes ?? []
  }
}
