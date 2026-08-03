import { describe, expect, it } from 'vitest'
import { DEFAULT_PRODUCTION_CALENDAR, SchedulingService, type SchedulingInput } from './SchedulingService'

const baseInput = (): SchedulingInput => ({
  now: new Date(2026, 7, 3, 11, 30),
  calendar: DEFAULT_PRODUCTION_CALENDAR,
  employees: [{
    employeeId: 'employee-files',
    employeeName: 'Files Worker',
    skills: ['FILES', 'PRINTED'],
    availableMinutes: 180,
  }],
  constraints: [
    { operationId: 'operation-1', materialReadiness: 'READY', approvalReady: true },
    { operationId: 'operation-2', materialReadiness: 'READY', approvalReady: true },
  ],
  operations: [{
    id: 'operation-1', workItemId: 'workitem-1', orderNumber: 'WEB-1', pieceLabel: '24x30 Canvas',
    operation: 'FILES', status: 'READY', estimatedMinutes: 60, dependencyIds: [], dueDate: '2026-08-04',
    priority: 80, category: 'CUSTOMER', createdAt: '2026-08-01T08:00:00.000Z', assignedEmployeeId: 'employee-files',
  }, {
    id: 'operation-2', workItemId: 'workitem-1', orderNumber: 'WEB-1', pieceLabel: '24x30 Canvas',
    operation: 'PRINTED', status: 'PENDING', estimatedMinutes: 90, dependencyIds: ['operation-1'], dueDate: '2026-08-04',
    priority: 80, category: 'CUSTOMER', createdAt: '2026-08-01T08:00:00.000Z', assignedEmployeeId: 'employee-files',
  }],
})

describe('SchedulingService', () => {
  it('schedules every operation after dependencies while respecting breaks and capacity', () => {
    const result = new SchedulingService().schedule(baseInput())
    const first = result.entries.find((entry) => entry.operationId === 'operation-1')!
    const second = result.entries.find((entry) => entry.operationId === 'operation-2')!

    expect(result.entries).toHaveLength(2)
    expect(new Date(second.plannedStart).getTime()).toBeGreaterThanOrEqual(new Date(first.plannedFinish).getTime())
    expect(new Date(first.plannedFinish).getHours()).toBe(13)
    expect(new Date(first.plannedFinish).getMinutes()).toBe(0)
    expect(result.employeeCapacity[0]).toMatchObject({ assignedMinutes: 150, remainingMinutes: 30, utilization: 83 })
    expect(result.conflicts.some((conflict) => conflict.type === 'EMPLOYEE_OVERLOAD')).toBe(false)
  })

  it('preserves locked Battle Plan assignments and skips company holidays', () => {
    const input = baseInput()
    input.calendar = { ...DEFAULT_PRODUCTION_CALENDAR, holidays: ['2026-08-03'] }
    input.constraints = input.constraints?.map((constraint) => constraint.operationId === 'operation-1'
      ? { ...constraint, lockedEmployeeId: 'employee-files', lockedStart: '2026-08-03T09:00:00.000Z' }
      : constraint)
    const result = new SchedulingService().schedule(input)
    const locked = result.entries.find((entry) => entry.operationId === 'operation-1')!

    expect(locked.locked).toBe(true)
    expect(locked.assignedEmployee).toBe('employee-files')
    expect(locked.plannedStart.slice(0, 10)).toBe('2026-08-04')
  })

  it('returns structured material, approval, late, and overload conflicts', () => {
    const input = baseInput()
    input.employees[0].availableMinutes = 30
    input.operations[0].dueDate = '2026-08-02'
    input.constraints = [
      { operationId: 'operation-1', materialReadiness: 'MISSING', approvalReady: false },
      { operationId: 'operation-2', materialReadiness: 'READY', approvalReady: true },
    ]
    const result = new SchedulingService().schedule(input)
    const types = new Set(result.conflicts.map((conflict) => conflict.type))

    expect(types.has('MISSING_MATERIALS')).toBe(true)
    expect(types.has('MISSING_APPROVALS')).toBe(true)
    expect(types.has('LATE_COMPLETION')).toBe(true)
    expect(types.has('EMPLOYEE_OVERLOAD')).toBe(true)
    expect(result.entries[0].confidence).toBe('LOW')
  })
})