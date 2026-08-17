import { describe, expect, it } from 'vitest'
import { WorkItem } from '../models'
import { generateBattlePlansFromOperations, ProductionPipelineService } from './ProductionPipelineService'
import { DEFAULT_PRODUCTION_CALENDAR, SchedulingService } from './scheduling'
import { toWorkflowGroups } from './battlePlanWorkflowService'

const createService = (): ProductionPipelineService => new ProductionPipelineService({
  nowProvider: () => new Date('2026-08-02T08:00:00.000Z'),
  createWorkItem: (input) => new WorkItem({
    id: `workitem-${input.orderNumber}`,
    workItemNumber: `WI-${input.orderNumber}`,
    type: input.productType,
    customerId: 'customer-1',
    orderId: input.orderNumber,
    artworkId: 'artwork-1',
    productId: 'product-1',
    workflowId: 'workflow-1',
    currentStageId: 'FILES',
    quantity: 1,
    status: 'READY',
    priority: input.priority,
    dueDate: input.dueDate,
    assignedEmployeeId: input.assignedEmployeeId,
    notes: input.notes,
    attachments: [],
    tags: [],
    customFields: input.customFields ?? {},
    activityHistory: [],
    productionStepIds: [],
    tagLabels: [],
  }),
})

describe('ProductionPipelineService', () => {
  it('projects one imported WorkItem operation identity through the full pipeline', () => {
    const service = new ProductionPipelineService({
      nowProvider: () => new Date('2026-08-02T08:00:00.000Z'),
      createWorkItem: (input) => new WorkItem({
        id: 'workitem-web-4821-piece-1',
        workItemNumber: 'WI-WEB-4821-1',
        type: input.productType,
        customerId: 'customer-northwind',
        orderId: input.orderNumber,
        artworkId: 'artwork-pacific-crest-bloom',
        productId: 'product-canvas-24x30',
        workflowId: 'workflow-canvas',
        currentStageId: 'FILES',
        quantity: 1,
        status: 'READY',
        priority: input.priority,
        dueDate: input.dueDate,
        assignedEmployeeId: input.assignedEmployeeId,
        notes: input.notes,
        attachments: [],
        tags: [],
        customFields: {},
        activityHistory: [],
        productionStepIds: [],
        tagLabels: [],
      }),
    })

    const result = service.importOrder({
      orderNumber: 'WEB-4821',
      customerName: 'Northwind Gallery',
      artworkName: 'Pacific Crest Bloom',
      productType: 'CANVAS',
      width: 24,
      height: 30,
      orientation: 'VERT',
      priority: 80,
      dueDate: '2026-08-05',
      notes: ['Rush order'],
      assignedEmployeeId: 'employee-daniel',
      customFields: { frameStyle: 'Silver EH' },
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES',
      'PRINT',
      'STRETCHER_CUT',
      'STRETCHER_ASSEMBLY',
      'SAND_STRETCHER_CORNERS',
      'STRETCH',
      'CLOTH_BACKING',
      'FRAME_CUT',
      'FRAME_ASSEMBLY',
      'INSTALL_IN_FRAME',
      'QC',
      'SHIPPING',
    ])
    expect(result.tags).toHaveLength(result.operations.length)

    const operationIds = result.operations.map((operation) => operation.id)
    expect(result.tags.map((tag) => tag.operationId)).toEqual(operationIds)
    expect(result.cutCalculations.map((calculation) => calculation.kind)).toEqual(['FRAME', 'STRETCHER'])
    expect(result.operations.find((operation) => operation.name === 'FRAME_CUT')?.cutLinearInches).toBe(114.25)
    expect(result.operations.find((operation) => operation.name === 'STRETCHER_CUT')?.cutMemberCount).toBe(4)

    const hierarchy = service.buildWorkshopHierarchy([result.workItem])
    expect(hierarchy).toHaveLength(1)
    expect(hierarchy[0].artworks).toHaveLength(1)
    expect(hierarchy[0].artworks[0].pieces).toHaveLength(1)
    expect(hierarchy[0].artworks[0].pieces[0].operations.map((node) => node.id)).toEqual(operationIds)

    const schedule = new SchedulingService().schedule({
      now: new Date(2026, 7, 3, 8, 0),
      calendar: DEFAULT_PRODUCTION_CALENDAR,
      employees: [{
        employeeId: 'employee-daniel', employeeName: 'Daniel', availableMinutes: 480,
        skills: ['FILES', 'PRINTED', 'STRETCHER_BASE', 'FRAMED', 'SHIPPED'],
      }],
      operations: result.operations.map((operation) => ({
        id: operation.id,
        workItemId: operation.workItemId,
        orderNumber: 'WEB-4821',
        pieceLabel: '24x30 Canvas',
        operation: operation.name,
        status: operation.status,
        estimatedMinutes: operation.estimatedMinutes,
        cutMemberCount: operation.cutMemberCount,
        cutLinearInches: operation.cutLinearInches,
        cutCalculationStatus: operation.cutCalculation?.status,
        dependencyIds: operation.dependsOnOperationIds,
        dueDate: operation.dueDate ?? '2026-08-05',
        priority: operation.priority,
        category: 'CUSTOMER',
        createdAt: '2026-08-02T08:00:00.000Z',
        assignedEmployeeId: 'employee-daniel',
      })),
      constraints: result.operations.map((operation) => ({ operationId: operation.id, materialReadiness: 'READY', approvalReady: true })),
    })
    const generatedPlans = generateBattlePlansFromOperations({
      date: '2026-08-03',
      operations: schedule.entries,
      employees: [{
        id: 'employee-daniel', name: 'Daniel', role: 'WORKER', active: true,
        defaultAvailableMinutes: 480,
        skills: ['FILES', 'PRINTED', 'STRETCHER_BASE', 'FRAMED', 'SHIPPED'],
      }],
      workerConfigs: [{ workerId: 'employee-daniel', selected: true, availableMinutes: 480 }],
      directorId: 'employee-director',
    })
    expect(generatedPlans.workerPlans[0].tasks.map((task) => task.productionOperationId)).toEqual(operationIds)
    expect(generatedPlans.workerPlans[0].tasks.some((task) => task.description.includes('FRAME_CUT | WEB-4821'))).toBe(true)
    expect(schedule.entries.find((entry) => entry.operation === 'FRAME_CUT')?.cutLinearInches).toBe(114.25)
    expect(schedule.entries.find((entry) => entry.operation === 'FRAME_CUT')?.scheduleReason).toContain('4 members')
  })

  it('creates framed 3D cut and assembly dependencies', () => {
    const result = createService().importOrder({
      orderNumber: '3D-1', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'THREE_D_PRINT', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [],
      customFields: { frameStyle: 'B&G Plein Faux', baseStyle: 'B&G Plein Faux' },
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES', 'PRINT', 'DIBOND', 'BASE_CUT', 'BASE_ASSEMBLY', 'MOUNT',
      'FRAME_CUT', 'FRAME_ASSEMBLY', 'INSTALL_IN_FRAME', 'HARDWARE_WIRE',
      'FRAME_FINISHING', 'BAG', 'QC', 'SHIPPING',
    ])
    expect(result.operations.find((operation) => operation.name === 'DIBOND')).toMatchObject({
      workstation: 'cnc',
      cutCalculation: { cutDimensions: { width: 20, height: 30 } },
    })
    result.operations.slice(1).forEach((operation, index) => {
      expect(operation.dependsOnOperationIds).toEqual([result.operations[index].id])
    })
  })

  it('omits frame operations for unframed canvas', () => {
    const service = createService()
    const result = service.importOrder({
      orderNumber: 'CANVAS-NONE', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'CANVAS', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'None' },
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES', 'PRINT', 'STRETCHER_CUT', 'STRETCHER_ASSEMBLY',
      'SAND_STRETCHER_CORNERS', 'STRETCH', 'CLOTH_BACKING', 'QC', 'SHIPPING',
    ])
    expect(result.operations.some((operation) => operation.name.startsWith('FRAME'))).toBe(false)
    expect(service.getOperations(result.workItem).map((operation) => operation.id)).toEqual(
      result.operations.map((operation) => operation.id),
    )
  })

  it('creates a paper Print route without base, stretcher, or Dibond work', () => {
    const result = createService().importOrder({
      orderNumber: 'PAPER-1', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'PAPER', width: 16, height: 20, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'Rolled' },
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES', 'PRINT', 'TRIM', 'QC', 'SHIPPING',
    ])
    expect(result.cutCalculations).toEqual([])
  })

  it.each([
    { longest: 30, center: false, corner: false, additional: false },
    { longest: 31, center: true, corner: false, additional: false },
    { longest: 46, center: true, corner: true, additional: false },
    { longest: 61, center: true, corner: true, additional: true },
  ])('applies Canvas support thresholds at $longest inches', ({ longest, center, corner, additional }) => {
    const result = createService().importOrder({
      orderNumber: `CANVAS-${longest}`, customerName: 'Customer', artworkName: 'Artwork',
      productType: 'CANVAS', width: 20, height: longest, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'None' },
    })
    const stretcher = result.cutCalculations.find((calculation) => calculation.kind === 'STRETCHER')

    expect(stretcher).toMatchObject({
      centerStrainerRequired: center,
      cornerStrainerRequired: corner,
      oppositeAdditionalStrainerRequired: additional,
    })
  })

  it('creates the complete unframed 3D route without frame operations', () => {
    const result = createService().importOrder({
      orderNumber: '3D-NONE', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'TEXTURED_REPLICA_3D', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'None' },
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES', 'PRINT', 'DIBOND', 'BASE_CUT', 'BASE_ASSEMBLY', 'MOUNT',
      'HARDWARE_WIRE', 'BAG', 'QC', 'SHIPPING',
    ])
    expect(result.operations.some((operation) => operation.name.startsWith('STRETCHER'))).toBe(false)
    expect(result.operations.find((operation) => operation.name === 'BASE_CUT')).toMatchObject({
      status: 'BLOCKED',
      tagStatus: 'NEEDS_REVIEW',
    })
  })

  it.each([
    { longest: 60, additional: false },
    { longest: 61, additional: true },
  ])('creates the Original route with mandatory supports at $longest inches', ({ longest, additional }) => {
    const result = createService().importOrder({
      orderNumber: `ORIGINAL-${longest}`, customerName: 'Customer', artworkName: 'Artwork',
      productType: 'ORIGINAL', width: 30, height: longest, orientation: 'VERT',
      priority: 100, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'None' },
    })
    const stretcher = result.cutCalculations.find((calculation) => calculation.kind === 'STRETCHER')

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'STRETCHER_CUT', 'STRETCHER_ASSEMBLY', 'SAND_STRETCHER_CORNERS',
      'STRETCH', 'QC', 'SHIPPING',
    ])
    expect(stretcher).toMatchObject({
      centerStrainerRequired: true,
      cornerStrainerRequired: true,
      oppositeAdditionalStrainerRequired: additional,
    })
  })

  it('preserves a completed impossible historical operation and flags the rebuilt route', () => {
    const service = createService()
    const first = service.importOrder({
      orderNumber: 'ROUTE-HISTORY', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'CANVAS', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'None' },
    })
    const historical = first.operations.find((operation) => operation.name === 'STRETCHER_CUT')!
    historical.status = 'COMPLETE'
    historical.completedAt = '2026-08-06T12:00:00.000Z'
    historical.completedBy = 'employee-1'

    const rebuilt = service.rebuildOrder(first.workItem, {
      orderNumber: 'ROUTE-HISTORY', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'PAPER', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'Rolled' },
    })
    const validation = (rebuilt.workItem.customFields.pipeline as { routeValidation: { status: string } }).routeValidation

    expect(rebuilt.operations.find((operation) => operation.id === historical.id)).toMatchObject({
      name: 'STRETCHER_CUT', status: 'COMPLETE', completedAt: historical.completedAt,
    })
    expect(validation.status).toBe('NEEDS_REVIEW')
    expect(rebuilt.operations.some((operation) => operation.name.startsWith('BASE'))).toBe(false)
  })

  it('blocks unresolved cut work and every downstream dependency', () => {
    const result = createService().importOrder({
      orderNumber: 'CANVAS-REVIEW', customerName: 'Customer', artworkName: 'Artwork',
      productType: 'CANVAS', width: 20, height: 30, orientation: 'VERT',
      priority: 80, dueDate: '2026-08-05', notes: [], customFields: { frameStyle: 'Gold' },
    })
    const frameCutIndex = result.operations.findIndex((operation) => operation.name === 'FRAME_CUT')

    expect(result.operations[frameCutIndex].tagStatus).toBe('NEEDS_REVIEW')
    expect(result.operations.slice(frameCutIndex).every((operation) => operation.status === 'BLOCKED')).toBe(true)
  })

  it('excludes unresolved saw work from worker Battle Plans', () => {
    const blockedEntry = {
      id: 'schedule:frame-cut-review', operationId: 'frame-cut-review', workItemId: 'workitem-review',
      orderNumber: 'ORDER-REVIEW', pieceLabel: '20x30 Canvas', operation: 'FRAME_CUT' as const,
      status: 'BLOCKED' as const, plannedStart: '2026-08-03T08:00:00.000Z', plannedFinish: '2026-08-03T08:45:00.000Z',
      assignedEmployee: 'employee-daniel', assignedWorkCenter: 'frames', estimatedMinutes: 45,
      confidence: 'LOW' as const, scheduleReason: 'Blocked by Calculation.', dependencyIds: [],
      dueDate: '2026-08-05', priority: 80, locked: false, cutCalculationStatus: 'NEEDS_REVIEW' as const,
      tagStatus: 'NEEDS_REVIEW' as const, materialReadiness: 'MISSING' as const,
    }
    const plans = generateBattlePlansFromOperations({
      date: '2026-08-03', operations: [blockedEntry], employees: [],
      workerConfigs: [{ workerId: 'employee-daniel', selected: true, availableMinutes: 480 }],
      directorId: 'employee-director',
    })

    expect(plans.workerPlans[0].tasks).toEqual([])
    expect(plans.directorPlan.tasks).toHaveLength(1)
    expect(plans.directorPlan.tasks[0]).toMatchObject({
      tagStatus: 'NEEDS_REVIEW', openWorkItemId: 'workitem-review', cutSummary: 'Unresolved cut dimensions',
      directorSection: 'REVIEW',
    })
    expect(plans.directorPlan.tasks.some((task) => task.directorSection === 'PRODUCTION')).toBe(false)
  })

  it('groups Director production operations by operation type with matching counts', () => {
    const operationTypes = [
      'FRAME_CUT', 'FRAME_ASSEMBLY', 'BASE_CUT', 'BASE_ASSEMBLY',
      'STRETCHER_CUT', 'STRETCHER_ASSEMBLY',
    ] as const
    const entries = operationTypes.map((operation, index) => ({
      id: `schedule:${operation}`, operationId: `operation:${operation}`, workItemId: `workitem:${operation}`,
      orderNumber: `ORDER-${index}`, pieceLabel: '20x30 Piece', operation, status: 'READY' as const,
      plannedStart: `2026-08-03T${String(8 + index).padStart(2, '0')}:00:00.000Z`,
      plannedFinish: `2026-08-03T${String(8 + index).padStart(2, '0')}:30:00.000Z`,
      assignedEmployee: 'employee-daniel', assignedWorkCenter: 'saw', estimatedMinutes: 30,
      confidence: 'HIGH' as const, scheduleReason: 'Ready.', dependencyIds: [], dueDate: '2026-08-05',
      priority: 80, locked: false, cutCalculationStatus: 'CONFIRMED' as const,
      tagStatus: 'READY_TO_PRINT' as const, materialReadiness: 'READY' as const,
    }))
    const plans = generateBattlePlansFromOperations({
      date: '2026-08-03', operations: entries, employees: [],
      workerConfigs: [{ workerId: 'employee-daniel', selected: true, availableMinutes: 480 }],
      directorId: 'employee-director',
    })
    const productionTasks = plans.directorPlan.tasks.filter((task) => task.directorSection === 'PRODUCTION')
    const groups = toWorkflowGroups({ ...plans.directorPlan, tasks: productionTasks }, [])

    expect(groups.map((group) => [group.operationName, group.workItems.length])).toEqual([
      ['Frames to Make', 2], ['Bases to Make', 2], ['Stretchers to Make', 2],
    ])
    expect(groups.reduce((count, group) => count + group.workItems.length, 0)).toBe(operationTypes.length)
    expect(plans.workerPlans[0].tasks).toHaveLength(operationTypes.length)
    expect(plans.directorPlan.tasks.filter((task) => task.directorSection === 'REVIEW')).toEqual([])
  })

  it('adds strainer labor only to assembly and propagates it through scheduling and Battle Plans', () => {
    const result = createService().importOrder({
      orderNumber: 'CANVAS-70', customerName: 'Customer', artworkName: 'Large Canvas',
      productType: 'CANVAS', width: 70, height: 40, orientation: 'HORIZ', priority: 80,
      dueDate: '2026-08-05', notes: [], assignedEmployeeId: 'employee-daniel',
      customFields: { frameStyle: 'None' },
    })
    const cut = result.operations.find((operation) => operation.name === 'STRETCHER_CUT')!
    const assembly = result.operations.find((operation) => operation.name === 'STRETCHER_ASSEMBLY')!
    expect(cut.estimatedMinutes).toBe(20)
    expect(assembly.estimatedMinutes).toBe(53)

    const schedule = new SchedulingService().schedule({
      now: new Date(2026, 7, 3, 8, 0), calendar: DEFAULT_PRODUCTION_CALENDAR,
      employees: [{ employeeId: 'employee-daniel', employeeName: 'Daniel', availableMinutes: 480, skills: ['STRETCHER_BASE'] }],
      operations: [assembly].map((operation) => ({
        id: operation.id, workItemId: operation.workItemId, orderNumber: 'CANVAS-70', pieceLabel: '70x40 Canvas',
        operation: operation.name, status: operation.status, estimatedMinutes: operation.estimatedMinutes,
        dependencyIds: [], dueDate: operation.dueDate!, priority: operation.priority, category: 'CUSTOMER' as const,
        createdAt: '2026-08-02T08:00:00.000Z', assignedEmployeeId: 'employee-daniel',
      })),
    })
    const plans = generateBattlePlansFromOperations({
      date: '2026-08-03', operations: schedule.entries, employees: [],
      workerConfigs: [{ workerId: 'employee-daniel', selected: true, availableMinutes: 480 }],
      directorId: 'employee-director',
    })

    expect(schedule.entries[0].estimatedMinutes).toBe(53)
    expect(plans.workerPlans[0].tasks[0].estimatedMinutes).toBe(53)
    expect(plans.directorPlan.tasks[0].estimatedMinutes).toBe(53)
  })
})