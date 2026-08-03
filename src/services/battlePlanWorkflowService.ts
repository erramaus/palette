import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'
import type { Employee } from '../types/employees'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type {
  BattlePlanChecklistItem,
  BattlePlanEndOfDayReport,
  BattlePlanGroupStatus,
  BattlePlanTaskGroup,
  BattlePlanTaskGroupType,
  BattlePlanWorkItemEntry,
} from '../types/battlePlanWorkflow'

const GROUP_META_PREFIX = '[BP_GROUP]'

export const GROUP_LABELS: Record<BattlePlanTaskGroupType, string> = {
  START_OF_DAY: 'Start of Day Workshop Tasks',
  FILES: 'Files',
  CANVASES_TO_PRINT: 'Canvases to Print',
  DIBOND_TO_CUT: 'Dibond to Cut',
  STRETCHERS_TO_MAKE: 'Stretchers to Make',
  BASES_TO_MAKE: 'Bases to Make',
  PIECES_TO_STRETCH: 'Pieces to Stretch',
  PIECES_TO_BASE: 'Pieces to Base',
  FRAMES_TO_MAKE: 'Frames to Make',
  PIECES_TO_FRAME: 'Pieces to Frame',
  PIECES_TO_SHIP: 'Pieces to Ship',
  PIECES_TO_BOX: 'Pieces to Box',
  CRATE_TO_BUILD: 'Crate to Build',
  CLEANING: 'Cleaning',
  END_OF_DAY: 'End of Day Workshop Tasks',
  CUSTOM: 'Custom Group',
}

export const BP_STANDING_NOTE =
  'Steps listed on this BP must be completed the day they are assigned, in the order they have been listed. If steps are not completed, they must be reported to the Production Director.'

export const BP_PRIORITY_ORDER = [
  '1. Originals, sold or unsold',
  '2. Customer-purchased 3D Textured Replicas and canvases',
  '3. Gallery inventory',
]

export const DEFAULT_START_OF_DAY_TASKS = [
  'Open all doors to the warehouse',
  'BP meeting',
  'Review tasks that need to be completed',
  'Read new Slack or Gmail messages and reply as needed',
  'Move van out of warehouse for proper working space',
]

export const DEFAULT_CLEANING_TASKS = [
  'Break down frames that cannot be used',
  'Move empty frames to the appropriate carpet shelving',
  'Move gallery pieces needing reframe or reprint to the inventory rack',
]

export const DEFAULT_END_OF_DAY_TASKS = [
  'Update the Workshop List',
  'Update the BP corkboard',
  'Report incomplete BP items to the Production Director',
  'Return equipment to the correct stations',
  'Remove scrap materials from workstations',
  'Bring the van inside if last person',
  'Check van doors',
  'Lock building doors including the bridge',
]

export const stepToGroupType = (step: ProductionStepName): BattlePlanTaskGroupType => {
  switch (step) {
    case 'FILES':
      return 'FILES'
    case 'PRINTED':
      return 'CANVASES_TO_PRINT'
    case 'DIBOND':
      return 'DIBOND_TO_CUT'
    case 'STRETCHER_BASE':
      return 'STRETCHERS_TO_MAKE'
    case 'MOUNTED':
      return 'PIECES_TO_BASE'
    case 'FRAME_MADE':
      return 'FRAMES_TO_MAKE'
    case 'FRAMED':
      return 'PIECES_TO_FRAME'
    case 'SHIPPED':
      return 'PIECES_TO_SHIP'
    default:
      return 'CUSTOM'
  }
}

export const makeChecklistItems = (
  items: string[],
  planId: string,
  section: 'START' | 'CLEAN' | 'END',
): BattlePlanChecklistItem[] =>
  items.map((text, index) => ({
    id: `${planId}-${section}-${index + 1}`,
    text,
    checked: false,
    notes: '',
  }))

interface ParsedGroupMeta {
  groupId?: string
  groupType?: BattlePlanTaskGroupType
  groupName?: string
  notes: string
}

const parseGroupMeta = (rawNotes: string): ParsedGroupMeta => {
  if (!rawNotes.startsWith(GROUP_META_PREFIX)) {
    return { notes: rawNotes }
  }

  const firstLineEnd = rawNotes.indexOf('\n')
  const metaLine = firstLineEnd === -1 ? rawNotes : rawNotes.slice(0, firstLineEnd)
  const notes = firstLineEnd === -1 ? '' : rawNotes.slice(firstLineEnd + 1)

  const pairs = metaLine
    .replace(GROUP_META_PREFIX, '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  const values: Record<string, string> = {}

  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key && value) {
      values[key] = value
    }
  }

  const groupType = values.type as BattlePlanTaskGroupType | undefined

  return {
    groupId: values.id,
    groupType,
    groupName: values.name,
    notes,
  }
}

export const withGroupMeta = (
  notes: string,
  groupId: string,
  groupType: BattlePlanTaskGroupType,
  groupName: string,
): string =>
  `${GROUP_META_PREFIX} id=${groupId}; type=${groupType}; name=${groupName}\n${notes}`.trim()

export const toWorkflowGroups = (
  plan: BattlePlan,
  jobs: ProductionJob[],
): BattlePlanTaskGroup[] => {
  const tasks = [...plan.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
  const groupsById = new Map<string, BattlePlanTaskGroup>()

  for (const task of tasks) {
    const job = jobs.find((candidate) => candidate.id === task.productionJobId)
    const parsed = parseGroupMeta(task.notes)
    const fallbackType = stepToGroupType(task.productionStep)
    const groupType = task.productionGroup ?? parsed.groupType ?? fallbackType
    const groupId = parsed.groupId ?? `${plan.id}-${groupType}`
    const groupName = parsed.groupName ?? GROUP_LABELS[groupType]

    if (!groupsById.has(groupId)) {
      groupsById.set(groupId, {
        id: groupId,
        sequence: groupsById.size + 1,
        type: groupType,
        operationName: groupName,
        totalEstimatedMinutes: 0,
        assignedEmployeeId: plan.assignedWorkerId,
        status: 'NOT_STARTED',
        notes: '',
        workItems: [],
      })
    }

    const group = groupsById.get(groupId)
    if (!group) {
      continue
    }

    const entry: BattlePlanWorkItemEntry = {
      id: `${groupId}-${task.id}`,
      taskId: task.id,
      workItemId: task.productionJobId,
      workItemNumber: job?.orderNumber ?? task.productionJobId,
      artworkTitle: job?.artworkTitle ?? task.description,
      customerOrDestination: job?.customerName ?? 'Unknown',
      dueStatus: job?.dueStatus ?? 'ON_TRACK',
      productType: job?.productType ?? 'CANVAS',
      notes: parsed.notes || task.notes,
      productionStep: task.productionStep,
      completed: task.completed,
      carryForward: task.carryForward,
      locked: task.locked,
    }

    group.workItems.push(entry)
    group.totalEstimatedMinutes += task.estimatedMinutes

    if (group.notes.length === 0 && parsed.notes.length > 0) {
      group.notes = parsed.notes
    }
  }

  return [...groupsById.values()].map((group, index) => {
    const completedCount = group.workItems.filter((item) => item.completed).length
    let status: BattlePlanGroupStatus = 'NOT_STARTED'

    if (completedCount === group.workItems.length && group.workItems.length > 0) {
      status = 'COMPLETE'
    } else if (completedCount > 0) {
      status = 'IN_PROGRESS'
    }

    return {
      ...group,
      sequence: index + 1,
      status,
    }
  })
}

export const applyGroupOrderToTasks = (
  plan: BattlePlan,
  groups: BattlePlanTaskGroup[],
): BattlePlanTask[] => {
  const tasks = [...plan.tasks]
  const orderByGroupId = new Map(groups.map((group, index) => [group.id, index]))

  const sorted = tasks.sort((left, right) => {
    const leftGroup = parseGroupMeta(left.notes).groupId ?? `${plan.id}-${stepToGroupType(left.productionStep)}`
    const rightGroup = parseGroupMeta(right.notes).groupId ?? `${plan.id}-${stepToGroupType(right.productionStep)}`

    const leftRank = orderByGroupId.get(leftGroup) ?? Number.MAX_SAFE_INTEGER
    const rightRank = orderByGroupId.get(rightGroup) ?? Number.MAX_SAFE_INTEGER

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    return left.sortOrder - right.sortOrder
  })

  return sorted.map((task, index) => ({ ...task, sortOrder: index + 1 }))
}

export const buildReviewTaskText = (employee: Employee): string =>
  `Review ${employee.name}'s daily Battle Plan`

export const summarizeIncompleteItems = (groups: BattlePlanTaskGroup[]): string[] =>
  groups.flatMap((group) =>
    group.workItems
      .filter((item) => !item.completed)
      .map((item) => `${group.sequence}. ${item.workItemNumber} - ${item.artworkTitle}`),
  )

export const createDefaultEndOfDayReport = (): BattlePlanEndOfDayReport => ({
  notes: '',
  incompleteReason: '',
  carryForward: false,
  reportSent: false,
  departureTime: '',
})
