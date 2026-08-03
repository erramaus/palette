import type { ProductionTag, WorkItem } from '../../types/entities'
import type { BattlePlan } from '../../types/battlePlans'
import type { ProductionJob } from '../../types/production'
import type { ThreeDFilePreparation } from '../../types/threeDFilePreparation'
import type { AppActivityLog } from '../../state/AppStateContext'
import type { OperationProductionTag, ProductionOperation } from '../ProductionPipelineService'
import type { ScheduleEntry } from '../scheduling'
import type { ProductType } from '../../types/production'

export const CURRENT_PERSISTENCE_SCHEMA_VERSION = 3

export interface PersistedNamedEntity {
  id: string
  name: string
}

export interface PersistedProduct extends PersistedNamedEntity {
  code: string
  type: ProductType
}

export interface IntelligenceReviewState {
  dismissedRecommendationIds: Record<string, boolean>
  reviewedRecommendationIds: Record<string, boolean>
  acceptedRecommendationIds: Record<string, boolean>
}

export interface PersistenceData {
  orders: ProductionJob[]
  customers: PersistedNamedEntity[]
  artworks: PersistedNamedEntity[]
  products: PersistedProduct[]
  departments: PersistedNamedEntity[]
  productionPieces: ThreeDFilePreparation[]
  workItems: WorkItem[]
  productionOperations: ProductionOperation[]
  battlePlans: BattlePlan[]
  productionTags: ProductionTag[]
  tagSnapshots: OperationProductionTag[]
  timelineEvents: ScheduleEntry[]
  activityLogs: AppActivityLog[]
  intelligenceReviewState: IntelligenceReviewState
  settings: Record<string, unknown>
}

export interface PersistenceSnapshot {
  schemaVersion: number
  savedAt: string
  applicationVersion: string
  data: PersistenceData
}

export type PersistenceSnapshotV1 = Omit<PersistenceSnapshot, 'schemaVersion' | 'data'> & {
  schemaVersion: 1
  data: Omit<PersistenceData, 'customers' | 'products' | 'departments' | 'tagSnapshots' | 'timelineEvents' | 'intelligenceReviewState' | 'settings'>
}

export type PersistenceSnapshotV2 = Omit<PersistenceSnapshot, 'schemaVersion' | 'data'> & {
  schemaVersion: 2
  data: Omit<PersistenceData, 'customers' | 'products' | 'departments'>
}

export interface PersistenceRecordSummary {
  orders: number
  customers: number
  artworks: number
  products: number
  departments: number
  productionPieces: number
  workItems: number
  productionOperations: number
  battlePlans: number
  productionTags: number
  timelineEvents: number
  activityLogs: number
}

export interface CreatePersistenceSnapshotInput extends PersistenceData {
  applicationVersion: string
  savedAt?: string
}

const withoutEmbeddedOperations = (workItem: WorkItem): WorkItem => {
  const pipeline = workItem.customFields.pipeline
  if (!pipeline || typeof pipeline !== 'object') return workItem
  const { operations: _operations, ...pipelineMetadata } = pipeline as Record<string, unknown>
  return {
    ...workItem,
    customFields: {
      ...workItem.customFields,
      pipeline: pipelineMetadata,
    },
  }
}

export const createPersistenceSnapshot = (input: CreatePersistenceSnapshotInput): PersistenceSnapshot => ({
  schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
  savedAt: input.savedAt ?? new Date().toISOString(),
  applicationVersion: input.applicationVersion,
  data: {
    orders: input.orders,
    customers: input.customers,
    artworks: input.artworks,
    products: input.products,
    departments: input.departments,
    productionPieces: input.productionPieces,
    workItems: input.workItems.map(withoutEmbeddedOperations),
    productionOperations: input.productionOperations,
    battlePlans: input.battlePlans,
    productionTags: input.productionTags,
    tagSnapshots: input.tagSnapshots,
    timelineEvents: input.timelineEvents,
    activityLogs: input.activityLogs,
    intelligenceReviewState: input.intelligenceReviewState,
    settings: input.settings,
  },
})

export const rebuildWorkItemsFromSnapshot = (snapshot: PersistenceSnapshot): WorkItem[] => {
  const operationsByWorkItem = new Map<string, ProductionOperation[]>()
  snapshot.data.productionOperations.forEach((operation) => {
    const current = operationsByWorkItem.get(operation.workItemId) ?? []
    operationsByWorkItem.set(operation.workItemId, [...current, operation])
  })

  return snapshot.data.workItems.map((workItem) => {
    const pipeline = workItem.customFields.pipeline
    return {
      ...workItem,
      customFields: {
        ...workItem.customFields,
        pipeline: {
          ...(pipeline && typeof pipeline === 'object' ? pipeline : {}),
          operations: [...(operationsByWorkItem.get(workItem.id) ?? [])]
            .sort((left, right) => left.sequence - right.sequence),
        },
      },
    }
  })
}

export const summarizeSnapshot = (snapshot: PersistenceSnapshot): PersistenceRecordSummary => ({
  orders: snapshot.data.orders.length,
  customers: snapshot.data.customers.length,
  artworks: snapshot.data.artworks.length,
  products: snapshot.data.products.length,
  departments: snapshot.data.departments.length,
  productionPieces: snapshot.data.productionPieces.length,
  workItems: snapshot.data.workItems.length,
  productionOperations: snapshot.data.productionOperations.length,
  battlePlans: snapshot.data.battlePlans.length,
  productionTags: snapshot.data.productionTags.length,
  timelineEvents: snapshot.data.timelineEvents.length,
  activityLogs: snapshot.data.activityLogs.length,
})