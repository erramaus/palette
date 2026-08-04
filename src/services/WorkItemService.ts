import { ActivityLog, WorkItem, Workflow, WorkflowRule, WorkflowStage, WorkflowTransition } from '../models'
import type { ActivityAction, ActivityEntityType, WorkItem as WorkItemShape, WorkItemAttachment, WorkItemHistoryEntry, WorkItemStatus } from '../types/entities'
import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import { WorkflowService, type WorkflowTransitionApproval } from './WorkflowService'

export interface WorkflowContext {
  workflow: Workflow
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
  rules: WorkflowRule[]
}

export interface CreateWorkItemInput {
  id?: string
  workItemNumber?: string
  type: string
  status?: WorkItemStatus
  priority?: number
  workflowContext: WorkflowContext
  customerId: string
  orderId: string
  artworkId?: string
  productId: string
  quantity?: number
  assignedDepartmentId?: string
  assignedEmployeeId?: string
  dueDate?: string
  notes?: string[]
  attachments?: WorkItemAttachment[]
  tags?: string[]
  customFields?: Record<string, unknown>
  actorEmployeeId?: string
}

export interface UpdateWorkItemInput {
  workItemNumber?: string
  type?: string
  status?: WorkItemStatus
  priority?: number
  customerId?: string
  orderId?: string
  productId?: string
  artworkId?: string
  workflowId?: string
  currentStageId?: string
  assignedDepartmentId?: string
  assignedEmployeeId?: string
  dueDate?: string
  startDate?: string
  completedDate?: string
  notes?: string[]
  tags?: string[]
  customFields?: Record<string, unknown>
  actorEmployeeId?: string
}

export interface CompleteWorkInput {
  workItemId: string
  workflowContext: WorkflowContext
  approvals?: WorkflowTransitionApproval[]
  facts?: Record<string, unknown>
  actorEmployeeId?: string
}

export interface AddAttachmentInput {
  workItemId: string
  fileName: string
  uri: string
  uploadedByEmployeeId?: string
  contentType?: string
  actorEmployeeId?: string
}

export interface RecordWorkItemActivityInput {
  workItemId: string
  action: ActivityAction
  message: string
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

interface ActivityInput {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export class WorkItemService {
  private readonly workflowService: WorkflowService
  private readonly workItems = new Map<string, WorkItem>()
  private readonly activityLogs: ActivityLog[] = []

  constructor(workflowService = new WorkflowService()) {
    this.workflowService = workflowService
  }

  createWorkItem(input: CreateWorkItemInput): WorkItem {
    const initialStage = this.resolveInitialStage(input.workflowContext)

    const workItem = new WorkItem({
      id: input.id,
      workItemNumber: input.workItemNumber ?? this.generateWorkItemNumber(),
      type: input.type,
      customerId: input.customerId,
      orderId: input.orderId,
      productId: input.productId,
      artworkId: input.artworkId,
      workflowId: input.workflowContext.workflow.id,
      currentStageId: initialStage.id,
      status: input.status ?? 'READY',
      priority: input.priority ?? 100,
      quantity: input.quantity ?? 1,
      assignedDepartmentId: input.assignedDepartmentId ?? initialStage.department,
      assignedEmployeeId: input.assignedEmployeeId,
      dueDate: input.dueDate,
      startDate: undefined,
      completedDate: undefined,
      notes: input.notes ?? [],
      attachments: input.attachments ?? [],
      tags: input.tags ?? [],
      customFields: input.customFields ?? {},
      activityHistory: [],
      dueAt: input.dueDate,
      currentWorkflowStageId: initialStage.id,
      currentStepId: undefined,
      productionStepIds: [],
      tagLabels: input.tags ?? [],
    })

    this.workItems.set(workItem.id, workItem)

    this.appendHistory(workItem, {
      action: 'CREATED',
      actorEmployeeId: input.actorEmployeeId,
      message: `WorkItem ${workItem.workItemNumber} created`,
      metadata: {
        workflowId: workItem.workflowId,
        currentStageId: workItem.currentStageId,
      },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'CREATED',
      actorEmployeeId: input.actorEmployeeId,
      metadata: {
        workItemNumber: workItem.workItemNumber,
        workflowId: workItem.workflowId,
      },
    })

    return workItem
  }

  updateWorkItem(workItemId: string, updates: UpdateWorkItemInput): WorkItem {
    const workItem = this.getRequired(workItemId)

    if (updates.workItemNumber !== undefined) {
      workItem.workItemNumber = updates.workItemNumber
    }

    if (updates.type !== undefined) {
      workItem.type = updates.type
    }

    if (updates.status !== undefined) {
      workItem.status = updates.status
    }

    if (updates.priority !== undefined) {
      workItem.priority = updates.priority
    }

    if (updates.customerId !== undefined) {
      workItem.customerId = updates.customerId
    }

    if (updates.orderId !== undefined) {
      workItem.orderId = updates.orderId
    }

    if (updates.productId !== undefined) {
      workItem.productId = updates.productId
    }

    if (updates.artworkId !== undefined) {
      workItem.artworkId = updates.artworkId
    }

    if (updates.workflowId !== undefined) {
      workItem.workflowId = updates.workflowId
    }

    if (updates.currentStageId !== undefined) {
      workItem.currentStageId = updates.currentStageId
      workItem.currentWorkflowStageId = updates.currentStageId
    }

    if (updates.assignedDepartmentId !== undefined) {
      workItem.assignedDepartmentId = updates.assignedDepartmentId
    }

    if (updates.assignedEmployeeId !== undefined) {
      workItem.assignedEmployeeId = updates.assignedEmployeeId
    }

    if (updates.dueDate !== undefined) {
      workItem.dueDate = updates.dueDate
      workItem.dueAt = updates.dueDate
    }

    if (updates.startDate !== undefined) {
      workItem.startDate = updates.startDate
    }

    if (updates.completedDate !== undefined) {
      workItem.completedDate = updates.completedDate
    }

    if (updates.notes !== undefined) {
      workItem.notes = [...updates.notes]
    }

    if (updates.tags !== undefined) {
      workItem.tags = [...updates.tags]
      workItem.tagLabels = [...updates.tags]
    }

    if (updates.customFields !== undefined) {
      workItem.customFields = { ...workItem.customFields, ...updates.customFields }
    }

    workItem.touch()

    this.appendHistory(workItem, {
      action: 'UPDATED',
      actorEmployeeId: updates.actorEmployeeId,
      message: `WorkItem ${workItem.workItemNumber} updated`,
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'UPDATED',
      actorEmployeeId: updates.actorEmployeeId,
    })

    return workItem
  }

  assignEmployee(workItemId: string, employeeId: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    workItem.assignedEmployeeId = employeeId
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'ASSIGNED',
      actorEmployeeId,
      message: `Assigned employee ${employeeId}`,
      metadata: { employeeId },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'ASSIGNED',
      actorEmployeeId,
      metadata: { employeeId },
    })

    return workItem
  }

  assignDepartment(workItemId: string, departmentId: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    workItem.assignedDepartmentId = departmentId
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'ASSIGNED',
      actorEmployeeId,
      message: `Assigned department ${departmentId}`,
      metadata: { departmentId },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'ASSIGNED',
      actorEmployeeId,
      metadata: { departmentId },
    })

    return workItem
  }

  changePriority(workItemId: string, priority: number, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    const previousPriority = workItem.priority

    workItem.priority = priority
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'PRIORITY_CHANGED',
      actorEmployeeId,
      message: `Priority changed from ${previousPriority} to ${priority}`,
      metadata: {
        previousPriority,
        priority,
      },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'PRIORITY_CHANGED',
      actorEmployeeId,
      metadata: {
        previousPriority,
        priority,
      },
    })

    return workItem
  }

  changeDueDate(workItemId: string, dueDate: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    const previousDueDate = workItem.dueDate ?? null

    workItem.dueDate = dueDate
    workItem.dueAt = dueDate
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'DUE_DATE_CHANGED',
      actorEmployeeId,
      message: `Due date changed to ${dueDate}`,
      metadata: {
        previousDueDate,
        dueDate,
      },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'DUE_DATE_CHANGED',
      actorEmployeeId,
      metadata: {
        previousDueDate,
        dueDate,
      },
    })

    return workItem
  }

  startWork(workItemId: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)

    workItem.startDate = workItem.startDate ?? nowIso()
    workItem.status = 'IN_PROGRESS'
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'WORK_STARTED',
      actorEmployeeId,
      message: `Work started for ${workItem.workItemNumber}`,
      metadata: {
        stageId: workItem.currentStageId,
      },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'WORK_STARTED',
      actorEmployeeId,
      metadata: {
        stageId: workItem.currentStageId,
      },
    })

    return workItem
  }

  completeWork(input: CompleteWorkInput): WorkItem {
    const workItem = this.getRequired(input.workItemId)

    const currentStage = this.workflowService.getCurrentStage(workItem, input.workflowContext.stages)
    if (!currentStage) {
      throw new Error(`WorkItem ${workItem.id} has no valid current stage`)
    }

    const beforeStageId = currentStage.id
    const beforeStageName = currentStage.name

    const hasRemainingStages = this.workflowService.getRemainingStages(
      workItem,
      input.workflowContext.stages,
    ).length > 0

    if (hasRemainingStages) {
      this.workflowService.moveToNextStage({
        workItem,
        workflow: input.workflowContext.workflow,
        stages: input.workflowContext.stages,
        transitions: input.workflowContext.transitions,
        rules: input.workflowContext.rules,
        approvals: input.approvals,
        facts: input.facts,
      })
    }

    const currentAfterMove = this.workflowService.getCurrentStage(workItem, input.workflowContext.stages)

    if (currentAfterMove && currentAfterMove.id !== beforeStageId) {
      this.appendHistory(workItem, {
        action: 'STAGE_CHANGED',
        actorEmployeeId: input.actorEmployeeId,
        message: `Stage moved from ${beforeStageName} to ${currentAfterMove.name}`,
        metadata: {
          fromStageId: beforeStageId,
          toStageId: currentAfterMove.id,
        },
      })

      this.logActivity({
        entityType: 'WorkItem',
        entityId: workItem.id,
        action: 'STAGE_CHANGED',
        actorEmployeeId: input.actorEmployeeId,
        metadata: {
          fromStageId: beforeStageId,
          toStageId: currentAfterMove.id,
        },
      })
    }

    const isComplete = this.workflowService.getRemainingStages(workItem, input.workflowContext.stages).length === 0

    if (isComplete) {
      workItem.status = 'COMPLETE'
      workItem.completedDate = nowIso()

      this.appendHistory(workItem, {
        action: 'WORK_COMPLETED',
        actorEmployeeId: input.actorEmployeeId,
        message: `Work complete for ${workItem.workItemNumber}`,
        metadata: {
          stageId: workItem.currentStageId,
        },
      })

      this.logActivity({
        entityType: 'WorkItem',
        entityId: workItem.id,
        action: 'WORK_COMPLETED',
        actorEmployeeId: input.actorEmployeeId,
        metadata: {
          stageId: workItem.currentStageId,
        },
      })
    } else {
      workItem.status = 'READY'
    }

    workItem.touch()
    return workItem
  }

  cancelWork(workItemId: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    workItem.status = 'CANCELLED'
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'WORK_CANCELLED',
      actorEmployeeId,
      message: `Work cancelled for ${workItem.workItemNumber}`,
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'WORK_CANCELLED',
      actorEmployeeId,
    })

    return workItem
  }

  addNote(workItemId: string, note: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)
    workItem.notes = [...workItem.notes, note]
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'NOTE_ADDED',
      actorEmployeeId,
      message: `Added note to ${workItem.workItemNumber}`,
      metadata: { noteLength: note.length },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'NOTE_ADDED',
      actorEmployeeId,
      metadata: { noteLength: note.length },
    })

    return workItem
  }

  addAttachment(input: AddAttachmentInput): WorkItem {
    const workItem = this.getRequired(input.workItemId)

    const attachment: WorkItemAttachment = {
      id: createEntityId('workitem_attachment'),
      fileName: input.fileName,
      uri: input.uri,
      uploadedAt: nowIso(),
      uploadedByEmployeeId: input.uploadedByEmployeeId,
      contentType: input.contentType,
    }

    workItem.attachments = [...workItem.attachments, attachment]
    workItem.touch()

    this.appendHistory(workItem, {
      action: 'ATTACHMENT_ADDED',
      actorEmployeeId: input.actorEmployeeId,
      message: `Attachment added: ${attachment.fileName}`,
      metadata: {
        attachmentId: attachment.id,
      },
    })

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: 'ATTACHMENT_ADDED',
      actorEmployeeId: input.actorEmployeeId,
      metadata: {
        attachmentId: attachment.id,
      },
    })

    return workItem
  }

  addTag(workItemId: string, tag: string, actorEmployeeId?: string): WorkItem {
    const workItem = this.getRequired(workItemId)

    if (!workItem.tags.includes(tag)) {
      workItem.tags = [...workItem.tags, tag]
      workItem.tagLabels = [...workItem.tags]
      workItem.touch()

      this.appendHistory(workItem, {
        action: 'TAG_ADDED',
        actorEmployeeId,
        message: `Tag added: ${tag}`,
        metadata: { tag },
      })

      this.logActivity({
        entityType: 'WorkItem',
        entityId: workItem.id,
        action: 'TAG_ADDED',
        actorEmployeeId,
        metadata: { tag },
      })
    }

    return workItem
  }

  getHistory(workItemId: string): WorkItemHistoryEntry[] {
    const workItem = this.getRequired(workItemId)
    return [...workItem.activityHistory].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getWorkItemById(workItemId: string): WorkItem | undefined {
    return this.workItems.get(workItemId)
  }

  recordWorkItemActivity(input: RecordWorkItemActivityInput): WorkItem {
    const workItem = this.getRequired(input.workItemId)

    this.appendHistory(workItem, {
      action: input.action,
      actorEmployeeId: input.actorEmployeeId,
      message: input.message,
      metadata: input.metadata,
    })

    workItem.touch()

    this.logActivity({
      entityType: 'WorkItem',
      entityId: workItem.id,
      action: input.action,
      actorEmployeeId: input.actorEmployeeId,
      metadata: input.metadata,
    })

    return workItem
  }

  listWorkItems(): WorkItem[] {
    return [...this.workItems.values()]
  }

  replaceAllWorkItems(workItems: WorkItemShape[]): void {
    const restored = workItems.map((workItem) => new WorkItem(workItem))
    const ids = restored.map((workItem) => workItem.id)
    if (new Set(ids).size !== ids.length) {
      throw new Error('Cannot hydrate duplicate WorkItem IDs.')
    }

    this.workItems.clear()
    restored.forEach((workItem) => this.workItems.set(workItem.id, workItem))
  }

  listActivityLogs(): ActivityLog[] {
    return [...this.activityLogs]
  }

  private resolveInitialStage(context: WorkflowContext): WorkflowStage {
    const initialId = context.workflow.initialStageId

    if (initialId) {
      const configuredInitial = context.stages.find((stage) => stage.id === initialId)
      if (configuredInitial) {
        return configuredInitial
      }
    }

    const sorted = [...context.stages].sort((a, b) => a.sequence - b.sequence)
    const fallback = sorted[0]
    if (!fallback) {
      throw new Error(`Workflow ${context.workflow.id} does not define any stages`)
    }

    return fallback
  }

  private appendHistory(
    workItem: WorkItem,
    entry: Omit<WorkItemHistoryEntry, 'id' | 'createdAt'>,
  ): void {
    workItem.activityHistory = [
      ...workItem.activityHistory,
      {
        id: createEntityId('workitem_history'),
        createdAt: nowIso(),
        ...entry,
      },
    ]
  }

  private logActivity(input: ActivityInput): ActivityLog {
    const activity = new ActivityLog({
      ...input,
      occurredAt: nowIso(),
    })

    this.activityLogs.push(activity)
    return activity
  }

  private getRequired(workItemId: string): WorkItem {
    const workItem = this.workItems.get(workItemId)
    if (!workItem) {
      throw new Error(`WorkItem not found for id ${workItemId}`)
    }

    return workItem
  }

  private generateWorkItemNumber(): string {
    return `WI-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, '0')}`
  }
}
