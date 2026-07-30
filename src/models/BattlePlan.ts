import type { BattlePlan as BattlePlanShape, BattlePlanStatus } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class BattlePlan extends BaseEntity implements BattlePlanShape {
  date: string
  department?: string
  createdBy?: string
  notes: string
  status: BattlePlanStatus
  items: BattlePlanShape['items']

  constructor(init: EntityInit<BattlePlanShape>) {
    super(init)
    this.id = init.id ?? createEntityId('battle_plan')
    this.date = init.date
    this.department = init.department
    this.createdBy = init.createdBy
    this.notes = init.notes
    this.status = init.status
    this.items = init.items ?? []
  }
}
