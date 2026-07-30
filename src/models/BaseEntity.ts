import type { AuditedEntity, IsoDateTime } from '../types/entities'
import { nowIso } from '../utils/time'

export type EntityInit<T extends AuditedEntity> = Omit<T, keyof AuditedEntity> &
  Partial<Pick<AuditedEntity, 'id' | 'createdAt' | 'updatedAt'>>

export abstract class BaseEntity implements AuditedEntity {
  id: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime

  protected constructor(init: Partial<AuditedEntity>) {
    const createdAt = init.createdAt ?? nowIso()

    this.id = init.id ?? ''
    this.createdAt = createdAt
    this.updatedAt = init.updatedAt ?? createdAt
  }

  touch(): void {
    this.updatedAt = nowIso()
  }
}
