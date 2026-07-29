import type { BattlePlanTask } from '../types/battlePlans'

export const calculatePlannedMinutes = (tasks: BattlePlanTask[]): number =>
  tasks.reduce((total, task) => total + task.estimatedMinutes, 0)

export const calculateCompletedMinutes = (tasks: BattlePlanTask[]): number =>
  tasks
    .filter((task) => task.completed)
    .reduce((total, task) => total + task.estimatedMinutes, 0)

export const calculateRemainingMinutes = (
  availableMinutes: number,
  tasks: BattlePlanTask[],
): number => availableMinutes - calculatePlannedMinutes(tasks)
