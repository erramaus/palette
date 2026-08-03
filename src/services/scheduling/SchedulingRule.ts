import type { SchedulingOperation } from './SchedulingService'

export interface SchedulingRule {
  id: string
  description: string
  order: number
  compare(left: SchedulingOperation, right: SchedulingOperation): number
}