import type { ActivityLog as ActivityLogShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class ActivityLog extends BaseEntity implements ActivityLogShape {
  entityType: ActivityLogShape['entityType']
  entityId: string
  action: ActivityLogShape['action']
  actorEmployeeId?: string
  occurredAt: string
  metadata?: Record<string, string | number | boolean | null>

  constructor(init: EntityInit<ActivityLogShape>) {
    super(init)
    this.id = init.id ?? createEntityId('activity')
    this.entityType = init.entityType
    this.entityId = init.entityId
    this.action = init.action
    this.actorEmployeeId = init.actorEmployeeId
    this.occurredAt = init.occurredAt ?? nowIso()
    this.metadata = init.metadata
  }
}
