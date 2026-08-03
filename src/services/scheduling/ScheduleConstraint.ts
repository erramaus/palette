export type MaterialReadiness = 'READY' | 'LIMITED' | 'MISSING' | 'UNKNOWN'

export interface ScheduleConstraint {
  operationId: string
  materialReadiness: MaterialReadiness
  approvalReady: boolean
  lockedEmployeeId?: string
  lockedStart?: string
  overtimeApproved?: boolean
}