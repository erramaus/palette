import type { ProductionStepName } from '../../types/production'

export interface EmployeeCalendar {
  employeeId: string
  employeeName: string
  skills: ProductionStepName[]
  availableMinutes: number
  overtimeApprovedMinutes?: number
  unavailableDates?: string[]
}

export interface EmployeeCapacity {
  employeeId: string
  employeeName: string
  availableMinutes: number
  assignedMinutes: number
  remainingMinutes: number
  utilization: number
  overtimeMinutes: number
}