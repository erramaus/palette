import type { MeasurementConfidence, MeasurementRuleSource } from '../config/production/measurementRuleTypes'
import type { ProductType } from './production'

export type ProductionCutCalculationStatus = 'CONFIRMED' | 'NEEDS_REVIEW'
export type ProductionCutKind = 'FRAME' | 'BASE' | 'STRETCHER' | 'DIBOND'
export type ProductionCutMemberKind = 'LONG' | 'SHORT'

export interface ProductionCutMember {
  id: string
  kind: ProductionCutMemberKind
  cutLengthInches: number
  quantity: 1
}

export type StrainerMemberType = 'CENTER' | 'ADDITIONAL_LENGTHWISE' | 'CORNER'
export type StrainerOrientation = 'HORIZONTAL' | 'VERTICAL' | 'CORNER'

export interface ProductionStrainerMember {
  id: string
  type: StrainerMemberType
  cutLengthInches: number | null
  quantity: number
  placement: 'CENTERED' | 'EVENLY_SPACED_EACH_SIDE' | 'CORNERS'
  orientation: StrainerOrientation
  materialDimensions: {
    widthInches: number
    thicknessInches: number
  }
  formula: string
  ruleId: string
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
  strainerMembers?: ProductionStrainerMember[]
  addedStandardMinutes?: number
  cutDimensions?: { width: number; height: number }
  workstation?: string
  trace: CalculationTrace
}