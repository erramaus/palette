import type { ProductionStepName, ProductionStepStatus } from '../types/production'

export const PRODUCTION_STEP_SEQUENCE: ProductionStepName[] = [
  'FILES',
  'PRINTED',
  'DIBOND',
  'STRETCHER_BASE',
  'MOUNTED',
  'FRAME_MADE',
  'FRAMED',
  'SHIPPED',
]

export const PRODUCTION_STEP_LABELS: Record<ProductionStepName, string> = {
  FILES: 'FILES',
  PRINTED: 'PRINTED',
  DIBOND: 'DIBOND',
  STRETCHER_BASE: 'STRETCHER/BASE',
  MOUNTED: 'MOUNTED',
  FRAME_MADE: 'FRAME MADE',
  FRAMED: 'FRAMED',
  SHIPPED: 'SHIPPED',
}

export const cycleStepStatus = (
  currentStatus: ProductionStepStatus,
): ProductionStepStatus => {
  if (currentStatus === 'WAITING') {
    return 'COMPLETE'
  }
  if (currentStatus === 'COMPLETE') {
    return 'NOT_APPLICABLE'
  }
  return 'WAITING'
}
