import type { BaseStyle as BaseStyleShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class BaseStyle extends BaseEntity implements BaseStyleShape {
  name: string
  normalizedKey: string
  adjustmentInches: number

  constructor(init: EntityInit<BaseStyleShape>) {
    super(init)
    this.id = init.id ?? createEntityId('base_style')
    this.name = init.name
    this.normalizedKey = init.normalizedKey
    this.adjustmentInches = init.adjustmentInches
  }
}
