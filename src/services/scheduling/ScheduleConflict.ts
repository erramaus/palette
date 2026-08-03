export type ScheduleConflictType =
  | 'EMPLOYEE_OVERLOAD'
  | 'WORK_CENTER_OVERLOAD'
  | 'DEPENDENCY_VIOLATION'
  | 'MISSING_MATERIALS'
  | 'MISSING_APPROVALS'
  | 'LATE_COMPLETION'
  | 'NO_QUALIFIED_EMPLOYEE'

export interface ScheduleConflict {
  id: string
  type: ScheduleConflictType
  operationId: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
  employeeId?: string
  workCenterId?: string
  minutes?: number
}