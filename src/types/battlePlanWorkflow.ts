import type { BattlePlanStatus, BattlePlanTask } from './battlePlans'
import type { Employee } from './employees'
import type { DueStatus, ProductType, ProductionJob, ProductionStepName } from './production'

export type BattlePlanTaskGroupType =
  | 'START_OF_DAY'
  | 'FILES'
  | 'CANVASES_TO_PRINT'
  | 'DIBOND_TO_CUT'
  | 'STRETCHERS_TO_MAKE'
  | 'BASES_TO_MAKE'
  | 'PIECES_TO_STRETCH'
  | 'PIECES_TO_BASE'
  | 'FRAMES_TO_MAKE'
  | 'PIECES_TO_FRAME'
  | 'PIECES_TO_SHIP'
  | 'PIECES_TO_BOX'
  | 'CRATE_TO_BUILD'
  | 'CLEANING'
  | 'END_OF_DAY'
  | 'CUSTOM'

export type BattlePlanGroupStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

export interface BattlePlanChecklistItem {
  id: string
  text: string
  checked: boolean
  notes: string
  completedAt?: string
  completedBy?: string
}

export interface BattlePlanWorkItemEntry {
  id: string
  taskId: string
  workItemId: string
  workItemNumber: string
  artworkTitle: string
  customerOrDestination: string
  dueStatus: DueStatus
  productType: ProductType
  notes: string
  productionStep: ProductionStepName
  completed: boolean
  carryForward: boolean
  locked: boolean
  completedAt?: string
  completedBy?: string
}

export interface BattlePlanTaskGroup {
  id: string
  sequence: number
  type: BattlePlanTaskGroupType
  operationName: string
  totalEstimatedMinutes: number
  assignedEmployeeId: string
  status: BattlePlanGroupStatus
  notes: string
  workItems: BattlePlanWorkItemEntry[]
}

export interface BattlePlanSection {
  id: string
  title: string
  estimatedMinutes: number
  checklistItems?: BattlePlanChecklistItem[]
  taskGroups?: BattlePlanTaskGroup[]
  warning?: string
}

export interface BattlePlanEndOfDayReport {
  notes: string
  incompleteReason: string
  carryForward: boolean
  reportSent: boolean
  departureTime?: string
}

export interface BattlePlanWorkflowSnapshot {
  employee: Employee | undefined
  planStatus: BattlePlanStatus
  sections: BattlePlanSection[]
  productionGroups: BattlePlanTaskGroup[]
  startOfDay: BattlePlanSection
  cleaning: BattlePlanSection
  endOfDay: BattlePlanSection
}

export interface AddTaskGroupDraft {
  groupType: BattlePlanTaskGroupType
  customGroupName: string
  assignedEmployeeId: string
  estimatedMinutes: number
  groupNotes: string
  workItemIds: string[]
  productionStep: ProductionStepName
  sequencePosition: number
}

export type BattlePlanTaskWithJob = {
  task: BattlePlanTask
  job?: ProductionJob
}
