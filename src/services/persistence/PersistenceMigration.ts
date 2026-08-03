import {
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  type IntelligenceReviewState,
  type PersistenceSnapshot,
  type PersistenceSnapshotV1,
} from './PersistenceSnapshot'

export interface PersistenceMigration {
  fromVersion: number
  toVersion: number
  migrate(snapshot: unknown): unknown
}

const emptyReviewState = (): IntelligenceReviewState => ({
  dismissedRecommendationIds: {},
  reviewedRecommendationIds: {},
  acceptedRecommendationIds: {},
})

export const persistenceMigrations: PersistenceMigration[] = [{
  fromVersion: 1,
  toVersion: 2,
  migrate: (snapshot) => {
    const versionOne = snapshot as PersistenceSnapshotV1
    return {
      ...versionOne,
      schemaVersion: 2,
      data: {
        ...versionOne.data,
        tagSnapshots: [],
        timelineEvents: [],
        intelligenceReviewState: emptyReviewState(),
        settings: {},
      },
    } satisfies PersistenceSnapshot
  },
}]

export const migratePersistenceSnapshot = (snapshot: unknown): unknown => {
  let migrated = snapshot
  let version = typeof migrated === 'object' && migrated !== null && 'schemaVersion' in migrated
    ? Number(migrated.schemaVersion)
    : Number.NaN

  while (version < CURRENT_PERSISTENCE_SCHEMA_VERSION) {
    const migration = persistenceMigrations.find((candidate) => candidate.fromVersion === version)
    if (!migration) throw new Error(`No persistence migration is available from schema version ${version}.`)
    migrated = migration.migrate(migrated)
    version = migration.toVersion
  }

  return migrated
}