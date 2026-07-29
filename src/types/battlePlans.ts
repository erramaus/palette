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
