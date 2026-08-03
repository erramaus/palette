import type { ProductionOperationName, ProductionOperationStatus } from '../ProductionPipelineService'

export type ScheduleConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ScheduleEntry {
  id: string
  operationId: string
  workItemId: string
  orderNumber: string
  pieceLabel: string
  operation: ProductionOperationName
  status: ProductionOperationStatus
  plannedStart: string
  plannedFinish: string
  assignedEmployee: string
  assignedWorkCenter: string
  estimatedMinutes: number
  confidence: ScheduleConfidence
  scheduleReason: string
  dependencyIds: string[]
  dueDate: string
  priority: number
  locked: boolean
}