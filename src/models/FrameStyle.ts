import type { FrameStyle as FrameStyleShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class FrameStyle extends BaseEntity implements FrameStyleShape {
  name: string
  normalizedKey: string
  increaseInches: number
  appliesToPaperAsPicture: boolean

  constructor(init: EntityInit<FrameStyleShape>) {
    super(init)
    this.id = init.id ?? createEntityId('frame_style')
    this.name = init.name
    this.normalizedKey = init.normalizedKey
    this.increaseInches = init.increaseInches
    this.appliesToPaperAsPicture = init.appliesToPaperAsPicture
  }
}
