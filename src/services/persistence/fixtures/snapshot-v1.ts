import type { PersistenceSnapshotV1 } from '../PersistenceSnapshot'

export const snapshotV1Fixture: PersistenceSnapshotV1 = {
  schemaVersion: 1,
  savedAt: '2026-08-01T12:00:00.000Z',
  applicationVersion: '0.0.0',
  data: {
    orders: [],
    artworks: [],
    productionPieces: [],
    workItems: [],
    productionOperations: [],
    battlePlans: [],
    productionTags: [],
    activityLogs: [],
  },
}