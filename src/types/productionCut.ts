import type { MeasurementConfidence, MeasurementRuleSource } from '../config/production/measurementRuleTypes'
import type { ProductType } from './production'

export type ProductionCutCalculationStatus = 'CONFIRMED' | 'NEEDS_REVIEW'
export type ProductionCutKind = 'FRAME' | 'BASE' | 'STRETCHER'
export type ProductionCutMemberKind = 'LONG' | 'SHORT'

export interface ProductionCutMember {
  id: string
  kind: ProductionCutMemberKind
  cutLengthInches: number
  quantity: 1
}

export interface ProductionCutInputs {
  productType: ProductType
  width?: number
  height?: number
  importedFrameName?: string
  mouldingIdentifier?: string
}

export interface CalculationTrace {
  ruleId: string | null
  ruleIds: readonly string[]
  sources: readonly MeasurementRuleSource[]
  originalInputs: ProductionCutInputs
  normalizedInputs: Record<string, string | number | boolean | null>
  calculatedOutputs: Record<string, string | number | boolean | null>
  confidence: MeasurementConfidence
  explanation: string
}

export interface ProductionCutCalculationResult {
  kind: ProductionCutKind
  status: ProductionCutCalculationStatus
  canGenerateFinalSawTag: boolean
  members: ProductionCutMember[]
  normalizedFrame: string | null
  frameFamily: string | null
  mouldingIdentifier: string | null
  baseHeightInches: number | null
  centerStrainerRequired: boolean | null
  cornerStrainerRequired: boolean | null
  oppositeAdditionalStrainerRequired: boolean | null
  trace: CalculationTrace
}