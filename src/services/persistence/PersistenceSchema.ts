import {
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  type PersistenceSnapshot,
} from './PersistenceSnapshot'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredArrays = [
  'orders',
  'artworks',
  'productionPieces',
  'workItems',
  'productionOperations',
  'battlePlans',
  'productionTags',
  'tagSnapshots',
  'timelineEvents',
  'activityLogs',
] as const

export const validatePersistenceSnapshot = (value: unknown): PersistenceSnapshot => {
  if (!isRecord(value)) throw new Error('Persistence snapshot must be an object.')
  if (value.schemaVersion !== CURRENT_PERSISTENCE_SCHEMA_VERSION) {
    throw new Error(`Unsupported persistence schema version: ${String(value.schemaVersion)}.`)
  }
  if (typeof value.savedAt !== 'string' || Number.isNaN(Date.parse(value.savedAt))) {
    throw new Error('Persistence snapshot savedAt must be a valid ISO date.')
  }
  if (typeof value.applicationVersion !== 'string' || !value.applicationVersion) {
    throw new Error('Persistence snapshot applicationVersion is required.')
  }
  if (!isRecord(value.data)) throw new Error('Persistence snapshot data is required.')
  for (const key of requiredArrays) {
    if (!Array.isArray(value.data[key])) throw new Error(`Persistence snapshot ${key} must be an array.`)
  }
  if (!isRecord(value.data.intelligenceReviewState) || !isRecord(value.data.settings)) {
    throw new Error('Persistence snapshot review state and settings are required.')
  }

  const operationIds = (value.data.productionOperations as unknown[]).map((operation) => {
    if (!isRecord(operation) || typeof operation.id !== 'string' || !operation.id) {
      throw new Error('Every persisted production operation must have an ID.')
    }
    if (!Array.isArray(operation.history)) throw new Error(`Operation ${operation.id} history must be an array.`)
    return operation.id
  })
  if (new Set(operationIds).size !== operationIds.length) {
    throw new Error('Persistence snapshot contains duplicate production operation IDs.')
  }

  const workItemIds = (value.data.workItems as unknown[]).map((workItem) => {
    if (!isRecord(workItem) || typeof workItem.id !== 'string' || !workItem.id) {
      throw new Error('Every persisted WorkItem must have an ID.')
    }
    return workItem.id
  })
  if (new Set(workItemIds).size !== workItemIds.length) {
    throw new Error('Persistence snapshot contains duplicate WorkItem IDs.')
  }

  return value as unknown as PersistenceSnapshot
}