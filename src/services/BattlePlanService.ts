import { ActivityLog, BattlePlan, BattlePlanItem, BattlePlanTemplate } from '../models'
import type {
  ActivityAction,
  ActivityEntityType,
  BattlePlanItem as BattlePlanItemShape,
} from '../types/entities'
import { nowIso } from '../utils/time'
import { WorkItemService } from './WorkItemService'
import {
  WorkshopListService,
  type WorkshopListRow,
} from './WorkshopListService'

interface ActivityInput {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  actorEmployeeId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface CreateBattlePlanInput {
  date: string
  department?: string
  createdBy?: string
  notes?: string
}

export interface GenerateDailyPlanInput {
  date: string
  createdBy?: string
  templateIdByDepartment?: Record<string, string>
}

export interface BattlePlanPriorityRule {
  name: string
  matches: (row: WorkshopListRow) => boolean
}

export interface BattlePlanServiceConfig {
  typePriorityRules?: BattlePlanPriorityRule[]
  tomorrowWindowDays?: number
  defaultEstimateMinutes?: number
  nowProvider?: () => Date
}

const defaultTypePriorityRules: BattlePlanPriorityRule[] = [
  {
    name: 'Original artwork',
    matches: (row) => row.workItemType.toLowerCase().includes('original'),
  },
  {
    name: 'Customer orders',
    matches: (row) => row.workItemType.toLowerCase().includes('customer'),
  },
  {
    name: 'Gallery inventory',
    matches: (row) => row.workItemType.toLowerCase().includes('gallery'),
  },
  {
    name: 'Other work',
    matches: () => true,
  },
]

export class BattlePlanService {
  private readonly workItemService: WorkItemService
  private readonly workshopListService: WorkshopListService
  private readonly nowProvider: () => Date
  private readonly tomorrowWindowDays: number
  private readonly defaultEstimateMinutes: number
  private readonly typePriorityRules: BattlePlanPriorityRule[]

  private readonly plans = new Map<string, BattlePlan>()
  private readonly templates = new Map<string, BattlePlanTemplate>()
  private readonly activityLogs: ActivityLog[] = []

  constructor(
    workItemService: WorkItemService,
    workshopListService: WorkshopListService,
    config?: BattlePlanServiceConfig,
  ) {
    this.workItemService = workItemService
    this.workshopListService = workshopListService
    this.nowProvider = config?.nowProvider ?? (() => new Date())
    this.tomorrowWindowDays = config?.tomorrowWindowDays ?? 1
    this.defaultEstimateMinutes = config?.defaultEstimateMinutes ?? 60
    this.typePriorityRules = config?.typePriorityRules ?? defaultTypePriorityRules
  }

  createBattlePlan(date: string, department?: string, createdBy?: string): BattlePlan {
    const plan = new BattlePlan({
      date,
      department,
      createdBy,
      notes: '',
      status: 'DRAFT',
      items: [],
    })

    this.plans.set(plan.id, plan)
    this.logActivity({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'CREATED',
      actorEmployeeId: createdBy,
      metadata: {
        date,
        department: department ?? 'ALL',
      },
    })

    return plan
  }

  createTemplate(input: {
    name: string
    department?: string
    defaultEstimatedMinutesByType?: Record<string, number>
    defaultItemNotes?: string[]
    active?: boolean
  }): BattlePlanTemplate {
    const template = new BattlePlanTemplate({
      name: input.name,
      department: input.department,
      defaultEstimatedMinutesByType: input.defaultEstimatedMinutesByType ?? {},
      defaultItemNotes: input.defaultItemNotes ?? [],
      active: input.active ?? true,
    })

    this.templates.set(template.id, template)
    this.logActivity({
      entityType: 'BattlePlanTemplate',
      entityId: template.id,
      action: 'CREATED',
      metadata: {
        department: template.department ?? 'ALL',
      },
    })

    return template
  }

  generateDailyPlan(date: string): BattlePlan[]
  generateDailyPlan(input: GenerateDailyPlanInput): BattlePlan[]
  generateDailyPlan(input: string | GenerateDailyPlanInput): BattlePlan[] {
    const resolved = typeof input === 'string' ? { date: input } : input

    const activeRows = this.getActiveRows()
    const groupedByDepartment = this.groupRowsByDepartment(activeRows)
    const generatedPlans: BattlePlan[] = []

    groupedByDepartment.forEach((rows, department) => {
      const plan = this.createBattlePlan(resolved.date, department, resolved.createdBy)
      const template = resolved.templateIdByDepartment?.[department]
        ? this.templates.get(resolved.templateIdByDepartment[department])
        : undefined

      const orderedRows = this.orderRows(rows)
      plan.items = orderedRows.map((row, index) =>
        this.toPlanItem(row, index + 1, department, template),
      )

      if (template && template.defaultItemNotes.length > 0 && !plan.notes) {
        plan.notes = template.defaultItemNotes.join(' | ')
      }

      plan.touch()
      generatedPlans.push(plan)
    })

    return generatedPlans
  }

  publishPlan(planId: string, publishedBy?: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    plan.status = 'PUBLISHED'
    plan.touch()

    this.logActivity({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId: publishedBy,
      metadata: {
        status: plan.status,
        date: plan.date,
        department: plan.department ?? 'ALL',
      },
    })

    return plan
  }

  archivePlan(planId: string, archivedBy?: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    plan.status = 'ARCHIVED'
    plan.touch()

    this.logActivity({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'STATUS_CHANGED',
      actorEmployeeId: archivedBy,
      metadata: {
        status: plan.status,
      },
    })

    return plan
  }

  addWorkItem(planId: string, workItemId: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    const row = this.getRowByWorkItemId(workItemId)

    if (!row) {
      throw new Error(`Workshop row not found for WorkItem ${workItemId}`)
    }

    if (plan.items.some((item) => item.workItemId === workItemId)) {
      return plan
    }

    const nextSequence = plan.items.length + 1
    const item = this.toPlanItem(row, nextSequence, plan.department)
    plan.items = [...plan.items, item]
    plan.touch()

    this.logActivity({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'UPDATED',
      metadata: {
        operation: 'addWorkItem',
        workItemId,
      },
    })

    return plan
  }

  removeWorkItem(planId: string, workItemId: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)

    plan.items = plan.items
      .filter((item) => item.workItemId !== workItemId)
      .map((item, index) => ({
        ...item,
        sequence: index + 1,
      }))

    plan.touch()

    this.logActivity({
      entityType: 'BattlePlan',
      entityId: plan.id,
      action: 'UPDATED',
      metadata: {
        operation: 'removeWorkItem',
        workItemId,
      },
    })

    return plan
  }

  moveItem(planId: string, fromSequence: number, toSequence: number): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    if (fromSequence === toSequence) {
      return plan
    }

    const fromIndex = fromSequence - 1
    const toIndex = toSequence - 1

    if (fromIndex < 0 || fromIndex >= plan.items.length || toIndex < 0 || toIndex >= plan.items.length) {
      throw new Error('moveItem sequence is out of range')
    }

    const items = [...plan.items]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)

    plan.items = items.map((item, index) => ({ ...item, sequence: index + 1 }))
    plan.touch()

    return plan
  }

  assignEmployee(planId: string, workItemId: string, employeeId: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    plan.items = plan.items.map((item) =>
      item.workItemId === workItemId ? { ...item, assignedEmployee: employeeId } : item,
    )
    plan.touch()

    return plan
  }

  assignDepartment(planId: string, workItemId: string, departmentId: string): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    plan.items = plan.items.map((item) =>
      item.workItemId === workItemId ? { ...item, assignedDepartment: departmentId } : item,
    )
    plan.touch()

    return plan
  }

  estimateTime(planId: string, workItemId: string, estimatedMinutes: number): BattlePlan {
    const plan = this.getRequiredPlan(planId)
    plan.items = plan.items.map((item) =>
      item.workItemId === workItemId ? { ...item, estimatedMinutes } : item,
    )
    plan.touch()

    return plan
  }

  getTodaysPlan(): BattlePlan[] {
    const today = this.formatLocalDate(this.nowProvider())
    return this.getPlansByDate(today)
  }

  getDepartmentPlan(date: string, department: string): BattlePlan | undefined {
    return this.getPlansByDate(date).find((plan) => plan.department === department)
  }

  getEmployeePlan(date: string, employeeId: string): BattlePlanItemShape[] {
    const plans = this.getPlansByDate(date)
    return plans.flatMap((plan) =>
      plan.items.filter((item) => item.assignedEmployee === employeeId),
    )
  }

  listPlans(): BattlePlan[] {
    return [...this.plans.values()]
  }

  listTemplates(): BattlePlanTemplate[] {
    return [...this.templates.values()]
  }

  listActivityLogs(): ActivityLog[] {
    return [...this.activityLogs]
  }

  private getPlansByDate(date: string): BattlePlan[] {
    return [...this.plans.values()].filter((plan) => plan.date === date && plan.status !== 'ARCHIVED')
  }

  private getActiveRows(): WorkshopListRow[] {
    const allRows = this.workshopListService.getRows()
    const workItemsById = new Map(
      this.workItemService.listWorkItems().map((workItem) => [workItem.id, workItem]),
    )

    return allRows.filter((row) => {
      if (row.status === 'COMPLETE' || row.status === 'CANCELLED') {
        return false
      }

      const workItem = workItemsById.get(row.workItemId)
      if (!workItem) {
        return false
      }

      return workItem.customFields.archived !== true
    })
  }

  private groupRowsByDepartment(rows: WorkshopListRow[]): Map<string, WorkshopListRow[]> {
    const grouped = new Map<string, WorkshopListRow[]>()

    for (const row of rows) {
      const key = row.assignedDepartment || 'UNASSIGNED'
      const existing = grouped.get(key) ?? []
      existing.push(row)
      grouped.set(key, existing)
    }

    return grouped
  }

  private orderRows(rows: WorkshopListRow[]): WorkshopListRow[] {
    return [...rows].sort((left, right) => {
      const leftTypeRank = this.getTypeRank(left)
      const rightTypeRank = this.getTypeRank(right)
      if (leftTypeRank !== rightTypeRank) {
        return leftTypeRank - rightTypeRank
      }

      const leftUrgencyRank = this.getUrgencyRank(left)
      const rightUrgencyRank = this.getUrgencyRank(right)
      if (leftUrgencyRank !== rightUrgencyRank) {
        return leftUrgencyRank - rightUrgencyRank
      }

      if (left.priority !== right.priority) {
        return right.priority - left.priority
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    })
  }

  private getTypeRank(row: WorkshopListRow): number {
    for (let index = 0; index < this.typePriorityRules.length; index += 1) {
      if (this.typePriorityRules[index].matches(row)) {
        return index
      }
    }

    return this.typePriorityRules.length
  }

  private getUrgencyRank(row: WorkshopListRow): number {
    if (row.isLate) {
      return 0
    }

    if (row.daysUntilDue === 0) {
      return 1
    }

    if (row.daysUntilDue === this.tomorrowWindowDays) {
      return 2
    }

    return 3
  }

  private toPlanItem(
    row: WorkshopListRow,
    sequence: number,
    department?: string,
    template?: BattlePlanTemplate,
  ): BattlePlanItem {
    const estimateOverride = template?.defaultEstimatedMinutesByType[row.workItemType]
    const notes = template?.defaultItemNotes?.length
      ? [...template.defaultItemNotes]
      : row.notesSummary
        ? [row.notesSummary]
        : []

    return new BattlePlanItem({
      workItemId: row.workItemId,
      sequence,
      assignedEmployee: row.assignedEmployee !== 'UNASSIGNED' ? row.assignedEmployee : undefined,
      assignedDepartment: row.assignedDepartment !== 'UNASSIGNED' ? row.assignedDepartment : department,
      estimatedMinutes: estimateOverride ?? this.defaultEstimateMinutes,
      currentWorkflowStage: row.currentStage,
      dueDate: row.dueDate,
      priority: row.priority,
      notes,
    })
  }

  private getRowByWorkItemId(workItemId: string): WorkshopListRow | undefined {
    return this.workshopListService.getRows().find((row) => row.workItemId === workItemId)
  }

  private getRequiredPlan(planId: string): BattlePlan {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new Error(`BattlePlan not found for id ${planId}`)
    }

    return plan
  }

  private logActivity(input: ActivityInput): ActivityLog {
    const activity = new ActivityLog({
      ...input,
      occurredAt: nowIso(),
    })

    this.activityLogs.push(activity)
    return activity
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
}
