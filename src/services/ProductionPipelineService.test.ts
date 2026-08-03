import { describe, expect, it } from 'vitest'
import { WorkItem } from '../models'
import { generateBattlePlansFromOperations, ProductionPipelineService } from './ProductionPipelineService'
import { DEFAULT_PRODUCTION_CALENDAR, SchedulingService } from './scheduling'

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
    })

    expect(result.operations.map((operation) => operation.name)).toEqual([
      'FILES',
      'PRINTED',
      'STRETCHER',
      'STRETCH',
      'FRAME',
      'QC',
      'SHIPPING',
    ])
    expect(result.tags).toHaveLength(result.operations.length)

    const operationIds = result.operations.map((operation) => operation.id)
    expect(result.tags.map((tag) => tag.operationId)).toEqual(operationIds)

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
    expect(generatedPlans.workerPlans[0].tasks[4].description).toContain('FRAME | WEB-4821')
  })

  it('creates only product-specific operations', () => {
    const service = new ProductionPipelineService({
      createWorkItem: () => { throw new Error('not used') },
    })

    expect(service.getRequiredOperationNames('PAPER')).toEqual(['FILES', 'PRINTED', 'TRIM', 'QC', 'SHIPPING'])
    expect(service.getRequiredOperationNames('THREE_D_PRINT')).toEqual([
      'FILES', 'SLICE', 'RESIZE', 'DIBOND', 'MOUNT', 'FRAME', 'QC', 'SHIPPING',
    ])
  })
})