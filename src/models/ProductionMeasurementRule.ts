import type { ProductionMeasurementRule as ProductionMeasurementRuleShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ProductionMeasurementRule
  extends BaseEntity
  implements ProductionMeasurementRuleShape
{
  ruleType: ProductionMeasurementRuleShape['ruleType']
  targetKey: string
  adjustment: number
  unit: 'INCHES'
  active: boolean
  notes?: string

  constructor(init: EntityInit<ProductionMeasurementRuleShape>) {
    super(init)
    this.id = init.id ?? createEntityId('measurement_rule')
    this.ruleType = init.ruleType
    this.targetKey = init.targetKey
    this.adjustment = init.adjustment
    this.unit = init.unit
    this.active = init.active
    this.notes = init.notes
  }
}
