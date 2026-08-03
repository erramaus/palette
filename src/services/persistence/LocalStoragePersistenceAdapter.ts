import type { PersistenceAdapter } from './PersistenceAdapter'

export const PALETTE_PERSISTENCE_KEY = 'palette.production.snapshot'

export class LocalStoragePersistenceAdapter implements PersistenceAdapter {
  private readonly storage: Storage
  private readonly key: string

  constructor(storage: Storage, key = PALETTE_PERSISTENCE_KEY) {
    this.storage = storage
    this.key = key
  }

  load(): string | null {
    return this.storage.getItem(this.key)
  }

  save(serializedSnapshot: string): void {
    this.storage.setItem(this.key, serializedSnapshot)
  }

  remove(): void {
    this.storage.removeItem(this.key)
  }
}