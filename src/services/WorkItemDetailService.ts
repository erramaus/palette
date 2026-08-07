import type { ActivityAction, WorkItemHistoryEntry } from '../types/entities'
import type { ProductType, ProductionJob } from '../types/production'
import type { ProductionCutCalculationResult } from '../types/productionCut'
import type { WorkItem, WorkflowStage } from '../models'
import type { ProductionTag } from '../types/entities'
import { workshopProductionSheetJobs } from '../data/workshopProductionSheetJobs'
import { nowIso } from '../utils/time'
import {
  ProductionTagService,
  type ProductionTagLookupProvider,
  type WorkItemPackagingData,
} from './ProductionTagService'
import type { WorkflowContext } from './WorkItemService'
import type { WorkflowTransitionApproval } from './WorkflowService'
import type { WorkshopListUiEnvironment } from './workshopListUiBootstrap'

interface NamedEntity {
  id: string
  name: string
}

export interface WorkItemApproval {
  role: string
  approvedByEmployeeId: string
  approvedByEmployeeName: string
  approvedAt: string
}

export interface WorkflowStageView {
  stageId: string
  stageName: string
  status: 'COMPLETED' | 'CURRENT' | 'PENDING'
  department: string
  estimatedDuration: number
  requiredApprovals: string
  completionStatus: string
  completedBy: string
  completedDate: string
}

export interface ActivityTimelineEntry {
  id: string
  source: 'history' | 'log'
  action: ActivityAction
  message: string
  occurredAt: string
  actorEmployeeId?: string
  actorEmployeeName: string
  metadata?: Record<string, string | number | boolean | null>
}

interface WorkflowActionAvailability {
  enabled: boolean
  reason?: string
}

export interface WorkflowJumpOption extends WorkflowActionAvailability {
  stageId: string
  stageName: string
}

export interface WorkflowControlState {
  moveToPreviousStage: WorkflowActionAvailability
  moveToNextStage: WorkflowActionAvailability
  completeCurrentStage: WorkflowActionAvailability
  blockedToggle: WorkflowActionAvailability
  jumpOptions: WorkflowJumpOption[]
}

export interface WorkItemDetailSnapshot {
  workItem: WorkItem
  workflowContext: WorkflowContext
  workflowStages: WorkflowStageView[]
  generatedTags: ProductionTag[]
  cutCalculations: ProductionCutCalculationResult[]
  approvals: WorkItemApproval[]
  activityTimeline: ActivityTimelineEntry[]
  customerName: string
  artworkName: string
  productName: string
  assignedEmployeeName: string
  assignedDepartmentName: string
  currentStageName: string
  workflowControls: WorkflowControlState
}

export interface EditWorkItemInput {
  priority: number
  dueDate?: string
  assignedEmployeeId?: string
  assignedDepartmentId?: string
  notes: string[]
  tags: string[]
  actorEmployeeId?: string
}

export class WorkItemDetailService {
  private readonly environment: WorkshopListUiEnvironment
  private readonly productionTagService: ProductionTagService
  private readonly generatedTagsByWorkItem = new Map<string, ProductionTag[]>()
  private readonly approvalsByWorkItem = new Map<string, WorkItemApproval[]>()
  private readonly jobsByOrderNumber: Map<string, ProductionJob>
  private readonly customersById: Map<string, NamedEntity>
  private readonly artworksById: Map<string, NamedEntity>
  private readonly productsById: Map<string, NamedEntity & { code: string; type: ProductType }>
  private readonly departmentsById: Map<string, NamedEntity>
  private readonly employeesById: Map<string, NamedEntity>

  constructor(environment: WorkshopListUiEnvironment) {
    this.environment = environment
    this.jobsByOrderNumber = new Map()
    this.customersById = new Map()
    this.artworksById = new Map()
    this.productsById = new Map()
    this.departmentsById = new Map()
    this.employeesById = new Map(environment.employees.map((employee) => [employee.id, employee]))
    this.refreshLookupMaps(workshopProductionSheetJobs)

    const lookupProvider: ProductionTagLookupProvider = {
      getCustomerName: (customerId) => this.customersById.get(customerId)?.name,
      getArtworkData: (workItem) => {
        const job = this.jobsByOrderNumber.get(workItem.orderId)
        if (!job) {
          return undefined
        }

        return {
          name: this.artworksById.get(workItem.artworkId ?? '')?.name ?? job.artworkTitle,
          width: job.width,
          height: job.height,
          scanState: 'New',
          ia: job.steps.FILES === 'COMPLETE',
          printed: job.steps.PRINTED === 'COMPLETE',
          resliced: false,
        }
      },
      getProductData: (workItem) => {
        const product = this.productsById.get(workItem.productId)
        if (!product) {
          return undefined
        }

        return {
          name: product.name,
          code: product.code,
          classification: product.type,
          runOrEditionValue: workItem.orderId,
        }
      },
      getFrameStyleName: (workItem) => {
        const frameStyle = workItem.customFields.frameStyle
        return typeof frameStyle === 'string' && frameStyle.trim().length > 0
          ? frameStyle
          : undefined
      },
      getBaseStyleName: (workItem) => {
        const baseStyle = workItem.customFields.baseStyle
        return typeof baseStyle === 'string' && baseStyle.trim().length > 0
          ? baseStyle
          : undefined
      },
      getPackagingData: (workItem): WorkItemPackagingData | undefined => {
        const job = this.jobsByOrderNumber.get(workItem.orderId)
        if (!job) {
          return undefined
        }

        const rawMethod = workItem.customFields.packagingMethod
        const methodCode =
          typeof rawMethod === 'string' && rawMethod.trim().length > 0
            ? (rawMethod as WorkItemPackagingData['methodCode'])
            : undefined

        const rawShippingBox = workItem.customFields.shippingBoxCode
        const shippingBoxCode =
          typeof rawShippingBox === 'string' && rawShippingBox.trim().length > 0
            ? rawShippingBox
            : undefined

        return {
          methodCode,
          shippingBoxCode,
          finishedWidth: job.width,
          finishedHeight: job.height,
        }
      },
    }

    this.productionTagService = new ProductionTagService(
      environment.workItemService,
      lookupProvider,
    )
  }

  refreshLookupMaps(productionJobs: ProductionJob[]): void {
    this.jobsByOrderNumber.clear()
    productionJobs.forEach((job) => this.jobsByOrderNumber.set(job.orderNumber, job))
    this.customersById.clear()
    this.environment.listCustomers().forEach((customer) => this.customersById.set(customer.id, customer))
    this.artworksById.clear()
    this.environment.listArtworks().forEach((artwork) => this.artworksById.set(artwork.id, artwork))
    this.productsById.clear()
    this.environment.listProducts().forEach((product) => this.productsById.set(product.id, product))
    this.departmentsById.clear()
    this.environment.listDepartments().forEach((department) => this.departmentsById.set(department.id, department))
  }

  getSnapshot(workItemId: string): WorkItemDetailSnapshot {
    const workItem = this.getRequiredWorkItem(workItemId)
    const workflowContext = this.getWorkflowContext(workItem)
    const workflowStages = this.buildStageViews(workItem, workflowContext)
    const currentStage =
      this.environment.workflowService.getCurrentStage(workItem, workflowContext.stages)?.name ??
      workItem.currentStageId

    return {
      workItem,
      workflowContext,
      workflowStages,
      generatedTags: this.getGeneratedTagsForWorkItem(workItem.id),
      cutCalculations: this.environment.productionPipelineService.getCutCalculations(workItem),
      approvals: this.getApprovals(workItem.id),
      activityTimeline: this.buildActivityTimeline(workItem),
      customerName: this.customersById.get(workItem.customerId)?.name ?? workItem.customerId,
      artworkName:
        this.artworksById.get(workItem.artworkId ?? '')?.name ??
        this.jobsByOrderNumber.get(workItem.orderId)?.artworkTitle ??
        'N/A',
      productName: this.productsById.get(workItem.productId)?.name ?? workItem.productId,
      assignedEmployeeName:
        this.employeesById.get(workItem.assignedEmployeeId ?? '')?.name ??
        workItem.assignedEmployeeId ??
        'Unassigned',
      assignedDepartmentName:
        this.departmentsById.get(workItem.assignedDepartmentId ?? '')?.name ??
        workItem.assignedDepartmentId ??
        'Unassigned',
      currentStageName: currentStage,
      workflowControls: this.buildWorkflowControls(workItem, workflowContext, workflowStages),
    }
  }

  getApprovals(workItemId: string): WorkItemApproval[] {
    return [...(this.approvalsByWorkItem.get(workItemId) ?? [])].sort((left, right) =>
      left.approvedAt.localeCompare(right.approvedAt),
    )
  }

  addApproval(workItemId: string, role: string, approvedByEmployeeId: string): WorkItemApproval[] {
    const workItem = this.getRequiredWorkItem(workItemId)
    const employeeName =
      this.employeesById.get(approvedByEmployeeId)?.name ?? approvedByEmployeeId

    const approval: WorkItemApproval = {
      role,
      approvedByEmployeeId,
      approvedByEmployeeName: employeeName,
      approvedAt: nowIso(),
    }

    const existingApprovals = this.approvalsByWorkItem.get(workItem.id) ?? []
    this.approvalsByWorkItem.set(workItem.id, [...existingApprovals, approval])

    this.environment.workItemService.recordWorkItemActivity({
      workItemId: workItem.id,
      action: 'UPDATED',
      actorEmployeeId: approvedByEmployeeId,
      message: `Approval added for role ${role}`,
      metadata: {
        role,
      },
    })

    return this.getApprovals(workItem.id)
  }

  moveToNextStage(workItemId: string, actorEmployeeId?: string): WorkItem {
    this.assertActionAvailable(workItemId, 'moveToNextStage')
    return this.changeStage(workItemId, 'next', actorEmployeeId)
  }

  moveToPreviousStage(workItemId: string, actorEmployeeId?: string): WorkItem {
    this.assertActionAvailable(workItemId, 'moveToPreviousStage')
    return this.changeStage(workItemId, 'previous', actorEmployeeId)
  }

  jumpToStage(workItemId: string, targetStageId: string, actorEmployeeId?: string): WorkItem {
    this.assertJumpAvailable(workItemId, targetStageId)
    const workItem = this.getRequiredWorkItem(workItemId)
    const workflowContext = this.getWorkflowContext(workItem)
    const beforeStage =
      this.environment.workflowService.getCurrentStage(workItem, workflowContext.stages)

    this.environment.workflowService.jumpToStage({
      workItem,
      workflow: workflowContext.workflow,
      stages: workflowContext.stages,
      transitions: workflowContext.transitions,
      rules: workflowContext.rules,
      toStageId: targetStageId,
      approvals: this.toTransitionApprovals(workItem.id),
    })

    this.recordStageTransitionActivity(workItem, workflowContext.stages, beforeStage, actorEmployeeId)
    return workItem
  }

  completeCurrentStage(workItemId: string, actorEmployeeId?: string): WorkItem {
    this.assertActionAvailable(workItemId, 'completeCurrentStage')
    const workItem = this.getRequiredWorkItem(workItemId)
    const workflowContext = this.getWorkflowContext(workItem)

    return this.environment.workItemService.completeWork({
      workItemId,
      workflowContext,
      approvals: this.toTransitionApprovals(workItem.id),
      actorEmployeeId,
    })
  }

  setBlockedStatus(workItemId: string, blocked: boolean, actorEmployeeId?: string): WorkItem {
    this.assertActionAvailable(workItemId, 'blockedToggle')
    const workItem = this.getRequiredWorkItem(workItemId)
    const targetStatus = blocked ? 'BLOCKED' : 'READY'

    if (workItem.status === targetStatus) {
      return workItem
    }

    this.environment.workItemService.updateWorkItem(workItem.id, {
      status: targetStatus,
      actorEmployeeId,
    })

    this.environment.workItemService.recordWorkItemActivity({
      workItemId: workItem.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId,
      message: blocked ? 'Work item marked blocked' : 'Blocked status removed',
      metadata: {
        status: targetStatus,
      },
    })

    return workItem
  }

  addNote(workItemId: string, note: string, actorEmployeeId?: string): WorkItem {
    return this.environment.workItemService.addNote(workItemId, note, actorEmployeeId)
  }

  addAttachmentReference(
    workItemId: string,
    fileName: string,
    uri: string,
    actorEmployeeId?: string,
  ): WorkItem {
    return this.environment.workItemService.addAttachment({
      workItemId,
      fileName,
      uri,
      uploadedByEmployeeId: actorEmployeeId,
      actorEmployeeId,
    })
  }

  editWorkItem(workItemId: string, input: EditWorkItemInput): WorkItem {
    const workItem = this.getRequiredWorkItem(workItemId)

    if (input.priority !== workItem.priority) {
      this.environment.workItemService.changePriority(workItem.id, input.priority, input.actorEmployeeId)
    }

    if ((input.dueDate ?? '') !== (workItem.dueDate ?? '')) {
      if (input.dueDate) {
        this.environment.workItemService.changeDueDate(workItem.id, input.dueDate, input.actorEmployeeId)
      } else {
        this.environment.workItemService.updateWorkItem(workItem.id, {
          dueDate: undefined,
          actorEmployeeId: input.actorEmployeeId,
        })

        this.environment.workItemService.recordWorkItemActivity({
          workItemId: workItem.id,
          action: 'DUE_DATE_CHANGED',
          actorEmployeeId: input.actorEmployeeId,
          message: 'Due date cleared',
        })
      }
    }

    if ((input.assignedEmployeeId ?? '') !== (workItem.assignedEmployeeId ?? '')) {
      if (input.assignedEmployeeId) {
        this.environment.workItemService.assignEmployee(
          workItem.id,
          input.assignedEmployeeId,
          input.actorEmployeeId,
        )
      } else {
        this.environment.workItemService.updateWorkItem(workItem.id, {
          assignedEmployeeId: undefined,
          actorEmployeeId: input.actorEmployeeId,
        })

        this.environment.workItemService.recordWorkItemActivity({
          workItemId: workItem.id,
          action: 'ASSIGNED',
          actorEmployeeId: input.actorEmployeeId,
          message: 'Employee assignment cleared',
        })
      }
    }

    if ((input.assignedDepartmentId ?? '') !== (workItem.assignedDepartmentId ?? '')) {
      if (input.assignedDepartmentId) {
        this.environment.workItemService.assignDepartment(
          workItem.id,
          input.assignedDepartmentId,
          input.actorEmployeeId,
        )
      } else {
        this.environment.workItemService.updateWorkItem(workItem.id, {
          assignedDepartmentId: undefined,
          actorEmployeeId: input.actorEmployeeId,
        })

        this.environment.workItemService.recordWorkItemActivity({
          workItemId: workItem.id,
          action: 'ASSIGNED',
          actorEmployeeId: input.actorEmployeeId,
          message: 'Department assignment cleared',
        })
      }
    }

    const normalizedCurrentNotes = workItem.notes.join('\n').trim()
    const normalizedIncomingNotes = input.notes.join('\n').trim()
    const normalizedCurrentTags = [...workItem.tags].sort().join('|')
    const normalizedIncomingTags = [...input.tags].sort().join('|')

    if (
      normalizedCurrentNotes !== normalizedIncomingNotes ||
      normalizedCurrentTags !== normalizedIncomingTags
    ) {
      this.environment.workItemService.updateWorkItem(workItem.id, {
        notes: input.notes,
        tags: input.tags,
        actorEmployeeId: input.actorEmployeeId,
      })
    }

    return this.getRequiredWorkItem(workItem.id)
  }

  generateTags(workItemId: string, actorEmployeeId?: string): ProductionTag[] {
    const previous = this.generatedTagsByWorkItem.get(workItemId) ?? []
    previous
      .filter((tag) => tag.status !== 'PRINTED' && tag.status !== 'VOID')
      .forEach((tag) => {
        tag.status = 'REGENERATED'
        tag.updatedAt = nowIso()
      })
    const generated = this.productionTagService.generateProductionTags({
      workItemIds: [workItemId],
      generatedByEmployeeId: actorEmployeeId,
    })

    generated.forEach((tag) => {
      tag.previousTagId = previous.find((candidate) => candidate.tagType === tag.tagType)?.id
    })
    this.syncOperationTags(workItemId, generated)

    const existing = this.generatedTagsByWorkItem.get(workItemId) ?? []
    this.generatedTagsByWorkItem.set(workItemId, [...existing, ...generated])

    return this.getGeneratedTagsForWorkItem(workItemId)
  }

  printTag(workItemId: string, tagId: string, actorEmployeeId?: string): ProductionTag[] {
    const tag = (this.generatedTagsByWorkItem.get(workItemId) ?? []).find((candidate) => candidate.id === tagId)
    if (!tag) throw new Error(`Production tag ${tagId} was not found.`)
    this.productionTagService.printTags([tag], actorEmployeeId)
    this.syncOperationTags(workItemId, [tag])
    return this.getGeneratedTagsForWorkItem(workItemId)
  }

  private syncOperationTags(workItemId: string, tags: ProductionTag[]): void {
    const workItem = this.getRequiredWorkItem(workItemId)
    const operations = this.environment.productionPipelineService.getOperations(workItem)
    for (const tag of tags) {
      const operationNames = tag.tagType === 'FRAME'
        ? ['FRAME_CUT', 'FRAME_ASSEMBLY']
        : tag.tagType === 'THREE_D_BASE'
          ? ['BASE_CUT', 'BASE_ASSEMBLY']
          : tag.tagType === 'STRETCHER'
            ? ['STRETCHER_CUT', 'STRETCHER_ASSEMBLY']
            : []
      operations
        .filter((operation) => operationNames.includes(operation.name))
        .forEach((operation) => {
          operation.tagIds = [...new Set([...(operation.tagIds ?? []), tag.id])]
          operation.tagStatus = tag.status
        })
    }
    workItem.touch()
  }

  getGeneratedTagsForWorkItem(workItemId: string): ProductionTag[] {
    return [...(this.generatedTagsByWorkItem.get(workItemId) ?? [])].sort((left, right) =>
      right.generatedAt.localeCompare(left.generatedAt),
    )
  }

  listGeneratedTags(): ProductionTag[] {
    return [...this.generatedTagsByWorkItem.values()].flat()
  }

  replaceGeneratedTags(tags: ProductionTag[]): void {
    this.generatedTagsByWorkItem.clear()
    tags.forEach((tag) => {
      const current = this.generatedTagsByWorkItem.get(tag.workItemId) ?? []
      this.generatedTagsByWorkItem.set(tag.workItemId, [...current, tag])
    })
  }

  private changeStage(
    workItemId: string,
    direction: 'next' | 'previous',
    actorEmployeeId?: string,
  ): WorkItem {
    const workItem = this.getRequiredWorkItem(workItemId)
    const workflowContext = this.getWorkflowContext(workItem)
    const beforeStage = this.environment.workflowService.getCurrentStage(workItem, workflowContext.stages)

    if (direction === 'next') {
      this.environment.workflowService.moveToNextStage({
        workItem,
        workflow: workflowContext.workflow,
        stages: workflowContext.stages,
        transitions: workflowContext.transitions,
        rules: workflowContext.rules,
        approvals: this.toTransitionApprovals(workItem.id),
      })
    } else {
      this.environment.workflowService.moveToPreviousStage({
        workItem,
        workflow: workflowContext.workflow,
        stages: workflowContext.stages,
        transitions: workflowContext.transitions,
        rules: workflowContext.rules,
        approvals: this.toTransitionApprovals(workItem.id),
      })
    }

    this.recordStageTransitionActivity(workItem, workflowContext.stages, beforeStage, actorEmployeeId)
    return workItem
  }

  private recordStageTransitionActivity(
    workItem: WorkItem,
    stages: WorkflowStage[],
    beforeStage: WorkflowStage | null,
    actorEmployeeId?: string,
  ): void {
    const afterStage = this.environment.workflowService.getCurrentStage(workItem, stages)

    if (!beforeStage || !afterStage || beforeStage.id === afterStage.id) {
      return
    }

    this.environment.workItemService.recordWorkItemActivity({
      workItemId: workItem.id,
      action: 'STAGE_CHANGED',
      actorEmployeeId,
      message: `Stage moved from ${beforeStage.name} to ${afterStage.name}`,
      metadata: {
        fromStageId: beforeStage.id,
        toStageId: afterStage.id,
      },
    })
  }

  private toTransitionApprovals(workItemId: string): WorkflowTransitionApproval[] {
    return this.getApprovals(workItemId).map((approval) => ({
      role: approval.role,
      approvedByEmployeeId: approval.approvedByEmployeeId,
    }))
  }

  private assertActionAvailable(
    workItemId: string,
    action: Exclude<keyof WorkflowControlState, 'jumpOptions'>,
  ): void {
    const snapshot = this.getSnapshot(workItemId)
    const availability = snapshot.workflowControls[action]

    if (!availability.enabled) {
      throw new Error(availability.reason ?? 'This action is currently unavailable.')
    }
  }

  private assertJumpAvailable(workItemId: string, stageId: string): void {
    const snapshot = this.getSnapshot(workItemId)
    const option = snapshot.workflowControls.jumpOptions.find((candidate) => candidate.stageId === stageId)

    if (!option) {
      throw new Error('The selected stage is not part of this workflow.')
    }

    if (!option.enabled) {
      throw new Error(option.reason ?? 'Jump to that stage is not currently allowed.')
    }
  }

  private buildWorkflowControls(
    workItem: WorkItem,
    context: WorkflowContext,
    workflowStages: WorkflowStageView[],
  ): WorkflowControlState {
    const sortedStages = [...context.stages].sort((left, right) => left.sequence - right.sequence)
    const currentStage = this.environment.workflowService.getCurrentStage(workItem, sortedStages)
    const currentIndex = currentStage
      ? sortedStages.findIndex((stage) => stage.id === currentStage.id)
      : -1

    const approvals = this.toTransitionApprovals(workItem.id)
    const isArchived = this.isArchived(workItem)
    const isTerminalForBlocking =
      workItem.status === 'CANCELLED' || workItem.status === 'COMPLETE' || isArchived

    const blockedToggle: WorkflowActionAvailability = isTerminalForBlocking
      ? {
          enabled: false,
          reason: 'Blocked status is unavailable for completed, cancelled, or archived items.',
        }
      : { enabled: true }

    const moveToPreviousStage = this.buildDirectionalControl(
      workItem,
      context,
      sortedStages,
      currentIndex,
      -1,
      approvals,
      'Already on the first stage.',
    )

    const moveToNextStage = this.buildDirectionalControl(
      workItem,
      context,
      sortedStages,
      currentIndex,
      1,
      approvals,
      'Already on the final stage.',
    )

    const currentStageStatus = workflowStages.find((stage) => stage.status === 'CURRENT')
      ?? workflowStages.find((stage) => stage.stageId === currentStage?.id)

    const completeCurrentStage = this.buildCompleteStageControl(
      workItem,
      context,
      sortedStages,
      currentIndex,
      currentStageStatus,
      approvals,
    )

    const jumpOptions = sortedStages.map((stage) => {
      if (!currentStage) {
        return {
          stageId: stage.id,
          stageName: stage.name,
          enabled: false,
          reason: 'Current stage is unavailable.',
        }
      }

      if (stage.id === currentStage.id) {
        return {
          stageId: stage.id,
          stageName: stage.name,
          enabled: false,
          reason: 'Already on this stage.',
        }
      }

      const validation = this.environment.workflowService.validateTransition({
        workItem,
        workflow: context.workflow,
        stages: context.stages,
        transitions: context.transitions,
        rules: context.rules,
        toStageId: stage.id,
        approvals,
      })

      if (!validation.valid) {
        return {
          stageId: stage.id,
          stageName: stage.name,
          enabled: false,
          reason: validation.errors[0] ?? 'Jump to this stage is not allowed.',
        }
      }

      return {
        stageId: stage.id,
        stageName: stage.name,
        enabled: true,
      }
    })

    return {
      moveToPreviousStage,
      moveToNextStage,
      completeCurrentStage,
      blockedToggle,
      jumpOptions,
    }
  }

  private buildDirectionalControl(
    workItem: WorkItem,
    context: WorkflowContext,
    sortedStages: WorkflowStage[],
    currentIndex: number,
    direction: -1 | 1,
    approvals: WorkflowTransitionApproval[],
    edgeReason: string,
  ): WorkflowActionAvailability {
    if (currentIndex < 0) {
      return {
        enabled: false,
        reason: 'Current stage is unavailable.',
      }
    }

    const targetIndex = currentIndex + direction
    if (targetIndex < 0 || targetIndex >= sortedStages.length) {
      return {
        enabled: false,
        reason: edgeReason,
      }
    }

    const targetStage = sortedStages[targetIndex]
    const validation = this.environment.workflowService.validateTransition({
      workItem,
      workflow: context.workflow,
      stages: context.stages,
      transitions: context.transitions,
      rules: context.rules,
      toStageId: targetStage.id,
      approvals,
    })

    if (!validation.valid) {
      return {
        enabled: false,
        reason: validation.errors[0] ?? 'Transition is not currently allowed.',
      }
    }

    return { enabled: true }
  }

  private buildCompleteStageControl(
    workItem: WorkItem,
    context: WorkflowContext,
    sortedStages: WorkflowStage[],
    currentIndex: number,
    currentStageView: WorkflowStageView | undefined,
    approvals: WorkflowTransitionApproval[],
  ): WorkflowActionAvailability {
    if (currentIndex < 0) {
      return {
        enabled: false,
        reason: 'Current stage is unavailable.',
      }
    }

    if (currentStageView?.status === 'COMPLETED') {
      return {
        enabled: false,
        reason: 'Current stage is already complete.',
      }
    }

    const hasNext = currentIndex < sortedStages.length - 1
    if (hasNext) {
      const nextStage = sortedStages[currentIndex + 1]
      const validation = this.environment.workflowService.validateTransition({
        workItem,
        workflow: context.workflow,
        stages: context.stages,
        transitions: context.transitions,
        rules: context.rules,
        toStageId: nextStage.id,
        approvals,
      })

      if (!validation.valid) {
        return {
          enabled: false,
          reason: validation.errors[0] ?? 'Complete stage is unavailable.',
        }
      }

      return { enabled: true }
    }

    const currentStage = sortedStages[currentIndex]
    const approvalValidation = this.environment.workflowService.validateApprovals(
      currentStage.requiredApprovals,
      approvals,
    )

    if (!approvalValidation.valid) {
      return {
        enabled: false,
        reason: approvalValidation.errors[0] ?? 'Required approvals are missing.',
      }
    }

    return { enabled: true }
  }

  private isArchived(workItem: WorkItem): boolean {
    if (workItem.customFields.archived === true) {
      return true
    }

    const lifecycleState = workItem.customFields.lifecycleState
    return lifecycleState === 'ARCHIVED'
  }

  private buildStageViews(workItem: WorkItem, context: WorkflowContext): WorkflowStageView[] {
    const sortedStages = [...context.stages].sort((left, right) => left.sequence - right.sequence)
    const currentStage = this.environment.workflowService.getCurrentStage(workItem, sortedStages)
    const currentIndex = currentStage
      ? sortedStages.findIndex((stage) => stage.id === currentStage.id)
      : -1

    const completionByStageId = new Map<
      string,
      { completedAt: string; completedByEmployeeId?: string }
    >()

    const history = this.environment.workItemService.getHistory(workItem.id)
    for (const entry of history) {
      if (entry.action !== 'STAGE_CHANGED') {
        continue
      }

      const fromStageId = entry.metadata?.fromStageId
      if (typeof fromStageId === 'string') {
        completionByStageId.set(fromStageId, {
          completedAt: entry.createdAt,
          completedByEmployeeId: entry.actorEmployeeId,
        })
      }
    }

    if (workItem.status === 'COMPLETE' && currentStage) {
      const completionEntry = [...history]
        .reverse()
        .find((entry) => entry.action === 'WORK_COMPLETED')

      completionByStageId.set(currentStage.id, {
        completedAt: completionEntry?.createdAt ?? workItem.completedDate ?? workItem.updatedAt,
        completedByEmployeeId: completionEntry?.actorEmployeeId,
      })
    }

    return sortedStages.map((stage, index) => {
      const stageStatus: WorkflowStageView['status'] =
        currentIndex < 0
          ? 'PENDING'
          : index < currentIndex
            ? 'COMPLETED'
            : index === currentIndex
              ? workItem.status === 'COMPLETE'
                ? 'COMPLETED'
                : 'CURRENT'
              : 'PENDING'

      const completion = completionByStageId.get(stage.id)

      return {
        stageId: stage.id,
        stageName: stage.name,
        status: stageStatus,
        department: stage.department ?? 'Unassigned',
        estimatedDuration: stage.estimatedDuration,
        requiredApprovals:
          stage.requiredApprovals.length > 0
            ? stage.requiredApprovals
                .map((requirement) => `${requirement.role} x${requirement.minimumApprovals}`)
                .join(', ')
            : 'None',
        completionStatus: stageStatus === 'COMPLETED' ? 'Completed' : stageStatus === 'CURRENT' ? 'In Progress' : 'Pending',
        completedBy: completion?.completedByEmployeeId
          ? this.employeesById.get(completion.completedByEmployeeId)?.name ?? completion.completedByEmployeeId
          : '--',
        completedDate: completion?.completedAt ?? '--',
      }
    })
  }

  private buildActivityTimeline(workItem: WorkItem): ActivityTimelineEntry[] {
    const historyEntries = this.environment.workItemService.getHistory(workItem.id).map((entry) =>
      this.historyToTimelineEntry(entry),
    )

    const logEntries = this.environment.workItemService
      .listActivityLogs()
      .filter((log) => log.entityType === 'WorkItem' && log.entityId === workItem.id)
      .map((log) => ({
        id: log.id,
        source: 'log' as const,
        action: log.action,
        message: `Activity: ${log.action}`,
        occurredAt: log.occurredAt,
        actorEmployeeId: log.actorEmployeeId,
        actorEmployeeName: log.actorEmployeeId
          ? this.employeesById.get(log.actorEmployeeId)?.name ?? log.actorEmployeeId
          : 'System',
        metadata: log.metadata,
      }))

    return [...historyEntries, ...logEntries].sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    )
  }

  private historyToTimelineEntry(entry: WorkItemHistoryEntry): ActivityTimelineEntry {
    return {
      id: entry.id,
      source: 'history',
      action: (entry.action as ActivityAction) ?? 'UPDATED',
      message: entry.message,
      occurredAt: entry.createdAt,
      actorEmployeeId: entry.actorEmployeeId,
      actorEmployeeName: entry.actorEmployeeId
        ? this.employeesById.get(entry.actorEmployeeId)?.name ?? entry.actorEmployeeId
        : 'System',
      metadata: entry.metadata,
    }
  }

  private getRequiredWorkItem(workItemId: string): WorkItem {
    const directMatch = this.environment.workItemService.getWorkItemById(workItemId)
    if (directMatch) {
      return directMatch
    }

    const byNumber = this.environment
      .workItemService
      .listWorkItems()
      .find((candidate) => candidate.workItemNumber === workItemId)

    if (byNumber) {
      return byNumber
    }

    const decodedId = decodeURIComponent(workItemId)
    const decodedMatch = this.environment
      .workItemService
      .listWorkItems()
      .find((candidate) => candidate.workItemNumber === decodedId)

    if (decodedMatch) {
      return decodedMatch
    }

    throw new Error(`Work Item not found for id ${workItemId}`)
  }

  private getWorkflowContext(workItem: WorkItem): WorkflowContext {
    const context = this.environment.workflowContexts[workItem.workflowId]
    if (!context) {
      throw new Error(`Workflow context not found for workflow ${workItem.workflowId}`)
    }

    return context
  }
}

let detailService: WorkItemDetailService | null = null

export const getWorkItemDetailService = (
  environment: WorkshopListUiEnvironment,
): WorkItemDetailService => {
  if (!detailService) {
    detailService = new WorkItemDetailService(environment)
  }

  return detailService
}
