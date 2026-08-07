import type { ProductionOperation } from './ProductionPipelineService'

interface ResolvableWorkItem {
  id: string
  orderId?: string
  customFields?: Record<string, unknown>
}

interface ResolvableProductionJob {
  id: string
  orderNumber: string
}

export interface WorkItemNavigationResolutionInput {
  candidateWorkItemId?: string
  jobId?: string
  operationId?: string
  orderNumber?: string
  sourceRecordId?: string
}

export interface WorkItemNavigationResolver {
  resolveWorkItemId: (input: WorkItemNavigationResolutionInput) => string | undefined
}

interface WorkItemNavigationResolverDependencies {
  workItems: ResolvableWorkItem[]
  productionJobs: ResolvableProductionJob[]
  productionOperations: ProductionOperation[]
  getWorkItemIdForOrderNumber?: (orderNumber: string) => string | undefined
}

const normalizeOrderNumber = (value: string): string => value.trim().toUpperCase()

const readSourceRecordId = (workItem: ResolvableWorkItem): string | undefined => {
  const directValue = workItem.customFields?.sourceRecordId
  if (typeof directValue === 'string' && directValue.trim().length > 0) {
    return directValue
  }

  const canonicalImport = workItem.customFields?.canonicalOrderImport
  if (!canonicalImport || typeof canonicalImport !== 'object') {
    return undefined
  }

  const originalImport = (canonicalImport as Record<string, unknown>).originalImport
  if (!originalImport || typeof originalImport !== 'object') {
    return undefined
  }

  const sourceRecordId = (originalImport as Record<string, unknown>).sourceRecordId
  return typeof sourceRecordId === 'string' && sourceRecordId.trim().length > 0
    ? sourceRecordId
    : undefined
}

export const createWorkItemNavigationResolver = ({
  workItems,
  productionJobs,
  productionOperations,
  getWorkItemIdForOrderNumber,
}: WorkItemNavigationResolverDependencies): WorkItemNavigationResolver => {
  const knownWorkItemIds = new Set(workItems.map((workItem) => workItem.id))
  const jobById = new Map(productionJobs.map((job) => [job.id, job]))
  const operationById = new Map(productionOperations.map((operation) => [operation.id, operation]))

  const workItemByNormalizedOrderNumber = new Map<string, ResolvableWorkItem>()
  workItems.forEach((workItem) => {
    if (typeof workItem.orderId === 'string' && workItem.orderId.trim().length > 0) {
      workItemByNormalizedOrderNumber.set(normalizeOrderNumber(workItem.orderId), workItem)
    }

    const pipeline = workItem.customFields?.pipeline
    if (pipeline && typeof pipeline === 'object') {
      const pipelineOrderNumber = (pipeline as Record<string, unknown>).orderNumber
      if (typeof pipelineOrderNumber === 'string' && pipelineOrderNumber.trim().length > 0) {
        workItemByNormalizedOrderNumber.set(normalizeOrderNumber(pipelineOrderNumber), workItem)
      }
    }
  })

  const workItemIdBySourceRecordId = new Map<string, string>()
  workItems.forEach((workItem) => {
    const sourceRecordId = readSourceRecordId(workItem)
    if (sourceRecordId) {
      workItemIdBySourceRecordId.set(sourceRecordId, workItem.id)
    }
  })

  const resolveByOrderNumber = (orderNumber: string | undefined): string | undefined => {
    if (!orderNumber || orderNumber.trim().length === 0) {
      return undefined
    }

    const normalizedOrderNumber = normalizeOrderNumber(orderNumber)
    const mappedWorkItemId = getWorkItemIdForOrderNumber?.(orderNumber)
      ?? getWorkItemIdForOrderNumber?.(normalizedOrderNumber)
    if (mappedWorkItemId && knownWorkItemIds.has(mappedWorkItemId)) {
      return mappedWorkItemId
    }

    const fromWorkItems = workItemByNormalizedOrderNumber.get(normalizedOrderNumber)
    return fromWorkItems?.id
  }

  const resolveByJobId = (jobId: string | undefined): string | undefined => {
    if (!jobId) {
      return undefined
    }

    const sourceMappedId = workItemIdBySourceRecordId.get(jobId)
    if (sourceMappedId && knownWorkItemIds.has(sourceMappedId)) {
      return sourceMappedId
    }

    const job = jobById.get(jobId)
    if (!job) {
      return undefined
    }

    return resolveByOrderNumber(job.orderNumber)
  }

  const resolveByOperationId = (operationId: string | undefined): string | undefined => {
    if (!operationId) {
      return undefined
    }

    const operation = operationById.get(operationId)
    if (!operation) {
      return undefined
    }

    return knownWorkItemIds.has(operation.workItemId) ? operation.workItemId : undefined
  }

  const resolveWorkItemId = (input: WorkItemNavigationResolutionInput): string | undefined => {
    if (input.candidateWorkItemId && knownWorkItemIds.has(input.candidateWorkItemId)) {
      return input.candidateWorkItemId
    }

    const byOperationId = resolveByOperationId(input.operationId)
      ?? resolveByOperationId(input.candidateWorkItemId)
    if (byOperationId) {
      return byOperationId
    }

    const byJobId = resolveByJobId(input.jobId)
      ?? resolveByJobId(input.candidateWorkItemId)
    if (byJobId) {
      return byJobId
    }

    const byOrderNumber = resolveByOrderNumber(input.orderNumber)
    if (byOrderNumber) {
      return byOrderNumber
    }

    if (input.sourceRecordId) {
      const bySourceRecordId = workItemIdBySourceRecordId.get(input.sourceRecordId)
      if (bySourceRecordId && knownWorkItemIds.has(bySourceRecordId)) {
        return bySourceRecordId
      }
    }

    return undefined
  }

  return { resolveWorkItemId }
}