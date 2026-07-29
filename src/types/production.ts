export const PRODUCTION_STEP_NAMES = [
  'FILES',
  'PRINTED',
  'DIBOND',
  'STRETCHER_BASE',
  'MOUNTED',
  'FRAME_MADE',
  'FRAMED',
  'SHIPPED',
] as const

export type ProductionStepName = (typeof PRODUCTION_STEP_NAMES)[number]

export type ProductionStepStatus = 'WAITING' | 'COMPLETE' | 'NOT_APPLICABLE'

export type DueStatus =
  | 'ON_TRACK'
  | 'DUE_SOON'
  | 'DUE_TODAY'
  | 'AT_RISK'
  | 'OVERDUE'
  | 'ON_HOLD'

export type Priority = 'ORIGINALS' | 'CUSTOMER_PURCHASED' | 'GALLERY_INVENTORY'

export type ProductType =
  | 'ORIGINAL'
  | 'TEXTURED_REPLICA_3D'
  | 'CANVAS'
  | 'GALLERY_INVENTORY'

export type ProductionStepsRecord = Record<ProductionStepName, ProductionStepStatus>
export type ProductionEstimatedMinutes = Record<ProductionStepName, number>

export interface ProductionJob {
  id: string
  orderNumber: string
  customerName: string
  artworkTitle: string
  productType: ProductType
  width: number
  height: number
  frameInfo: string
  dueDate: string
  dueStatus: DueStatus
  priority: Priority
  assignedWorkerId: string
  notes: string
  onHold?: boolean
  steps: ProductionStepsRecord
  estimatedMinutes: ProductionEstimatedMinutes
}
