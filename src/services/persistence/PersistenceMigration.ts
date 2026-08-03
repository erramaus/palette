import {
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  type IntelligenceReviewState,
  type PersistenceSnapshot,
  type PersistenceSnapshotV1,
  type PersistenceSnapshotV2,
} from './PersistenceSnapshot'
import type { ProductType, ProductionJob } from '../../types/production'
import type { WorkItem } from '../../types/entities'

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
    } satisfies PersistenceSnapshotV2
  },
}, {
  fromVersion: 2,
  toVersion: 3,
  migrate: (snapshot) => {
    const versionTwo = snapshot as PersistenceSnapshotV2
    const jobsByOrderNumber = new Map(
      versionTwo.data.orders.map((job: ProductionJob) => [job.orderNumber, job]),
    )
    const workItems = versionTwo.data.workItems as WorkItem[]
    const uniqueById = <T extends { id: string }>(records: T[]): T[] =>
      [...new Map(records.map((record) => [record.id, record])).values()]
    const productCode = (type: ProductType): string => {
      if (type === 'CANVAS') return '3 Canv'
      if (type === 'ORIGINAL' || type === 'PAPER') return '4 Paper'
      return '2 3D'
    }

    return {
      ...versionTwo,
      schemaVersion: 3,
      data: {
        ...versionTwo.data,
        customers: uniqueById(workItems.map((workItem) => ({
          id: workItem.customerId,
          name: jobsByOrderNumber.get(workItem.orderId)?.customerName ?? workItem.customerId,
        }))),
        products: uniqueById(workItems.map((workItem) => {
          const job = jobsByOrderNumber.get(workItem.orderId)
          const type = (job?.productType ?? workItem.type) as ProductType
          return {
            id: workItem.productId,
            name: job ? `${job.productType.replaceAll('_', ' ')} Product` : workItem.productId,
            code: productCode(type),
            type,
          }
        })),
        departments: uniqueById(workItems
          .filter((workItem) => Boolean(workItem.assignedDepartmentId))
          .map((workItem) => ({
            id: workItem.assignedDepartmentId!,
            name: workItem.assignedDepartmentId!,
          }))),
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