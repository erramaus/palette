import type { ProductionStepName } from '../../types/production'
import type { ProductionOperationName, ProductionOperationStatus } from '../ProductionPipelineService'
import type { EmployeeCalendar, EmployeeCapacity } from './EmployeeCalendar'
import type { ProductionCalendar, WorkCenterCalendar } from './ProductionCalendar'
import type { ScheduleConflict } from './ScheduleConflict'
import type { ScheduleConstraint } from './ScheduleConstraint'
import type { ScheduleEntry } from './ScheduleEntry'
import type { ScheduleResult, WorkCenterCapacity } from './ScheduleResult'
import type { SchedulingRule } from './SchedulingRule'

export type SchedulingCategory = 'ORIGINAL' | 'CUSTOMER' | 'GALLERY'

export interface SchedulingOperation {
  id: string
  workItemId: string
  orderNumber: string
  pieceLabel: string
  operation: ProductionOperationName
  status: ProductionOperationStatus
  estimatedMinutes: number
  cutMemberCount?: number
  cutLinearInches?: number
  cutCalculationStatus?: 'CONFIRMED' | 'NEEDS_REVIEW'
  tagStatus?: import('../../types/entities').ProductionTagStatus
  dependencyIds: string[]
  dueDate: string
  priority: number
  category: SchedulingCategory
  createdAt: string
  assignedEmployeeId?: string
  workCenterId?: string
}

export interface SchedulingInput {
  operations: SchedulingOperation[]
  employees: EmployeeCalendar[]
  calendar: ProductionCalendar
  constraints?: ScheduleConstraint[]
  rules?: SchedulingRule[]
  now?: Date
}

const LEGACY_STEP_BY_OPERATION: Record<ProductionOperationName, ProductionStepName> = {
  FILES: 'FILES', PRINT: 'PRINTED', PRINTED: 'PRINTED', BASE_CUT: 'STRETCHER_BASE', BASE_ASSEMBLY: 'STRETCHER_BASE',
  STRETCHER_CUT: 'STRETCHER_BASE', STRETCHER_ASSEMBLY: 'STRETCHER_BASE', STRETCHER: 'STRETCHER_BASE', STRETCH: 'STRETCHER_BASE',
  TRIM: 'PRINTED', SLICE: 'FILES', RESIZE: 'FILES', DIBOND: 'DIBOND', MOUNT: 'MOUNTED',
  FRAME_CUT: 'FRAME_MADE', FRAME_ASSEMBLY: 'FRAME_MADE', FRAME: 'FRAMED', QC: 'SHIPPED', SHIPPING: 'SHIPPED',
}

export const DEFAULT_WORK_CENTER_BY_OPERATION: Record<ProductionOperationName, string> = {
  FILES: 'files', PRINT: 'printing', PRINTED: 'printing', BASE_CUT: 'base-shop', BASE_ASSEMBLY: 'base-shop',
  STRETCHER_CUT: 'stretching', STRETCHER_ASSEMBLY: 'stretching', STRETCHER: 'stretching', STRETCH: 'stretching',
  TRIM: 'printing', SLICE: 'files', RESIZE: 'files', DIBOND: 'dibond', MOUNT: 'mounting',
  FRAME_CUT: 'frames', FRAME_ASSEMBLY: 'frames', FRAME: 'frames', QC: 'qc', SHIPPING: 'shipping',
}

export const DEFAULT_PRODUCTION_CALENDAR: ProductionCalendar = {
  workingDays: [1, 2, 3, 4, 5],
  workdayStart: '08:00',
  workdayFinish: '17:00',
  breaks: [{ start: '12:00', finish: '12:30' }],
  holidays: [],
  workCenters: [
    ['files', 'Files'], ['printing', 'Printing'], ['dibond', 'Dibond'], ['stretching', 'Stretching'],
    ['base-shop', 'Base Shop'], ['mounting', 'Mounting'], ['frames', 'Frames'], ['qc', 'QC'], ['shipping', 'Shipping'],
  ].map(([id, name]) => ({ id, name, capacity: 1 })),
}

const categoryRank: Record<SchedulingCategory, number> = { ORIGINAL: 0, CUSTOMER: 1, GALLERY: 2 }
const dateKey = (date: Date): string => date.toISOString().slice(0, 10)
const parseTime = (value: string): [number, number] => value.split(':').map(Number) as [number, number]
const atTime = (date: Date, time: string): Date => {
  const next = new Date(date)
  const [hours, minutes] = parseTime(time)
  next.setHours(hours, minutes, 0, 0)
  return next
}

export class SchedulingService {
  schedule(input: SchedulingInput): ScheduleResult {
    const now = input.now ?? new Date()
    const constraints = new Map((input.constraints ?? []).map((constraint) => [constraint.operationId, constraint]))
    const workCenters = new Map(input.calendar.workCenters.map((center) => [center.id, center]))
    const employeeCursor = new Map(input.employees.map((employee) => [employee.employeeId, new Date(now)]))
    const employeeAssigned = new Map(input.employees.map((employee) => [employee.employeeId, 0]))
    const employeeAssignedByDay = new Map(input.employees.map((employee) => [employee.employeeId, new Map<string, number>()]))
    const centerCursors = new Map(input.calendar.workCenters.map((center) => [center.id, Array.from({ length: center.capacity }, () => new Date(now))]))
    const centerAssigned = new Map(input.calendar.workCenters.map((center) => [center.id, 0]))
    const entries: ScheduleEntry[] = []
    const conflicts: ScheduleConflict[] = []
    const finishByOperation = new Map<string, Date>()
    const pending = [...input.operations].sort((left, right) => this.compareOperations(left, right, now, input.rules ?? []))

    while (pending.length > 0) {
      const readyIndex = pending.findIndex((operation) => operation.dependencyIds.every((id) => finishByOperation.has(id) || !input.operations.some((candidate) => candidate.id === id)))
      const operation = pending.splice(readyIndex >= 0 ? readyIndex : 0, 1)[0]
      const constraint = constraints.get(operation.id)
      const workCenterId = operation.workCenterId ?? DEFAULT_WORK_CENTER_BY_OPERATION[operation.operation]
      const center = workCenters.get(workCenterId) ?? { id: workCenterId, name: workCenterId, capacity: 1 }
      if (!centerCursors.has(workCenterId)) centerCursors.set(workCenterId, [new Date(now)])
      const dependencyFinish = operation.dependencyIds.reduce((latest, id) => {
        const finish = finishByOperation.get(id)
        return finish && finish > latest ? finish : latest
      }, new Date(now))
      const employee = this.selectEmployee(operation, constraint, input.employees, employeeAssigned)
      const selectedEmployee = employee ?? input.employees[0]
      if (!employee) this.addConflict(conflicts, operation.id, 'NO_QUALIFIED_EMPLOYEE', 'CRITICAL', `No qualified employee is available for ${operation.operation}.`)
      const employeeId = selectedEmployee?.employeeId ?? 'UNASSIGNED'
      const lanes = centerCursors.get(workCenterId)!
      const laneIndex = lanes.reduce((best, cursor, index) => cursor < lanes[best] ? index : best, 0)
      const lockedStart = constraint?.lockedStart ? new Date(constraint.lockedStart) : undefined
      if (lockedStart && employeeCursor.get(employeeId) && employeeCursor.get(employeeId)! > lockedStart) {
        this.addConflict(conflicts, operation.id, 'EMPLOYEE_OVERLOAD', 'CRITICAL', 'Locked assignment overlaps existing employee work.', employeeId, workCenterId)
      }
      if (lockedStart && lanes[laneIndex] > lockedStart) {
        this.addConflict(conflicts, operation.id, 'WORK_CENTER_OVERLOAD', 'CRITICAL', 'Locked assignment overlaps work-center capacity.', employeeId, workCenterId)
      }
      let start = new Date(Math.max(
        dependencyFinish.getTime(),
        employeeCursor.get(employeeId)?.getTime() ?? now.getTime(),
        lanes[laneIndex].getTime(),
        lockedStart?.getTime() ?? 0,
      ))
      start = this.nextWorkingMoment(start, input.calendar, selectedEmployee, center)
      const dailyCapacity = (selectedEmployee?.availableMinutes ?? 0)
        + (constraint?.overtimeApproved ? selectedEmployee?.overtimeApprovedMinutes ?? 0 : 0)
      start = this.fitEmployeeDay(start, operation.estimatedMinutes, dailyCapacity, employeeAssignedByDay.get(employeeId), input.calendar, selectedEmployee, center)
      const finish = this.addWorkingMinutes(start, operation.estimatedMinutes, input.calendar, selectedEmployee, center)

      if (constraint?.materialReadiness === 'MISSING') this.addConflict(conflicts, operation.id, 'MISSING_MATERIALS', 'CRITICAL', 'Required materials are missing.', employeeId, workCenterId)
      if (constraint?.approvalReady === false) this.addConflict(conflicts, operation.id, 'MISSING_APPROVALS', 'CRITICAL', 'Required approval is missing.', employeeId, workCenterId)
      if (finish > new Date(`${operation.dueDate}T23:59:59`)) this.addConflict(conflicts, operation.id, 'LATE_COMPLETION', 'WARNING', 'Planned completion is after the due date.', employeeId, workCenterId)
      if (operation.dependencyIds.some((id) => !finishByOperation.has(id))) this.addConflict(conflicts, operation.id, 'DEPENDENCY_VIOLATION', 'CRITICAL', 'A dependency could not be scheduled before this operation.', employeeId, workCenterId)

      const assigned = (employeeAssigned.get(employeeId) ?? 0) + operation.estimatedMinutes
      employeeAssigned.set(employeeId, assigned)
      const dailyAssignments = employeeAssignedByDay.get(employeeId)
      if (dailyAssignments) dailyAssignments.set(dateKey(start), (dailyAssignments.get(dateKey(start)) ?? 0) + operation.estimatedMinutes)
      centerAssigned.set(workCenterId, (centerAssigned.get(workCenterId) ?? 0) + operation.estimatedMinutes)
      employeeCursor.set(employeeId, finish)
      lanes[laneIndex] = finish
      finishByOperation.set(operation.id, finish)
      if (selectedEmployee && operation.estimatedMinutes > dailyCapacity) {
        this.addConflict(conflicts, operation.id, 'EMPLOYEE_OVERLOAD', 'WARNING', `${selectedEmployee.employeeName} cannot fit this operation within approved daily capacity.`, employeeId, workCenterId, operation.estimatedMinutes - dailyCapacity)
      }

      const readinessRisk = constraint?.materialReadiness === 'MISSING' || constraint?.approvalReady === false || !employee
      entries.push({
        id: `schedule:${operation.id}`,
        operationId: operation.id,
        workItemId: operation.workItemId,
        orderNumber: operation.orderNumber,
        pieceLabel: operation.pieceLabel,
        operation: operation.operation,
        status: operation.status,
        plannedStart: start.toISOString(),
        plannedFinish: finish.toISOString(),
        assignedEmployee: employeeId,
        assignedWorkCenter: workCenterId,
        estimatedMinutes: operation.estimatedMinutes,
        cutMemberCount: operation.cutMemberCount,
        cutLinearInches: operation.cutLinearInches,
        cutCalculationStatus: operation.cutCalculationStatus,
        tagStatus: operation.tagStatus,
        materialReadiness: constraint?.materialReadiness ?? 'UNKNOWN',
        confidence: readinessRisk ? 'LOW' : constraint?.materialReadiness === 'LIMITED' || constraint?.materialReadiness === 'UNKNOWN' ? 'MEDIUM' : 'HIGH',
        scheduleReason: constraint?.lockedStart
          ? 'Preserved locked Battle Plan assignment.'
          : `Scheduled by category, due date, age, priority, dependency, employee, and ${center.name} capacity.${operation.cutCalculationStatus ? ` Cut input: ${operation.cutCalculationStatus}, ${operation.cutMemberCount ?? 0} members, ${operation.cutLinearInches ?? 'unresolved'} linear inches.` : ''}`,
        dependencyIds: [...operation.dependencyIds],
        dueDate: operation.dueDate,
        priority: operation.priority,
        locked: Boolean(constraint?.lockedStart),
      })
    }

    return {
      generatedAt: now.toISOString(),
      entries: entries.sort((left, right) => left.plannedStart.localeCompare(right.plannedStart)),
      conflicts,
      employeeCapacity: this.employeeCapacity(input.employees, employeeAssignedByDay, dateKey(now)),
      workCenterCapacity: this.workCenterCapacity(input.calendar, centerAssigned),
      unscheduledOperationIds: entries.filter((entry) => entry.assignedEmployee === 'UNASSIGNED').map((entry) => entry.operationId),
    }
  }

  private compareOperations(left: SchedulingOperation, right: SchedulingOperation, now: Date, rules: SchedulingRule[]): number {
    for (const rule of [...rules].sort((a, b) => a.order - b.order)) {
      const compared = rule.compare(left, right)
      if (compared !== 0) return compared
    }
    const dueRank = (operation: SchedulingOperation): number => {
      const days = Math.floor((new Date(`${operation.dueDate}T23:59:59`).getTime() - now.getTime()) / 86_400_000)
      return days < 0 ? 0 : days === 0 ? 1 : days <= 2 ? 2 : 3
    }
    return categoryRank[left.category] - categoryRank[right.category]
      || dueRank(left) - dueRank(right)
      || left.dueDate.localeCompare(right.dueDate)
      || left.createdAt.localeCompare(right.createdAt)
      || right.priority - left.priority
      || left.id.localeCompare(right.id)
  }

  private selectEmployee(operation: SchedulingOperation, constraint: ScheduleConstraint | undefined, employees: EmployeeCalendar[], assigned: Map<string, number>): EmployeeCalendar | undefined {
    const qualified = employees.filter((employee) => employee.skills.includes(LEGACY_STEP_BY_OPERATION[operation.operation]))
    const lockedId = constraint?.lockedEmployeeId
    if (lockedId) return qualified.find((employee) => employee.employeeId === lockedId)
    const existing = qualified.find((employee) => employee.employeeId === operation.assignedEmployeeId)
    return existing ?? qualified.sort((left, right) => (assigned.get(left.employeeId) ?? 0) - (assigned.get(right.employeeId) ?? 0))[0]
  }

  private nextWorkingMoment(value: Date, calendar: ProductionCalendar, employee?: EmployeeCalendar, center?: WorkCenterCalendar): Date {
    let cursor = new Date(value)
    for (let attempts = 0; attempts < 370; attempts += 1) {
      const key = dateKey(cursor)
      const unavailable = calendar.holidays.includes(key) || employee?.unavailableDates?.includes(key) || center?.unavailableDates?.includes(key)
      if (!calendar.workingDays.includes(cursor.getDay()) || unavailable) {
        cursor.setDate(cursor.getDate() + 1)
        cursor = atTime(cursor, calendar.workdayStart)
        continue
      }
      const start = atTime(cursor, calendar.workdayStart)
      const finish = atTime(cursor, calendar.workdayFinish)
      if (cursor < start) cursor = start
      if (cursor >= finish) {
        cursor.setDate(cursor.getDate() + 1)
        cursor = atTime(cursor, calendar.workdayStart)
        continue
      }
      const activeBreak = calendar.breaks.find((item) => cursor >= atTime(cursor, item.start) && cursor < atTime(cursor, item.finish))
      if (activeBreak) cursor = atTime(cursor, activeBreak.finish)
      return cursor
    }
    return cursor
  }

  private addWorkingMinutes(start: Date, minutes: number, calendar: ProductionCalendar, employee?: EmployeeCalendar, center?: WorkCenterCalendar): Date {
    let cursor = new Date(start)
    let remaining = minutes
    while (remaining > 0) {
      cursor = this.nextWorkingMoment(cursor, calendar, employee, center)
      const dayFinish = atTime(cursor, calendar.workdayFinish)
      const nextBreak = calendar.breaks.map((item) => atTime(cursor, item.start)).find((value) => value > cursor)
      const segmentFinish = nextBreak && nextBreak < dayFinish ? nextBreak : dayFinish
      const available = Math.max(0, Math.floor((segmentFinish.getTime() - cursor.getTime()) / 60_000))
      const used = Math.min(remaining, available)
      cursor = new Date(cursor.getTime() + used * 60_000)
      remaining -= used
      if (remaining > 0 && nextBreak && cursor.getTime() === nextBreak.getTime()) {
        const configured = calendar.breaks.find((item) => atTime(cursor, item.start).getTime() === cursor.getTime())
        if (configured) cursor = atTime(cursor, configured.finish)
      }
      if (available === 0) cursor = new Date(dayFinish.getTime() + 1)
    }
    return cursor
  }

  private fitEmployeeDay(start: Date, minutes: number, capacity: number, assignedByDay: Map<string, number> | undefined, calendar: ProductionCalendar, employee?: EmployeeCalendar, center?: WorkCenterCalendar): Date {
    if (!assignedByDay || capacity <= 0 || minutes > capacity) return start
    let cursor = new Date(start)
    while ((assignedByDay.get(dateKey(cursor)) ?? 0) + minutes > capacity) {
      cursor.setDate(cursor.getDate() + 1)
      cursor = this.nextWorkingMoment(atTime(cursor, calendar.workdayStart), calendar, employee, center)
    }
    return cursor
  }

  private employeeCapacity(employees: EmployeeCalendar[], assignedByDay: Map<string, Map<string, number>>, day: string): EmployeeCapacity[] {
    return employees.map((employee) => {
      const assignedMinutes = assignedByDay.get(employee.employeeId)?.get(day) ?? 0
      const total = employee.availableMinutes + (employee.overtimeApprovedMinutes ?? 0)
      return {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        availableMinutes: total,
        assignedMinutes,
        remainingMinutes: Math.max(0, total - assignedMinutes),
        utilization: total > 0 ? Math.round((assignedMinutes / total) * 100) : 0,
        overtimeMinutes: Math.max(0, assignedMinutes - employee.availableMinutes),
      }
    })
  }

  private workCenterCapacity(calendar: ProductionCalendar, assigned: Map<string, number>): WorkCenterCapacity[] {
    const [startHours, startMinutes] = parseTime(calendar.workdayStart)
    const [finishHours, finishMinutes] = parseTime(calendar.workdayFinish)
    const breakMinutes = calendar.breaks.reduce((sum, item) => {
      const [startHour, startMinute] = parseTime(item.start)
      const [finishHour, finishMinute] = parseTime(item.finish)
      return sum + (finishHour * 60 + finishMinute) - (startHour * 60 + startMinute)
    }, 0)
    const dailyMinutes = (finishHours * 60 + finishMinutes) - (startHours * 60 + startMinutes) - breakMinutes
    return calendar.workCenters.map((center) => {
      const assignedMinutes = assigned.get(center.id) ?? 0
      const capacityMinutes = dailyMinutes * center.capacity
      return { workCenterId: center.id, workCenterName: center.name, assignedMinutes, capacityMinutes, utilization: capacityMinutes > 0 ? Math.round((assignedMinutes / capacityMinutes) * 100) : 0 }
    })
  }

  private addConflict(conflicts: ScheduleConflict[], operationId: string, type: ScheduleConflict['type'], severity: ScheduleConflict['severity'], message: string, employeeId?: string, workCenterId?: string, minutes?: number): void {
    conflicts.push({ id: `conflict:${operationId}:${type}`, type, operationId, severity, message, employeeId, workCenterId, minutes })
  }
}