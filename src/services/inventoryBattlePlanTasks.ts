import type { BattlePlan, BattlePlanTask } from '../types/battlePlans'

interface RecurringTaskTemplate {
  code: string
  description: string
  daySelector: (date: Date) => boolean
  productionStep: BattlePlanTask['productionStep']
}

const recurringTemplates: RecurringTaskTemplate[] = [
  {
    code: 'THU_CONDUCT_WAREHOUSE_INVENTORY',
    description: 'Conduct Warehouse Inventory',
    daySelector: (date) => date.getDay() === 4,
    productionStep: 'FILES',
  },
  {
    code: 'THU_REVIEW_DISCREPANCIES',
    description: 'Review count discrepancies',
    daySelector: (date) => date.getDay() === 4,
    productionStep: 'FILES',
  },
  {
    code: 'THU_SUBMIT_INVENTORY_REVIEW',
    description: 'Submit inventory for review',
    daySelector: (date) => date.getDay() === 4,
    productionStep: 'FILES',
  },
  {
    code: 'FRI_REVIEW_LOW_STOCK',
    description: 'Review low-stock items',
    daySelector: (date) => date.getDay() === 5,
    productionStep: 'FILES',
  },
  {
    code: 'FRI_PREPARE_POS_CSWS',
    description: 'Prepare POs and CSWs',
    daySelector: (date) => date.getDay() === 5,
    productionStep: 'FILES',
  },
  {
    code: 'FRI_SUBMIT_PURCHASE_RECOMMENDATIONS',
    description: 'Submit purchase recommendations',
    daySelector: (date) => date.getDay() === 5,
    productionStep: 'FILES',
  },
  {
    code: 'MONTHLY_MOULDING_COUNT',
    description: 'Conduct Moulding Inventory',
    daySelector: (date) => date.getDate() <= 7,
    productionStep: 'FILES',
  },
  {
    code: 'MONTHLY_MOULDING_REPORT',
    description: 'Send moulding report to Production Manager',
    daySelector: (date) => date.getDate() <= 7,
    productionStep: 'FILES',
  },
]

const taskExists = (plan: BattlePlan, description: string): boolean =>
  plan.tasks.some((task) => task.description.toLowerCase() === description.toLowerCase())

const createRecurringTask = (
  template: RecurringTaskTemplate,
  sortOrder: number,
): BattlePlanTask => ({
  id: `BPT-INVENTORY-${template.code}`,
  productionJobId: 'INVENTORY-RECURRING',
  productionStep: template.productionStep,
  description: template.description,
  estimatedMinutes: 30,
  completed: false,
  sortOrder,
  notes: 'Recurring inventory governance task from Production Director workflow.',
  carryForward: false,
  locked: false,
  directorSection: 'REVIEW',
})

export const ensureRecurringInventoryBattlePlanTasks = (plans: BattlePlan[]): BattlePlan[] => {
  return plans.map((plan) => {
    const planDate = new Date(`${plan.date}T00:00:00`)
    if (Number.isNaN(planDate.getTime())) {
      return plan
    }

    const matchingTemplates = recurringTemplates.filter((template) => template.daySelector(planDate))
    if (matchingTemplates.length === 0) {
      return plan
    }

    const nextTasks = [...plan.tasks]
    for (const template of matchingTemplates) {
      if (taskExists(plan, template.description)) {
        continue
      }
      nextTasks.push(createRecurringTask(template, nextTasks.length + 1))
    }

    if (nextTasks.length === plan.tasks.length) {
      return plan
    }

    return {
      ...plan,
      tasks: nextTasks,
    }
  })
}
