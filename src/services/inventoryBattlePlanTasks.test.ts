import { describe, expect, it } from 'vitest'
import type { BattlePlan } from '../types/battlePlans'
import { ensureRecurringInventoryBattlePlanTasks } from './inventoryBattlePlanTasks'

const makePlan = (date: string): BattlePlan => ({
  id: `BP-${date}`,
  date,
  assignedWorkerId: 'EMP-001',
  createdById: 'EMP-001',
  approvedById: 'EMP-001',
  availableMinutes: 480,
  generationType: 'MANUAL',
  status: 'DRAFT',
  endOfDayNotes: '',
  tasks: [],
})

describe('inventoryBattlePlanTasks', () => {
  it('adds recurring Thursday and Friday inventory tasks', () => {
    const thursday = makePlan('2026-08-06')
    const friday = makePlan('2026-08-07')

    const updated = ensureRecurringInventoryBattlePlanTasks([thursday, friday])

    expect(updated[0].tasks.some((task) => task.description === 'Conduct Warehouse Inventory')).toBe(true)
    expect(updated[0].tasks.some((task) => task.description === 'Submit inventory for review')).toBe(true)
    expect(updated[1].tasks.some((task) => task.description === 'Prepare POs and CSWs')).toBe(true)
    expect(updated[1].tasks.some((task) => task.description === 'Submit purchase recommendations')).toBe(true)
  })

  it('adds monthly moulding tasks and avoids duplicates on repeated passes', () => {
    const monthly = makePlan('2026-08-03')

    const first = ensureRecurringInventoryBattlePlanTasks([monthly])
    const second = ensureRecurringInventoryBattlePlanTasks(first)

    const mouldingCount = second[0].tasks.filter((task) => task.description === 'Conduct Moulding Inventory').length
    const reportCount = second[0].tasks.filter((task) => task.description === 'Send moulding report to Production Manager').length

    expect(mouldingCount).toBe(1)
    expect(reportCount).toBe(1)
  })
})
