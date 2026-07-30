import type { WorkItem, WorkflowStage } from '../models'
import type { WorkItemStatus } from '../types/entities'
import type { WorkflowContext, WorkItemService } from './WorkItemService'
import { WorkflowService } from './WorkflowService'

type DateRange = {
  from?: string
  to?: string
}

export interface WorkshopListRow {
  workItemId: string
  workItemNumber: string
  customerName: string
  artworkName: string
  productName: string
  workItemType: string
  priority: number
  status: WorkItemStatus
  currentStage: string
  assignedDepartment: string
  assignedEmployee: string
  dueDate?: string
  daysUntilDue?: number
  isLate: boolean
  isBlocked: boolean
  workflowProgress: number
  notesSummary: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface WorkshopListFilter {
  workItemTypes?: string[]
  statuses?: WorkItemStatus[]
  priorities?: number[]
  workflowStages?: string[]
  departments?: string[]
  employees?: string[]
  dueDateRange?: DateRange
  lateItemsOnly?: boolean
  blockedItemsOnly?: boolean
  tags?: string[]
}

export interface WorkshopListSort {
  field: 'priority' | 'dueDate' | 'currentStage' | 'customer' | 'artwork' | 'createdDate' | 'updatedDate'
  direction?: 'asc' | 'desc'
}

export interface WorkshopListGroup {
  field: 'currentStage' | 'assignedDepartment' | 'assignedEmployee' | 'status' | 'workItemType' | 'priority'
}

export interface WorkshopListGroupResult {
  key: string
  rows: WorkshopListRow[]
}

export interface WorkshopListSummary {
  totalActiveItems: number
  lateItems: number
  blockedItems: number
  dueToday: number
  dueThisWeek: number
  countsByWorkflowStage: Record<string, number>
  countsByDepartment: Record<string, number>
  countsByPriority: Record<string, number>
}

export interface PriorityQueueCategoryRule {
  label: string
  matches: (row: WorkshopListRow) => boolean
}

export interface WorkshopListLookupProvider {
  getWorkflowContext: (workflowId: string) => WorkflowContext | undefined
  getCustomerName?: (customerId: string) => string | undefined
  getArtworkName?: (artworkId: string) => string | undefined
  getProductName?: (productId: string) => string | undefined
  getDepartmentName?: (departmentId: string) => string | undefined
  getEmployeeName?: (employeeId: string) => string | undefined
}

export interface WorkshopListServiceOptions {
  priorityQueueCategories?: PriorityQueueCategoryRule[]
  priorityDirection?: 'asc' | 'desc'
  nowProvider?: () => Date
}

const defaultPriorityQueueCategories: PriorityQueueCategoryRule[] = [
  {
    label: 'Original artwork',
    matches: (row) => row.workItemType.toLowerCase().includes('original'),
  },
  {
    label: 'Customer orders',
    matches: (row) => row.workItemType.toLowerCase().includes('customer'),
  },
  {
    label: 'Gallery inventory',
    matches: (row) => row.workItemType.toLowerCase().includes('gallery'),
  },
  {
    label: 'Other work',
    matches: () => true,
  },
]

export class WorkshopListService {
  private readonly workItemService: WorkItemService
  private readonly workflowService: WorkflowService
  private readonly lookups: WorkshopListLookupProvider
  private readonly categories: PriorityQueueCategoryRule[]
  private readonly priorityDirection: 'asc' | 'desc'
  private readonly nowProvider: () => Date

  constructor(
    workItemService: WorkItemService,
    workflowService: WorkflowService,
    lookups: WorkshopListLookupProvider,
    options?: WorkshopListServiceOptions,
  ) {
    this.workItemService = workItemService
    this.workflowService = workflowService
    this.lookups = lookups
    this.categories = options?.priorityQueueCategories ?? defaultPriorityQueueCategories
    this.priorityDirection = options?.priorityDirection ?? 'desc'
    this.nowProvider = options?.nowProvider ?? (() => new Date())
  }

  getRows(): WorkshopListRow[] {
    const workItems = this.workItemService.listWorkItems()
    return workItems.map((workItem) => this.toRow(workItem))
  }

  search(term: string, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const normalized = term.trim().toLowerCase()
    if (!normalized) {
      return rows ? [...rows] : this.getRows()
    }

    const sourceRows = rows ?? this.getRows()

    return sourceRows.filter((row) => {
      const haystack = [
        row.workItemNumber,
        row.customerName,
        row.artworkName,
        row.productName,
        row.currentStage,
        row.assignedDepartment,
        row.assignedEmployee,
        row.notesSummary,
        ...row.tags,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }

  filter(filterValue: WorkshopListFilter, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()

    return sourceRows.filter((row) => {
      if (filterValue.workItemTypes && filterValue.workItemTypes.length > 0) {
        if (!filterValue.workItemTypes.includes(row.workItemType)) {
          return false
        }
      }

      if (filterValue.statuses && filterValue.statuses.length > 0) {
        if (!filterValue.statuses.includes(row.status)) {
          return false
        }
      }

      if (filterValue.priorities && filterValue.priorities.length > 0) {
        if (!filterValue.priorities.includes(row.priority)) {
          return false
        }
      }

      if (filterValue.workflowStages && filterValue.workflowStages.length > 0) {
        if (!filterValue.workflowStages.includes(row.currentStage)) {
          return false
        }
      }

      if (filterValue.departments && filterValue.departments.length > 0) {
        if (!filterValue.departments.includes(row.assignedDepartment)) {
          return false
        }
      }

      if (filterValue.employees && filterValue.employees.length > 0) {
        if (!filterValue.employees.includes(row.assignedEmployee)) {
          return false
        }
      }

      if (filterValue.tags && filterValue.tags.length > 0) {
        const hasAnyTag = filterValue.tags.some((tag) => row.tags.includes(tag))
        if (!hasAnyTag) {
          return false
        }
      }

      if (filterValue.lateItemsOnly && !row.isLate) {
        return false
      }

      if (filterValue.blockedItemsOnly && !row.isBlocked) {
        return false
      }

      if (filterValue.dueDateRange) {
        if (!this.isWithinDateRange(row.dueDate, filterValue.dueDateRange)) {
          return false
        }
      }

      return true
    })
  }

  sort(sortValue: WorkshopListSort, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const direction = sortValue.direction ?? 'asc'
    const sourceRows = rows ?? this.getRows()

    const sorted = [...sourceRows].sort((left, right) => {
      switch (sortValue.field) {
        case 'priority':
          return left.priority - right.priority
        case 'dueDate':
          return this.compareNullableDates(left.dueDate, right.dueDate)
        case 'currentStage':
          return left.currentStage.localeCompare(right.currentStage)
        case 'customer':
          return left.customerName.localeCompare(right.customerName)
        case 'artwork':
          return left.artworkName.localeCompare(right.artworkName)
        case 'createdDate':
          return this.compareDates(left.createdAt, right.createdAt)
        case 'updatedDate':
          return this.compareDates(left.updatedAt, right.updatedAt)
        default:
          return 0
      }
    })

    return direction === 'desc' ? sorted.reverse() : sorted
  }

  group(groupValue: WorkshopListGroup, rows?: WorkshopListRow[]): WorkshopListGroupResult[] {
    const sourceRows = rows ?? this.getRows()
    const grouped = new Map<string, WorkshopListRow[]>()

    for (const row of sourceRows) {
      const key = this.getGroupKey(groupValue.field, row)
      const existing = grouped.get(key) ?? []
      existing.push(row)
      grouped.set(key, existing)
    }

    return [...grouped.entries()]
      .map(([key, groupRows]) => ({ key, rows: groupRows }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }

  getLateItems(rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    return sourceRows.filter((row) => row.isLate)
  }

  getBlockedItems(rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    return sourceRows.filter((row) => row.isBlocked)
  }

  getItemsDueToday(rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    const now = this.nowProvider()

    return sourceRows.filter((row) => {
      if (!row.dueDate) {
        return false
      }

      return this.isSameDay(row.dueDate, now)
    })
  }

  getItemsDueThisWeek(rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    const now = this.nowProvider()
    const weekEnd = this.endOfWeek(now)

    return sourceRows.filter((row) => {
      if (!row.dueDate) {
        return false
      }

      const due = this.parseDate(row.dueDate)
      return due >= this.startOfDay(now) && due <= weekEnd
    })
  }

  getItemsByStage(stageName: string, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    return sourceRows.filter((row) => row.currentStage === stageName)
  }

  getItemsByDepartment(departmentName: string, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    return sourceRows.filter((row) => row.assignedDepartment === departmentName)
  }

  getItemsByEmployee(employeeName: string, rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()
    return sourceRows.filter((row) => row.assignedEmployee === employeeName)
  }

  getPriorityQueue(rows?: WorkshopListRow[]): WorkshopListRow[] {
    const sourceRows = rows ?? this.getRows()

    const groupedByCategory = this.categories.map((category, index) => ({
      index,
      rows: sourceRows.filter((row) => category.matches(row)),
    }))

    const assignedRowIds = new Set<string>()
    const queue: WorkshopListRow[] = []

    for (const categoryGroup of groupedByCategory) {
      const orderedRows = categoryGroup.rows
        .filter((row) => {
          if (assignedRowIds.has(row.workItemId)) {
            return false
          }

          assignedRowIds.add(row.workItemId)
          return true
        })
        .sort((left, right) => {
          if (left.isLate !== right.isLate) {
            return left.isLate ? -1 : 1
          }

          const dueComparison = this.compareNullableDates(left.dueDate, right.dueDate)
          if (dueComparison !== 0) {
            return dueComparison
          }

          if (left.priority !== right.priority) {
            if (this.priorityDirection === 'desc') {
              return right.priority - left.priority
            }

            return left.priority - right.priority
          }

          return this.compareDates(left.createdAt, right.createdAt)
        })

      queue.push(...orderedRows)
    }

    return queue
  }

  getSummary(rows?: WorkshopListRow[]): WorkshopListSummary {
    const sourceRows = rows ?? this.getRows()

    const activeRows = sourceRows.filter((row) => row.status !== 'COMPLETE' && row.status !== 'CANCELLED')

    const countsByWorkflowStage: Record<string, number> = {}
    const countsByDepartment: Record<string, number> = {}
    const countsByPriority: Record<string, number> = {}

    for (const row of sourceRows) {
      countsByWorkflowStage[row.currentStage] = (countsByWorkflowStage[row.currentStage] ?? 0) + 1
      countsByDepartment[row.assignedDepartment] = (countsByDepartment[row.assignedDepartment] ?? 0) + 1
      const priorityKey = String(row.priority)
      countsByPriority[priorityKey] = (countsByPriority[priorityKey] ?? 0) + 1
    }

    return {
      totalActiveItems: activeRows.length,
      lateItems: this.getLateItems(sourceRows).length,
      blockedItems: this.getBlockedItems(sourceRows).length,
      dueToday: this.getItemsDueToday(sourceRows).length,
      dueThisWeek: this.getItemsDueThisWeek(sourceRows).length,
      countsByWorkflowStage,
      countsByDepartment,
      countsByPriority,
    }
  }

  private toRow(workItem: WorkItem): WorkshopListRow {
    const workflowContext = this.lookups.getWorkflowContext(workItem.workflowId)
    const currentStage = this.resolveCurrentStage(workItem, workflowContext)

    const dueDate = workItem.dueDate ?? workItem.dueAt
    const daysUntilDue = dueDate ? this.calculateDaysUntilDue(dueDate) : undefined
    const isLate = dueDate ? this.isDateBeforeToday(dueDate) && workItem.status !== 'COMPLETE' : false

    return {
      workItemId: workItem.id,
      workItemNumber: workItem.workItemNumber,
      customerName: this.lookups.getCustomerName?.(workItem.customerId) ?? workItem.customerId,
      artworkName: workItem.artworkId
        ? this.lookups.getArtworkName?.(workItem.artworkId) ?? workItem.artworkId
        : 'N/A',
      productName: this.lookups.getProductName?.(workItem.productId) ?? workItem.productId,
      workItemType: workItem.type,
      priority: workItem.priority,
      status: workItem.status,
      currentStage: currentStage?.name ?? workItem.currentStageId,
      assignedDepartment:
        (workItem.assignedDepartmentId
          ? this.lookups.getDepartmentName?.(workItem.assignedDepartmentId)
          : undefined) ?? workItem.assignedDepartmentId ?? 'UNASSIGNED',
      assignedEmployee:
        (workItem.assignedEmployeeId
          ? this.lookups.getEmployeeName?.(workItem.assignedEmployeeId)
          : undefined) ?? workItem.assignedEmployeeId ?? 'UNASSIGNED',
      dueDate,
      daysUntilDue,
      isLate,
      isBlocked: workItem.status === 'BLOCKED',
      workflowProgress: this.calculateWorkflowProgress(workItem, workflowContext),
      notesSummary: this.getNotesSummary(workItem.notes),
      tags: workItem.tags,
      createdAt: workItem.createdAt,
      updatedAt: workItem.updatedAt,
    }
  }

  private resolveCurrentStage(
    workItem: WorkItem,
    workflowContext: WorkflowContext | undefined,
  ): WorkflowStage | undefined {
    if (!workflowContext) {
      return undefined
    }

    return this.workflowService.getCurrentStage(workItem, workflowContext.stages) ?? undefined
  }

  private calculateWorkflowProgress(
    workItem: WorkItem,
    workflowContext: WorkflowContext | undefined,
  ): number {
    if (!workflowContext || workflowContext.stages.length === 0) {
      return 0
    }

    const sortedStages = [...workflowContext.stages].sort((a, b) => a.sequence - b.sequence)
    const currentStage = this.resolveCurrentStage(workItem, workflowContext)

    if (!currentStage) {
      return 0
    }

    const currentIndex = sortedStages.findIndex((stage) => stage.id === currentStage.id)
    if (currentIndex < 0) {
      return 0
    }

    const completedPortion = (currentIndex + (workItem.status === 'COMPLETE' ? 1 : 0)) / sortedStages.length
    return Math.max(0, Math.min(100, Math.round(completedPortion * 100)))
  }

  private getNotesSummary(notes: string[]): string {
    if (notes.length === 0) {
      return ''
    }

    const latest = notes[notes.length - 1]
    if (notes.length === 1) {
      return latest
    }

    return `${notes.length} notes, latest: ${latest}`
  }

  private getGroupKey(field: WorkshopListGroup['field'], row: WorkshopListRow): string {
    switch (field) {
      case 'currentStage':
        return row.currentStage
      case 'assignedDepartment':
        return row.assignedDepartment
      case 'assignedEmployee':
        return row.assignedEmployee
      case 'status':
        return row.status
      case 'workItemType':
        return row.workItemType
      case 'priority':
        return String(row.priority)
      default:
        return 'UNKNOWN'
    }
  }

  private compareDates(left: string, right: string): number {
    return this.parseDate(left).getTime() - this.parseDate(right).getTime()
  }

  private compareNullableDates(left?: string, right?: string): number {
    if (!left && !right) {
      return 0
    }

    if (!left) {
      return 1
    }

    if (!right) {
      return -1
    }

    return this.compareDates(left, right)
  }

  private isWithinDateRange(dateValue: string | undefined, dateRange: DateRange): boolean {
    if (!dateValue) {
      return false
    }

    const target = this.startOfDay(this.parseDate(dateValue))

    if (dateRange.from) {
      const fromDate = this.startOfDay(this.parseDate(dateRange.from))
      if (target < fromDate) {
        return false
      }
    }

    if (dateRange.to) {
      const toDate = this.endOfDay(this.parseDate(dateRange.to))
      if (target > toDate) {
        return false
      }
    }

    return true
  }

  private calculateDaysUntilDue(dueDate: string): number {
    const now = this.startOfDay(this.nowProvider())
    const due = this.startOfDay(this.parseDate(dueDate))
    const differenceMs = due.getTime() - now.getTime()

    return Math.ceil(differenceMs / (24 * 60 * 60 * 1000))
  }

  private isDateBeforeToday(dateValue: string): boolean {
    const today = this.startOfDay(this.nowProvider())
    const target = this.startOfDay(this.parseDate(dateValue))
    return target.getTime() < today.getTime()
  }

  private isSameDay(dateValue: string, compareDate: Date): boolean {
    const target = this.startOfDay(this.parseDate(dateValue))
    const comparison = this.startOfDay(compareDate)

    return target.getTime() === comparison.getTime()
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  }

  private endOfWeek(date: Date): Date {
    const start = this.startOfDay(date)
    const day = start.getDay()
    const remaining = 6 - day
    const weekEnd = new Date(start)
    weekEnd.setDate(start.getDate() + remaining)

    return this.endOfDay(weekEnd)
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${value}`)
    }

    return parsed
  }
}
