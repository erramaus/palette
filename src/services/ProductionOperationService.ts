import type { WorkItem } from '../models'
import type { ActivityAction } from '../types/entities'
import type {
  ProductionOperation,
  ProductionOperationBlock,
  ProductionOperationCarryForward,
  ProductionOperationHistoryEntry,
} from './ProductionPipelineService'

export interface OperationActivityInput {
  entityId: string
  action: ActivityAction
  actorEmployeeId: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface CompleteOperationInput {
  operationId: string
  completedBy: string
  directorOverride?: {
    approvedBy: string
    reason: string
  }
}

export class ProductionOperationService {
  private readonly listWorkItems: () => WorkItem[]
  private readonly recordActivity: (input: OperationActivityInput) => void
  private readonly nowProvider: () => string

  constructor(input: {
    listWorkItems: () => WorkItem[]
    recordActivity: (input: OperationActivityInput) => void
    nowProvider?: () => string
  }) {
    this.listWorkItems = input.listWorkItems
    this.recordActivity = input.recordActivity
    this.nowProvider = input.nowProvider ?? (() => new Date().toISOString())
  }

  assignOperation(operationId: string, employeeId: string, assignedBy: string): ProductionOperation {
    if (!employeeId.trim()) throw new Error('An employee is required to assign an operation.')
    return this.update(operationId, 'OPERATION_ASSIGNED', assignedBy, `Assigned to ${employeeId}.`,
      (operation) => ({ ...operation, assignedEmployeeId: employeeId }), { assignedEmployeeId: employeeId })
  }

  unassignOperation(operationId: string, unassignedBy: string): ProductionOperation {
    return this.update(operationId, 'OPERATION_UNASSIGNED', unassignedBy, 'Assignment removed.',
      (operation) => ({ ...operation, assignedEmployeeId: undefined }))
  }

  startOperation(operationId: string, startedBy: string): ProductionOperation {
    const { operation, operations } = this.requireOperation(operationId)
    if (operation.status === 'COMPLETE') throw new Error('Reopen the completed operation before starting it.')
    if (operation.status === 'BLOCKED') throw new Error('Unblock the operation before starting it.')
    this.assertDependenciesComplete(operation, operations)
    const startedAt = this.nowProvider()
    return this.update(operationId, 'OPERATION_STARTED', startedBy, 'Operation started.',
      (current) => ({ ...current, status: 'IN_PROGRESS', startedAt, startedBy }), { startedAt })
  }

  blockOperation(input: {
    operationId: string
    reason: string
    blockedBy: string
    dependencyOrMaterialReference?: string
  }): ProductionOperation {
    if (!input.reason.trim()) throw new Error('A blocking reason is required.')
    const blockedAt = this.nowProvider()
    const block: ProductionOperationBlock = {
      reason: input.reason.trim(),
      blockedBy: input.blockedBy,
      blockedAt,
      dependencyOrMaterialReference: input.dependencyOrMaterialReference?.trim() || undefined,
    }
    return this.update(input.operationId, 'OPERATION_BLOCKED', input.blockedBy, block.reason,
      (operation) => ({ ...operation, status: 'BLOCKED', block, blockHistory: [...operation.blockHistory, block] }),
      { reason: block.reason, reference: block.dependencyOrMaterialReference ?? null })
  }

  unblockOperation(operationId: string, unblockedBy: string): ProductionOperation {
    const { operation } = this.requireOperation(operationId)
    if (operation.status !== 'BLOCKED' || !operation.block) throw new Error('Operation is not blocked.')
    const unblockedAt = this.nowProvider()
    const closedBlock = { ...operation.block, unblockedBy, unblockedAt }
    return this.update(operationId, 'OPERATION_UNBLOCKED', unblockedBy, 'Operation unblocked.',
      (current) => ({
        ...current,
        status: current.startedAt ? 'IN_PROGRESS' : 'READY',
        block: undefined,
        blockHistory: [...current.blockHistory.slice(0, -1), closedBlock],
      }), { unblockedAt })
  }

  completeOperation(input: CompleteOperationInput): ProductionOperation {
    const { operation, operations } = this.requireOperation(input.operationId)
    if (operation.status === 'BLOCKED') throw new Error('A blocked operation cannot be completed.')
    const incompleteDependencies = operation.dependsOnOperationIds.filter(
      (dependencyId) => operations.find((candidate) => candidate.id === dependencyId)?.status !== 'COMPLETE',
    )
    if (incompleteDependencies.length > 0 && !input.directorOverride) {
      throw new Error('Required prior operations must be complete before this operation.')
    }
    if (input.directorOverride && !input.directorOverride.reason.trim()) {
      throw new Error('A director override reason is required.')
    }
    const completedAt = this.nowProvider()
    if (incompleteDependencies.length > 0 && input.directorOverride) {
      this.recordActivity({
        entityId: operation.id,
        action: 'OPERATION_DEPENDENCY_OVERRIDDEN',
        actorEmployeeId: input.directorOverride.approvedBy,
        metadata: {
          reason: input.directorOverride.reason,
          dependencyIds: incompleteDependencies.join(','),
        },
      })
    }
    return this.update(input.operationId, 'OPERATION_COMPLETED', input.completedBy, 'Operation completed.',
      (current) => ({
        ...current,
        status: 'COMPLETE',
        completedAt,
        completedBy: input.completedBy,
        completionHistory: [...current.completionHistory, {
          completedAt,
          completedBy: input.completedBy,
          overrideReason: input.directorOverride?.reason,
          overriddenDependencyIds: incompleteDependencies.length > 0 ? incompleteDependencies : undefined,
        }],
      }), { completedAt, dependencyOverride: incompleteDependencies.length > 0 })
  }

  reopenOperation(operationId: string, reopenedBy: string, reason: string): ProductionOperation {
    const { operation } = this.requireOperation(operationId)
    if (operation.status !== 'COMPLETE') throw new Error('Only completed operations can be reopened.')
    if (!reason.trim()) throw new Error('A reopening reason is required.')
    return this.update(operationId, 'OPERATION_REOPENED', reopenedBy, reason.trim(),
      (current) => ({ ...current, status: 'READY', completedAt: undefined, completedBy: undefined }), { reason: reason.trim() })
  }

  carryForwardOperation(input: {
    operationId: string
    originalBattlePlanDate: string
    newBattlePlanDate: string
    reason: string
    carriedForwardBy: string
  }): ProductionOperation {
    if (!input.originalBattlePlanDate || !input.newBattlePlanDate || !input.reason.trim()) {
      throw new Error('Original date, new date, and reason are required for carry-forward.')
    }
    const carriedForwardAt = this.nowProvider()
    const record: ProductionOperationCarryForward = { ...input, reason: input.reason.trim(), carriedForwardAt }
    return this.update(input.operationId, 'OPERATION_CARRIED_FORWARD', input.carriedForwardBy, record.reason,
      (operation) => ({ ...operation, carryForwardHistory: [...operation.carryForwardHistory, record] }),
      { originalBattlePlanDate: input.originalBattlePlanDate, newBattlePlanDate: input.newBattlePlanDate, reason: record.reason })
  }

  changeOperationDueDate(operationId: string, dueDate: string, changedBy: string): ProductionOperation {
    if (!dueDate) throw new Error('A due date is required.')
    return this.update(operationId, 'DUE_DATE_CHANGED', changedBy, `Due date changed to ${dueDate}.`,
      (operation) => ({ ...operation, dueDate }), { dueDate })
  }

  changeOperationPriority(operationId: string, priority: number, changedBy: string): ProductionOperation {
    if (!Number.isFinite(priority) || priority < 0) throw new Error('Priority must be a non-negative number.')
    return this.update(operationId, 'PRIORITY_CHANGED', changedBy, `Priority changed to ${priority}.`,
      (operation) => ({ ...operation, priority }), { priority })
  }

  addOperationNote(operationId: string, note: string, addedBy: string): ProductionOperation {
    if (!note.trim()) throw new Error('A note is required.')
    return this.update(operationId, 'NOTE_ADDED', addedBy, note.trim(),
      (operation) => ({ ...operation, notes: [...operation.notes, note.trim()] }), { note: note.trim() })
  }

  getOperationHistory(operationId: string): ProductionOperationHistoryEntry[] {
    return [...this.requireOperation(operationId).operation.history]
  }

  private assertDependenciesComplete(operation: ProductionOperation, operations: ProductionOperation[]): void {
    const incomplete = operation.dependsOnOperationIds.filter(
      (dependencyId) => operations.find((candidate) => candidate.id === dependencyId)?.status !== 'COMPLETE',
    )
    if (incomplete.length > 0) throw new Error('Required prior operations must be complete before starting this operation.')
  }

  private requireOperation(operationId: string): { workItem: WorkItem; operation: ProductionOperation; operations: ProductionOperation[] } {
    for (const workItem of this.listWorkItems()) {
      const pipeline = workItem.customFields.pipeline
      if (!pipeline || typeof pipeline !== 'object') continue
      const operations = (pipeline as { operations?: ProductionOperation[] }).operations ?? []
      const operation = operations.find((candidate) => candidate.id === operationId)
      if (operation) return { workItem, operation, operations }
    }
    throw new Error(`Production operation not found: ${operationId}`)
  }

  private update(
    operationId: string,
    action: ActivityAction,
    actorEmployeeId: string,
    detail: string,
    updater: (operation: ProductionOperation) => ProductionOperation,
    metadata?: Record<string, string | number | boolean | null>,
  ): ProductionOperation {
    const { workItem, operation, operations } = this.requireOperation(operationId)
    const occurredAt = this.nowProvider()
    const historyEntry: ProductionOperationHistoryEntry = {
      id: `${operationId}:history:${operation.history.length + 1}`,
      action,
      actorEmployeeId,
      occurredAt,
      detail,
      metadata,
    }
    const updated = { ...updater(operation), history: [...operation.history, historyEntry] }
    const pipeline = workItem.customFields.pipeline as Record<string, unknown>
    workItem.customFields = {
      ...workItem.customFields,
      pipeline: { ...pipeline, operations: operations.map((candidate) => candidate.id === operationId ? updated : candidate) },
    }
    workItem.touch()
    this.recordActivity({ entityId: operationId, action, actorEmployeeId, metadata })
    return updated
  }
}