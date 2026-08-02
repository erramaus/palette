import type { BattlePlan } from '../../types/battlePlans'
import type { Employee } from '../../types/employees'
import type { ProductionJob, ProductionStepName } from '../../types/production'
import { PRODUCTION_STEP_NAMES } from '../../types/production'
import { PRODUCTION_STEP_LABELS } from '../../utils/productionSteps'

export type ProductionHealthStatus = 'Excellent' | 'Good' | 'Warning' | 'Critical'
export type CapacityStatus = 'Available' | 'Balanced' | 'Busy' | 'Overloaded'
export type RecommendationPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type DueDateRiskStatus = 'Overdue' | 'Due Today' | 'Due Soon'

export interface IntelligenceConfig {
  overdueDeduction: number
  atRiskDeduction: number
  overCapacityDeduction: number
  blockedWorkflowDeduction: number
  dueDateWarningDays: number
  availableUtilizationPercentage: number
  busyUtilizationPercentage: number
  overloadedUtilizationPercentage: number
}

export interface ProductionHealth {
  score: number
  status: ProductionHealthStatus
  color: string
  explanation: string
}

export interface BottleneckResult {
  stage: ProductionStepName
  stageLabel: string
  queueLength: number
  oldestItem?: {
    id: string
    orderNumber: string
    dueDate: string
  }
  blockedItems: number
  estimatedWorkloadMinutes: number
}

export interface DueDateRisk {
  workItemId: string
  orderNumber: string
  dueDate: string
  status: DueDateRiskStatus
  daysUntilDue: number
}

export interface EmployeeCapacityForecast {
  employeeId: string
  employeeName: string
  availableMinutes: number
  assignedWork: number
  estimatedRemainingWork: number
  utilization: number
  status: CapacityStatus
}

export interface DirectorRecommendation {
  id: string
  title: string
  description: string
  priority: RecommendationPriority
  supportingReason: string
}

export interface IntelligenceServiceInput {
  productionJobs: ProductionJob[]
  employees: Employee[]
  battlePlans: BattlePlan[]
  now?: Date
  config?: Partial<IntelligenceConfig>
}

const DEFAULT_CONFIG: IntelligenceConfig = {
  overdueDeduction: 10,
  atRiskDeduction: 5,
  overCapacityDeduction: 3,
  blockedWorkflowDeduction: 2,
  dueDateWarningDays: 3,
  availableUtilizationPercentage: 50,
  busyUtilizationPercentage: 85,
  overloadedUtilizationPercentage: 100,
}

const PRIORITY_RANK: Record<RecommendationPriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const startOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

const diffInDays = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)

export class IntelligenceService {
  private readonly productionJobs: ProductionJob[]
  private readonly employees: Employee[]
  private readonly battlePlans: BattlePlan[]
  private readonly now: Date
  private readonly today: string
  private readonly config: IntelligenceConfig

  constructor(input: IntelligenceServiceInput) {
    this.productionJobs = input.productionJobs
    this.employees = input.employees
    this.battlePlans = input.battlePlans
    this.now = input.now ?? new Date()
    this.today = toLocalIsoDate(this.now)
    this.config = { ...DEFAULT_CONFIG, ...input.config }
  }

  getProductionHealth(): ProductionHealth {
    const activeJobs = this.getActiveJobs()
    const overdueCount = activeJobs.filter((job) => job.dueStatus === 'OVERDUE').length
    const atRiskCount = activeJobs.filter((job) => job.dueStatus === 'AT_RISK').length
    const overCapacityCount = this.getCapacityForecast().filter(
      (forecast) => forecast.status === 'Overloaded',
    ).length
    const blockedCount = activeJobs.filter((job) => this.isBlocked(job)).length

    const deduction =
      overdueCount * this.config.overdueDeduction +
      atRiskCount * this.config.atRiskDeduction +
      overCapacityCount * this.config.overCapacityDeduction +
      blockedCount * this.config.blockedWorkflowDeduction
    const score = Math.max(0, Math.min(100, 100 - deduction))
    const status = this.getHealthStatus(score)

    return {
      score,
      status,
      color: this.getHealthColor(status),
      explanation:
        deduction === 0
          ? 'No overdue, at-risk, over-capacity, or blocked production work detected.'
          : `${overdueCount} overdue, ${atRiskCount} at risk, ${overCapacityCount} over capacity, and ${blockedCount} blocked.`,
    }
  }

  getCurrentBottlenecks(): BottleneckResult | null {
    const activeJobs = this.getActiveJobs()
    const stages = PRODUCTION_STEP_NAMES.map((stage) => {
      const jobs = activeJobs.filter((job) => this.getCurrentStage(job) === stage)
      const sortedByDueDate = [...jobs].sort(
        (left, right) => parseLocalDate(left.dueDate).getTime() - parseLocalDate(right.dueDate).getTime(),
      )

      return {
        stage,
        stageLabel: PRODUCTION_STEP_LABELS[stage],
        queueLength: jobs.length,
        oldestItem: sortedByDueDate[0]
          ? {
              id: sortedByDueDate[0].id,
              orderNumber: sortedByDueDate[0].orderNumber,
              dueDate: sortedByDueDate[0].dueDate,
            }
          : undefined,
        blockedItems: jobs.filter((job) => this.isBlocked(job)).length,
        estimatedWorkloadMinutes: jobs.reduce(
          (sum, job) => sum + job.estimatedMinutes[stage],
          0,
        ),
      }
    }).filter((stage) => stage.queueLength > 0)

    return stages.sort((left, right) => {
      if (right.blockedItems !== left.blockedItems) {
        return right.blockedItems - left.blockedItems
      }
      if (right.estimatedWorkloadMinutes !== left.estimatedWorkloadMinutes) {
        return right.estimatedWorkloadMinutes - left.estimatedWorkloadMinutes
      }
      return right.queueLength - left.queueLength
    })[0] ?? null
  }

  getDueDateRisks(): DueDateRisk[] {
    return this.getActiveJobs()
      .map((job) => {
        const daysUntilDue = diffInDays(this.now, parseLocalDate(job.dueDate))
        let status: DueDateRiskStatus | null = null

        if (daysUntilDue < 0 || job.dueStatus === 'OVERDUE') {
          status = 'Overdue'
        } else if (daysUntilDue === 0 || job.dueStatus === 'DUE_TODAY') {
          status = 'Due Today'
        } else if (daysUntilDue <= this.config.dueDateWarningDays) {
          status = 'Due Soon'
        }

        return status
          ? {
              workItemId: job.id,
              orderNumber: job.orderNumber,
              dueDate: job.dueDate,
              status,
              daysUntilDue,
            }
          : null
      })
      .filter((risk): risk is DueDateRisk => risk !== null)
      .sort((left, right) => {
        if (left.daysUntilDue !== right.daysUntilDue) {
          return left.daysUntilDue - right.daysUntilDue
        }
        return left.orderNumber.localeCompare(right.orderNumber)
      })
  }

  getCapacityForecast(): EmployeeCapacityForecast[] {
    const todayPlans = new Map(
      this.battlePlans
        .filter((plan) => plan.date === this.today)
        .map((plan) => [plan.assignedWorkerId, plan]),
    )

    return this.employees
      .filter((employee) => employee.active && employee.role === 'WORKER')
      .map((employee) => {
        const plan = todayPlans.get(employee.id)
        const tasks = plan?.tasks ?? []
        const assignedWork = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
        const estimatedRemainingWork = tasks
          .filter((task) => !task.completed)
          .reduce((sum, task) => sum + task.estimatedMinutes, 0)
        const availableMinutes = plan?.availableMinutes ?? employee.defaultAvailableMinutes
        const utilization = availableMinutes > 0
          ? Math.round((assignedWork / availableMinutes) * 100)
          : assignedWork > 0
            ? 100
            : 0

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          availableMinutes,
          assignedWork,
          estimatedRemainingWork,
          utilization,
          status: this.getCapacityStatus(utilization),
        }
      })
      .sort((left, right) => right.utilization - left.utilization)
  }

  getDirectorRecommendations(): DirectorRecommendation[] {
    const activeJobs = this.getActiveJobs()
    const overdueJobs = activeJobs.filter((job) => job.dueStatus === 'OVERDUE')
    const bottleneck = this.getCurrentBottlenecks()
    const overloadedEmployees = this.getCapacityForecast().filter(
      (employee) => employee.status === 'Overloaded',
    )
    const recommendations: DirectorRecommendation[] = []

    if (overdueJobs.length > 0) {
      recommendations.push({
        id: 'finish-overdue-work',
        title: 'Finish overdue work before new production',
        description: 'Prioritize overdue jobs before releasing additional production work.',
        priority: 'Critical',
        supportingReason: `${overdueJobs.length} active job(s) are overdue.`,
      })
    }

    if (bottleneck?.stage === 'DIBOND' && bottleneck.estimatedWorkloadMinutes > 0) {
      recommendations.push({
        id: 'support-dibond',
        title: 'Move additional labor to Dibond',
        description: 'Assign qualified available capacity to reduce the Dibond queue.',
        priority: bottleneck.blockedItems > 0 ? 'High' : 'Medium',
        supportingReason: `Dibond has ${bottleneck.queueLength} queued item(s) and ${bottleneck.estimatedWorkloadMinutes} estimated minutes.`,
      })
    }

    if (overloadedEmployees.length > 0) {
      recommendations.push({
        id: 'redistribute-battle-plan',
        title: "Redistribute today's Battle Plan",
        description: 'Move eligible tasks from overloaded employees to available employees.',
        priority: 'High',
        supportingReason: `${overloadedEmployees.length} employee(s) exceed configured capacity.`,
      })
    }

    if (!this.battlePlans.some((plan) => plan.date === this.today)) {
      recommendations.push({
        id: 'generate-battle-plans',
        title: "Generate today's Battle Plans",
        description: 'Create today’s plans before assigning or starting production work.',
        priority: 'High',
        supportingReason: 'No Battle Plans exist for today.',
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'maintain-production-plan',
        title: 'Maintain the current production plan',
        description: 'Continue the current sequence and monitor due-date and capacity changes.',
        priority: 'Low',
        supportingReason: 'No immediate rule-based intervention is required.',
      })
    }

    return recommendations.sort((left, right) => {
      const priorityDelta = PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority]
      return priorityDelta || left.title.localeCompare(right.title)
    })
  }

  private getActiveJobs(): ProductionJob[] {
    return this.productionJobs.filter((job) => job.steps.SHIPPED !== 'COMPLETE')
  }

  private getCurrentStage(job: ProductionJob): ProductionStepName | undefined {
    return PRODUCTION_STEP_NAMES.find((stage) => job.steps[stage] === 'WAITING')
  }

  private isBlocked(job: ProductionJob): boolean {
    return Boolean(job.onHold) || /blocked|waiting on|pending/i.test(job.notes)
  }

  private getCapacityStatus(utilization: number): CapacityStatus {
    if (utilization > this.config.overloadedUtilizationPercentage) {
      return 'Overloaded'
    }
    if (utilization >= this.config.busyUtilizationPercentage) {
      return 'Busy'
    }
    if (utilization >= this.config.availableUtilizationPercentage) {
      return 'Balanced'
    }
    return 'Available'
  }

  private getHealthStatus(score: number): ProductionHealthStatus {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 50) return 'Warning'
    return 'Critical'
  }

  private getHealthColor(status: ProductionHealthStatus): string {
    if (status === 'Excellent') return '#237a4b'
    if (status === 'Good') return '#3c6f91'
    if (status === 'Warning') return '#a86612'
    return '#b33a3a'
  }
}