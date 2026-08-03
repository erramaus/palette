import type { PersistenceAdapter } from './PersistenceAdapter'
import { migratePersistenceSnapshot } from './PersistenceMigration'
import { validatePersistenceSnapshot } from './PersistenceSchema'
import type { PersistenceSnapshot } from './PersistenceSnapshot'

export interface PersistenceLoadResult {
  snapshot: PersistenceSnapshot | null
  migrated: boolean
}

export class PersistenceService {
  private readonly adapter: PersistenceAdapter

  constructor(adapter: PersistenceAdapter) {
    this.adapter = adapter
  }

  load(): PersistenceLoadResult {
    const serialized = this.adapter.load()
    if (!serialized) return { snapshot: null, migrated: false }

    let parsed: unknown
    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Saved production data is not valid JSON. Restore a backup or reset local data.')
    }

    const originalVersion = typeof parsed === 'object' && parsed !== null && 'schemaVersion' in parsed
      ? Number(parsed.schemaVersion)
      : Number.NaN
    const snapshot = validatePersistenceSnapshot(migratePersistenceSnapshot(parsed))
    return { snapshot, migrated: originalVersion !== snapshot.schemaVersion }
  }

  save(snapshot: PersistenceSnapshot): void {
    const validated = validatePersistenceSnapshot(snapshot)
    this.adapter.save(JSON.stringify(validated))
  }

  exportBackup(snapshot: PersistenceSnapshot): string {
    return JSON.stringify(validatePersistenceSnapshot(snapshot), null, 2)
  }

  importBackup(serializedBackup: string): PersistenceSnapshot {
    let parsed: unknown
    try {
      parsed = JSON.parse(serializedBackup)
    } catch {
      throw new Error('Backup file is not valid JSON.')
    }
    return validatePersistenceSnapshot(migratePersistenceSnapshot(parsed))
  }

  reset(): void {
    this.adapter.remove()
  }
}