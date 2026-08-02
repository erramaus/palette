import type { BattlePlan } from '../types/battlePlans'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type { MaterialReadinessStatus } from '../types/battlePlanOptimization'

interface MaterialForecastInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
}

const inferInventorySignals = (job: ProductionJob): string[] => {
  const notes = job.notes.toLowerCase()
  const signals: string[] = []

  if (notes.includes('crate')) {
    signals.push('crate_material_required')
  }
  if (notes.includes('dibond')) {
    signals.push('dibond_material_required')
  }
  if (notes.includes('frame')) {
    signals.push('frame_material_required')
  }
  if (notes.includes('approval')) {
    signals.push('approval_dependency')
  }
  if (notes.includes('material') || notes.includes('supply')) {
    signals.push('material_dependency')
  }

  return signals
}

export class MaterialForecastService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]

  constructor(input: MaterialForecastInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
  }

  getMaterialStatus(workItemId: string, operation: ProductionStepName): MaterialReadinessStatus {
    const job = this.productionJobs.find((item) => item.id === workItemId)

    if (!job) {
      return {
        workItemId,
        operation,
        status: 'UNKNOWN',
        reason: 'Work item is not mapped to production material records.',
        inventorySignals: ['missing_workitem_mapping'],
      }
    }

    const signals = inferInventorySignals(job)

    if (job.onHold) {
      return {
        workItemId,
        operation,
        status: 'UNAVAILABLE',
        reason: 'Work item is on hold.',
        inventorySignals: [...signals, 'on_hold'],
      }
    }

    if (signals.includes('material_dependency') && !signals.includes('approval_dependency')) {
      return {
        workItemId,
        operation,
        status: 'LIMITED',
        reason: 'Material dependency noted in production notes.',
        inventorySignals: signals,
      }
    }

    if (signals.includes('approval_dependency')) {
      return {
        workItemId,
        operation,
        status: 'LIMITED',
        reason: 'Approval dependency may delay material release.',
        inventorySignals: signals,
      }
    }

    const planMentions = this.battlePlans
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.productionJobId === workItemId)
      .map((task) => task.notes.toLowerCase())

    const hasSupplyRisk = planMentions.some((note) =>
      note.includes('material') || note.includes('supply') || note.includes('waiting'),
    )

    if (hasSupplyRisk) {
      return {
        workItemId,
        operation,
        status: 'LIMITED',
        reason: 'Battle plan notes include material/supply waiting signals.',
        inventorySignals: [...signals, 'battle_plan_supply_risk'],
      }
    }

    return {
      workItemId,
      operation,
      status: signals.length > 0 ? 'AVAILABLE' : 'UNKNOWN',
      reason:
        signals.length > 0
          ? 'Material signals indicate expected readiness for this operation.'
          : 'No explicit inventory indicators found.',
      inventorySignals: signals,
    }
  }
}
