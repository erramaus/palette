import type { ProductionStepName } from './production'

export type BattlePlanGenerationType = 'AUTOMATIC' | 'MANUAL'

export type BattlePlanStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'

export interface BattlePlanTask {
  id: string
  productionJobId: string
  productionStep: ProductionStepName
  description: string
  estimatedMinutes: number
  completed: boolean
  sortOrder: number
  notes: string
  carryForward: boolean
  locked: boolean
  productionOperationId?: string
  productionOperationName?: string
  productionOperationStatus?: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETE'
  operationAssignedEmployeeId?: string
  operationDueDate?: string
  operationPriority?: number
}

export interface BattlePlan {
  id: string
  date: string
  assignedWorkerId: string
  createdById: string
  approvedById: string
  availableMinutes: number
  generationType: BattlePlanGenerationType
  status: BattlePlanStatus
  tasks: BattlePlanTask[]
  endOfDayNotes: string
}
