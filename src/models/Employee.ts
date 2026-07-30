import type { Employee as EmployeeShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Employee extends BaseEntity implements EmployeeShape {
  employeeNumber: string
  fullName: string
  role: EmployeeShape['role']
  departmentId?: string
  email?: string
  active: boolean
  hiredAt?: string
  skillStepNames: string[]

  constructor(init: EntityInit<EmployeeShape>) {
    super(init)
    this.id = init.id ?? createEntityId('employee')
    this.employeeNumber = init.employeeNumber
    this.fullName = init.fullName
    this.role = init.role
    this.departmentId = init.departmentId
    this.email = init.email
    this.active = init.active
    this.hiredAt = init.hiredAt
    this.skillStepNames = init.skillStepNames ?? []
  }
}
