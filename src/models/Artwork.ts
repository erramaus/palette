import type { Artwork as ArtworkShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Artwork extends BaseEntity implements ArtworkShape {
  customerId: string
  title: string
  fileUri: string
  colorProfile?: string
  revision: number
  approvedAt?: string

  constructor(init: EntityInit<ArtworkShape>) {
    super(init)
    this.id = init.id ?? createEntityId('artwork')
    this.customerId = init.customerId
    this.title = init.title
    this.fileUri = init.fileUri
    this.colorProfile = init.colorProfile
    this.revision = init.revision
    this.approvedAt = init.approvedAt
  }
}
