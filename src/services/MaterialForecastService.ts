import type { BattlePlan } from '../types/battlePlans'
import type { ProductionJob, ProductionStepName } from '../types/production'
import type { MaterialReadinessStatus } from '../types/battlePlanOptimization'
import type { CalculationTrace, ProductionCutCalculationStatus, ProductionCutKind, ProductionCutMember } from '../types/productionCut'
import type { InventoryItem as WorkbookInventoryItem } from '../types/inventory'
import { BaseCalculationService } from './BaseCalculationService'
import { FrameCalculationService } from './FrameCalculationService'
import { StretcherCalculationService } from './StretcherCalculationService'

interface MaterialForecastInput {
  productionJobs: ProductionJob[]
  battlePlans: BattlePlan[]
  inventoryBalances?: Partial<Record<MaterialDemand['kind'], {
    reservedLinearInches: number
    availableLinearInches: number
  }>>
}

export interface MaterialDemand {
  workItemId: string
  kind: ProductionCutKind
  status: ProductionCutCalculationStatus
  materialIdentifier: string | null
  members: ProductionCutMember[]
  totalLinearInches: number | null
  trace: CalculationTrace
}

export interface AggregatedMaterialDemand {
  kind: ProductionCutKind
  grossLinearInches: number
  reservedLinearInches: number
  availableLinearInches: number
  shortageLinearInches: number
  confirmedStrainerUnits: number
  workItemIds: string[]
}

type InventoryCoverageStatus = 'AVAILABLE' | 'LIMITED' | 'NEEDS_REVIEW'

export const buildMaterialInventoryBalancesFromWorkbookItems = (
  inventoryItems: WorkbookInventoryItem[],
): Partial<Record<MaterialDemand['kind'], {
  reservedLinearInches: number
  availableLinearInches: number
}>> => {
  const balances: Partial<Record<MaterialDemand['kind'], {
    reservedLinearInches: number
    availableLinearInches: number
  }>> = {}

  const add = (kind: MaterialDemand['kind'], reserved: number, available: number): void => {
    const current = balances[kind] ?? { reservedLinearInches: 0, availableLinearInches: 0 }
    balances[kind] = {
      reservedLinearInches: current.reservedLinearInches + reserved,
      availableLinearInches: current.availableLinearInches + available,
    }
  }

  for (const item of inventoryItems) {
    if (!item.active) continue

    const searchText = `${item.categoryName} ${item.name} ${item.description ?? ''}`.toLowerCase()
    const reserved = Math.max(0, item.quantityReserved)
    const available = Math.max(0, item.quantityAvailable)

    // Workbook-grounded mapping only: explicit stretcher/strainer rows, moulding references, and dibond references.
    if (searchText.includes('stretcher') || searchText.includes('strainer')) {
      add('STRETCHER', reserved, available)
      continue
    }
    if (searchText.includes('mould')) {
      add('FRAME', reserved, available)
      continue
    }
    if (searchText.includes('dibond')) {
      add('DIBOND', reserved, available)
      continue
    }
  }

  return balances
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

const formatLinearInches = (value: number): string => Number(value.toFixed(2)).toString()

export class MaterialForecastService {
  private readonly productionJobs: ProductionJob[]
  private readonly battlePlans: BattlePlan[]
  private readonly inventoryBalances: MaterialForecastInput['inventoryBalances']
  private readonly frameCalculationService = new FrameCalculationService()
  private readonly baseCalculationService = new BaseCalculationService()
  private readonly stretcherCalculationService = new StretcherCalculationService()

  constructor(input: MaterialForecastInput) {
    this.productionJobs = input.productionJobs
    this.battlePlans = input.battlePlans
    this.inventoryBalances = input.inventoryBalances
  }

  private evaluateInventoryCoverage(demands: MaterialDemand[]): {
    status: InventoryCoverageStatus
    reason: string | null
    signals: string[]
  } {
    let status: InventoryCoverageStatus = 'AVAILABLE'
    const reasons: string[] = []
    const signals: string[] = []

    for (const demand of demands) {
      if (demand.status === 'NEEDS_REVIEW' || demand.totalLinearInches === null) {
        status = 'NEEDS_REVIEW'
        reasons.push(`${demand.kind} demand requires review before workbook inventory can be matched confidently.`)
        signals.push(`${demand.kind.toLowerCase()}_inventory_match_needs_review`)
        continue
      }

      const balance = this.inventoryBalances?.[demand.kind]
      if (!balance) {
        status = 'NEEDS_REVIEW'
        reasons.push(`${demand.kind} inventory mapping is not confirmed in persisted workbook balances.`)
        signals.push(`${demand.kind.toLowerCase()}_inventory_match_needs_review`)
        continue
      }

      if (balance.availableLinearInches < demand.totalLinearInches) {
        if (status !== 'NEEDS_REVIEW') {
          status = 'LIMITED'
        }
        const shortage = demand.totalLinearInches - balance.availableLinearInches
        reasons.push(`${demand.kind} shortage of ${formatLinearInches(shortage)} linear inches against persisted workbook balances.`)
        signals.push(`${demand.kind.toLowerCase()}_inventory_shortage:${formatLinearInches(shortage)}`)
        continue
      }

      signals.push(`${demand.kind.toLowerCase()}_inventory_confirmed:${formatLinearInches(balance.availableLinearInches)}`)
    }

    return {
      status,
      reason: reasons.length > 0 ? reasons.join(' ') : null,
      signals,
    }
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
    const demands = this.getMaterialDemand(workItemId)
    const inventoryCoverage = this.evaluateInventoryCoverage(demands)
    const signals = [
      ...inferInventorySignals(job),
      ...demands.map((demand) => demand.status === 'CONFIRMED'
        ? `${demand.kind.toLowerCase()}_linear_inches:${demand.totalLinearInches}`
        : `${demand.kind.toLowerCase()}_cut_needs_review`),
      ...inventoryCoverage.signals,
    ]

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
        status: inventoryCoverage.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'LIMITED',
        reason: inventoryCoverage.reason ?? 'Material dependency noted in production notes.',
        inventorySignals: signals,
      }
    }

    if (signals.includes('approval_dependency')) {
      return {
        workItemId,
        operation,
        status: inventoryCoverage.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'LIMITED',
        reason: inventoryCoverage.reason ?? 'Approval dependency may delay material release.',
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
        status: inventoryCoverage.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'LIMITED',
        reason: inventoryCoverage.reason ?? 'Battle plan notes include material/supply waiting signals.',
        inventorySignals: [...signals, 'battle_plan_supply_risk'],
      }
    }

    if (inventoryCoverage.reason) {
      return {
        workItemId,
        operation,
        status: inventoryCoverage.status,
        reason: inventoryCoverage.reason,
        inventorySignals: signals,
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

  getMaterialDemand(workItemId: string): MaterialDemand[] {
    const job = this.productionJobs.find((item) => item.id === workItemId)
    if (!job) return []

    const calculations = []
    if (job.frameInfo.trim()) {
      calculations.push(this.frameCalculationService.calculate({
        productType: job.productType,
        width: job.width,
        height: job.height,
        importedFrameName: job.frameInfo,
      }))
    }
    if (job.productType === 'THREE_D_PRINT' || job.productType === 'TEXTURED_REPLICA_3D') {
      calculations.push(this.baseCalculationService.calculate({
        productType: job.productType,
        width: job.width,
        height: job.height,
        importedFrameName: job.frameInfo,
      }))
    }
    if (job.productType === 'CANVAS' || job.productType === 'ORIGINAL') {
      calculations.push(this.stretcherCalculationService.calculate({
        productType: job.productType,
        width: job.width,
        height: job.height,
      }))
    }

    return calculations.map((calculation) => ({
      workItemId,
      kind: calculation.kind,
      status: calculation.status,
      materialIdentifier: calculation.mouldingIdentifier ?? calculation.normalizedFrame ?? calculation.frameFamily,
      members: calculation.members,
      totalLinearInches: calculation.status === 'CONFIRMED'
        ? calculation.members.reduce((sum, member) => sum + member.cutLengthInches, 0)
        : null,
      trace: calculation.trace,
    }))
  }

  getAggregatedMaterialDemand(): AggregatedMaterialDemand[] {
    const confirmed = this.productionJobs
      .flatMap((job) => this.getMaterialDemand(job.id))
      .filter((demand) => demand.status === 'CONFIRMED' && demand.totalLinearInches !== null)

    return (['FRAME', 'BASE', 'STRETCHER'] as const).map((kind) => {
      const demands = confirmed.filter((demand) => demand.kind === kind)
      const grossLinearInches = demands.reduce((sum, demand) => sum + demand.totalLinearInches!, 0)
      const balance = this.inventoryBalances?.[kind]
      const reservedLinearInches = balance?.reservedLinearInches ?? 0
      const availableLinearInches = balance?.availableLinearInches ?? 0
      const confirmedStrainerUnits = kind === 'STRETCHER'
        ? demands.filter((demand) => demand.trace.calculatedOutputs.centerStrainerRequired === true).length
        : 0

      return {
        kind,
        grossLinearInches,
        reservedLinearInches,
        availableLinearInches,
        shortageLinearInches: Math.max(0, grossLinearInches - availableLinearInches),
        confirmedStrainerUnits,
        workItemIds: [...new Set(demands.map((demand) => demand.workItemId))],
      }
    })
  }
}
