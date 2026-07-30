import type { Department as DepartmentShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Department extends BaseEntity implements DepartmentShape {
  code: string
  name: string
  managerEmployeeId?: string
  employeeIds: string[]
  description?: string

  constructor(init: EntityInit<DepartmentShape>) {
    super(init)
    this.id = init.id ?? createEntityId('department')
    this.code = init.code
    this.name = init.name
    this.managerEmployeeId = init.managerEmployeeId
    this.employeeIds = init.employeeIds ?? []
    this.description = init.description
  }
}
