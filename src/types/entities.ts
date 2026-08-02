export type EntityId = string
export type IsoDateTime = string

export interface AuditedEntity {
  id: EntityId
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface Address {
  line1: string
  line2?: string
  city: string
  stateOrRegion: string
  postalCode: string
  country: string
}

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'IN_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'

export type WorkItemStatus =
  | 'QUEUED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETE'
  | 'CANCELLED'

export type WorkItemType = string

export type ProductionTagType =
  | 'PAPER'
  | 'CANVAS'
  | 'THREE_D_PRINT'
  | 'FRAME'
  | 'STRETCHER'
  | 'THREE_D_BASE'

export type PackagingMethodCode =
  | 'STANDARD_BOX'
  | 'CNC'
  | 'CRATE'
  | 'GALLERY'
  | 'PICKUP'
  | 'DELIVERY'

export interface DecimalDimensions {
  width: number
  height: number
  depth?: number
}

export interface ProductionMeasurementRule extends AuditedEntity {
  ruleType: 'FRAME_INCREASE' | 'BASE_ADJUSTMENT' | 'PACKAGING_OVERRIDE'
  targetKey: string
  adjustment: number
  unit: 'INCHES'
  active: boolean
  notes?: string
}

export interface FrameStyle extends AuditedEntity {
  name: string
  normalizedKey: string
  increaseInches: number
  appliesToPaperAsPicture: boolean
}

export interface BaseStyle extends AuditedEntity {
  name: string
  normalizedKey: string
  adjustmentInches: number
}

export interface PackagingMethod extends AuditedEntity {
  code: PackagingMethodCode
  label: string
  requiresShippingBoxLookup: boolean
  usesCalculatedDimensions: boolean
}

export interface ShippingBox extends AuditedEntity {
  code: string
  description: string
  dimensionsDisplay: string
  faceCutDisplay?: string
  variableLengthRange?: string
}

export interface TagCheckpoint {
  key: 'SCAN' | 'IA' | 'PRINTED' | 'RESLICED'
  label: string
  value: string
}

export interface ProductionTag extends AuditedEntity {
  workItemId: EntityId
  workItemNumber: string
  tagType: ProductionTagType
  customerDisplayName: string
  artworkName: string
  productName: string
  runOrEditionLabel?: 'Run' | 'Edition'
  runOrEditionValue?: string
  frameStyleName?: string
  baseStyleName?: string
  packagingMethod: PackagingMethodCode
  shippingBoxCode?: string
  frameDimensions?: DecimalDimensions
  baseDimensions?: DecimalDimensions
  stretcherDimensions?: DecimalDimensions
  packageDimensionsDisplay?: string
  checkpoints: TagCheckpoint[]
  notes: string[]
  pairKey?: string
  generatedAt: IsoDateTime
  generatedByEmployeeId?: EntityId
}

export type BattlePlanStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface BattlePlanItem {
  workItemId: EntityId
  sequence: number
  assignedEmployee?: EntityId
  assignedDepartment?: EntityId
  estimatedMinutes: number
  currentWorkflowStage: string
  dueDate?: IsoDateTime
  priority: number
  notes: string[]
}

export interface BattlePlan extends AuditedEntity {
  date: string
  department?: EntityId
  createdBy?: EntityId
  notes: string
  status: BattlePlanStatus
  items: BattlePlanItem[]
}

export interface BattlePlanTemplate extends AuditedEntity {
  name: string
  department?: EntityId
  defaultEstimatedMinutesByType: Record<string, number>
  defaultItemNotes: string[]
  active: boolean
}

export interface WorkItemAttachment {
  id: EntityId
  fileName: string
  uri: string
  uploadedAt: IsoDateTime
  uploadedByEmployeeId?: EntityId
  contentType?: string
}

export interface WorkItemHistoryEntry {
  id: EntityId
  action: string
  createdAt: IsoDateTime
  actorEmployeeId?: EntityId
  message: string
  metadata?: Record<string, string | number | boolean | null>
}

export type ProductionStepStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'BLOCKED'

export type ShipmentStatus = 'PENDING' | 'PACKED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED'

export type InventoryCategory = 'RAW_MATERIAL' | 'FRAME' | 'PACKAGING' | 'FINISHED_GOOD' | 'OTHER'

export type WorkflowRuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'INCLUDES'
  | 'EXISTS'

export interface WorkflowApprovalRequirement {
  role: string
  minimumApprovals: number
}

export interface Customer extends AuditedEntity {
  name: string
  email?: string
  phone?: string
  billingAddress?: Address
  shippingAddress?: Address
  orderIds: EntityId[]
  isActive: boolean
}

export interface Order extends AuditedEntity {
  customerId: EntityId
  orderNumber: string
  status: OrderStatus
  orderedAt: IsoDateTime
  dueAt?: IsoDateTime
  notes?: string
  workItemIds: EntityId[]
  shipmentIds: EntityId[]
}

export interface Product extends AuditedEntity {
  sku: string
  name: string
  category: string
  description?: string
  defaultWidthInches?: number
  defaultHeightInches?: number
  workflowId?: EntityId
  isActive: boolean
}

export interface Artwork extends AuditedEntity {
  customerId: EntityId
  title: string
  fileUri: string
  colorProfile?: string
  revision: number
  approvedAt?: IsoDateTime
}

export interface Workflow extends AuditedEntity {
  name: string
  version: number
  workflowType: string
  departmentId?: EntityId
  stageIds: EntityId[]
  transitionIds: EntityId[]
  ruleIds: EntityId[]
  initialStageId?: EntityId
  // Legacy support for Sprint 1 production-step templates.
  stepTemplateIds?: EntityId[]
  isActive: boolean
}

export interface WorkflowStage extends AuditedEntity {
  workflowId: EntityId
  name: string
  description?: string
  sequence: number
  department?: string
  requiredRoles: string[]
  requiredApprovals: WorkflowApprovalRequirement[]
  estimatedDuration: number
  isRequired: boolean
  canSkip: boolean
  completionRules: EntityId[]
}

export interface WorkflowTransition extends AuditedEntity {
  workflowId: EntityId
  fromStageId: EntityId
  toStageId: EntityId
  transitionName?: string
  allowBackward: boolean
  requiredApprovals: WorkflowApprovalRequirement[]
  validationRuleIds: EntityId[]
}

export interface WorkflowRule extends AuditedEntity {
  workflowId: EntityId
  code: string
  name: string
  description?: string
  fieldPath: string
  operator: WorkflowRuleOperator
  expectedValue?: string | number | boolean | string[] | number[]
  errorMessage?: string
  isActive: boolean
}

export interface ProductionStep extends AuditedEntity {
  workflowId: EntityId
  workItemId: EntityId
  name: string
  departmentId?: EntityId
  sequence: number
  estimatedMinutes: number
  status: ProductionStepStatus
  dependsOnStepIds: EntityId[]
  assignedEmployeeId?: EntityId
  startedAt?: IsoDateTime
  completedAt?: IsoDateTime
}

export interface WorkItem extends AuditedEntity {
  workItemNumber: string
  type: WorkItemType
  customerId: EntityId
  orderId: EntityId
  productId: EntityId
  artworkId?: EntityId
  workflowId: EntityId
  currentStageId: EntityId
  assignedDepartmentId?: EntityId
  assignedEmployeeId?: EntityId
  dueDate?: IsoDateTime
  startDate?: IsoDateTime
  completedDate?: IsoDateTime
  notes: string[]
  attachments: WorkItemAttachment[]
  tags: string[]
  customFields: Record<string, unknown>
  activityHistory: WorkItemHistoryEntry[]

  // Legacy compatibility fields for Sprint 1/2 projections.
  currentWorkflowStageId?: EntityId
  dueAt?: IsoDateTime
  currentStepId?: EntityId
  productionStepIds: EntityId[]
  tagLabels: string[]
  quantity: number
  status: WorkItemStatus
  priority: number
}

export type EmployeeRole = 'PRODUCTION_DIRECTOR' | 'WORKER' | 'ADMIN' | 'SHIPPING'

export interface Employee extends AuditedEntity {
  employeeNumber: string
  fullName: string
  role: EmployeeRole
  departmentId?: EntityId
  email?: string
  active: boolean
  hiredAt?: IsoDateTime
  skillStepNames: string[]
}

export interface Department extends AuditedEntity {
  code: string
  name: string
  managerEmployeeId?: EntityId
  employeeIds: EntityId[]
  description?: string
}

export interface Shipment extends AuditedEntity {
  orderId: EntityId
  customerId: EntityId
  status: ShipmentStatus
  workItemIds: EntityId[]
  carrier?: string
  trackingNumber?: string
  shippedAt?: IsoDateTime
  deliveredAt?: IsoDateTime
  destination: Address
}

export interface InventoryItem extends AuditedEntity {
  sku: string
  name: string
  category: InventoryCategory
  unitOfMeasure: string
  onHandQuantity: number
  reservedQuantity: number
  reorderPoint: number
  locationCode?: string
  lastCountedAt?: IsoDateTime
}

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'DUE_DATE_CHANGED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'WORK_CANCELLED'
  | 'NOTE_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'TAG_ADDED'
  | 'PRODUCTION_TAG_GENERATED'
  | 'PRODUCTION_TAG_SNAPSHOT_CAPTURED'
  | 'STAGE_CHANGED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'SHIPPED'
  | 'INVENTORY_RESERVED'
  | 'INVENTORY_RELEASED'
  | 'RECOMMENDATION_REVIEWED'
  | 'RECOMMENDATION_DISMISSED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'FORECAST_GENERATED'
  | 'INTELLIGENCE_THRESHOLD_CHANGED'
  | 'WEEKLY_SNAPSHOT_GENERATED'
  | 'TARGET_CHANGED'
  | 'METRIC_EXCLUDED_MANUALLY'
  | 'DATA_QUALITY_ISSUE_ACKNOWLEDGED'
  | 'FORECAST_CONFIG_CHANGED'
  | 'OPTIMIZATION_PROPOSAL_GENERATED'
  | 'OPTIMIZATION_PROPOSAL_ACCEPTED'
  | 'OPTIMIZATION_PROPOSAL_REJECTED'
  | 'OPTIMIZATION_SCENARIO_RUN'

export type ActivityEntityType =
  | 'Customer'
  | 'Order'
  | 'WorkItem'
  | 'BattlePlan'
  | 'BattlePlanTemplate'
  | 'Artwork'
  | 'Product'
  | 'Workflow'
  | 'WorkflowStage'
  | 'WorkflowTransition'
  | 'WorkflowRule'
  | 'ProductionStep'
  | 'Employee'
  | 'Department'
  | 'Shipment'
  | 'InventoryItem'

export interface ActivityLog extends AuditedEntity {
  entityType: ActivityEntityType
  entityId: EntityId
  action: ActivityAction
  actorEmployeeId?: EntityId
  occurredAt: IsoDateTime
  metadata?: Record<string, string | number | boolean | null>
}
