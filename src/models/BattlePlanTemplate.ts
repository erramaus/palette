import type { BattlePlanTemplate as BattlePlanTemplateShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class BattlePlanTemplate extends BaseEntity implements BattlePlanTemplateShape {
  name: string
  department?: string
  defaultEstimatedMinutesByType: Record<string, number>
  defaultItemNotes: string[]
  active: boolean

  constructor(init: EntityInit<BattlePlanTemplateShape>) {
    super(init)
    this.id = init.id ?? createEntityId('battle_plan_template')
    this.name = init.name
    this.department = init.department
    this.defaultEstimatedMinutesByType = init.defaultEstimatedMinutesByType
    this.defaultItemNotes = init.defaultItemNotes ?? []
    this.active = init.active
  }
}
