import type { Workflow as WorkflowShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Workflow extends BaseEntity implements WorkflowShape {
  name: string
  version: number
  workflowType: string
  departmentId?: string
  stageIds: string[]
  transitionIds: string[]
  ruleIds: string[]
  initialStageId?: string
  stepTemplateIds: string[]
  isActive: boolean

  constructor(init: EntityInit<WorkflowShape>) {
    super(init)
    this.id = init.id ?? createEntityId('workflow')
    this.name = init.name
    this.version = init.version
    this.workflowType = init.workflowType
    this.departmentId = init.departmentId
    this.stageIds = init.stageIds ?? []
    this.transitionIds = init.transitionIds ?? []
    this.ruleIds = init.ruleIds ?? []
    this.initialStageId = init.initialStageId
    this.stepTemplateIds = init.stepTemplateIds ?? []
    this.isActive = init.isActive
  }
}
