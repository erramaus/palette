import type { EmployeeCapacity } from './EmployeeCalendar'
import type { ScheduleConflict } from './ScheduleConflict'
import type { ScheduleEntry } from './ScheduleEntry'

export interface WorkCenterCapacity {
  workCenterId: string
  workCenterName: string
  assignedMinutes: number
  capacityMinutes: number
  utilization: number
}

export interface ScheduleResult {
  generatedAt: string
  entries: ScheduleEntry[]
  conflicts: ScheduleConflict[]
  employeeCapacity: EmployeeCapacity[]
  workCenterCapacity: WorkCenterCapacity[]
  unscheduledOperationIds: string[]
}