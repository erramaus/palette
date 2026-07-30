import type { TagCheckpoint as TagCheckpointShape } from '../types/entities'

export class TagCheckpoint implements TagCheckpointShape {
  key: TagCheckpointShape['key']
  label: string
  value: string

  constructor(init: TagCheckpointShape) {
    this.key = init.key
    this.label = init.label
    this.value = init.value
  }
}
