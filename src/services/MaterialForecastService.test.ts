import { describe, expect, it } from 'vitest'
import type { ProductionJob } from '../types/production'
import { MaterialForecastService } from './MaterialForecastService'

const job = (frameInfo: string): ProductionJob => ({
  id: 'job-1',
  orderNumber: 'ORDER-1',
  customerName: 'Customer',
  artworkTitle: 'Artwork',
  productType: 'CANVAS',
  width: 24,
  height: 30,
  frameInfo,
  dueDate: '2026-08-08',
  dueStatus: 'ON_TRACK',
  priority: 'CUSTOMER_PURCHASED',
  assignedWorkerId: 'worker-1',
  notes: '',
  steps: {
    FILES: 'WAITING', PRINTED: 'WAITING', DIBOND: 'NOT_APPLICABLE', STRETCHER_BASE: 'WAITING',
    MOUNTED: 'WAITING', FRAME_MADE: 'WAITING', FRAMED: 'WAITING', SHIPPED: 'WAITING',
  },
  estimatedMinutes: {
    FILES: 30, PRINTED: 55, DIBOND: 0, STRETCHER_BASE: 45,
    MOUNTED: 0, FRAME_MADE: 90, FRAMED: 20, SHIPPED: 35,
  },
})

describe('MaterialForecastService cut demand', () => {
  it('projects confirmed member lengths without rounding', () => {
    const service = new MaterialForecastService({ productionJobs: [job('Silver EH')], battlePlans: [] })
    const demands = service.getMaterialDemand('job-1')

    expect(demands.map((demand) => demand.kind)).toEqual(['FRAME', 'STRETCHER'])
    expect(demands[0].totalLinearInches).toBe(114.25)
    expect(demands[0].members).toHaveLength(4)
    expect(demands[0].trace.ruleId).toBe('frame.silver-eh.increase.v1')
  })

  it('does not fabricate demand quantity for review calculations', () => {
    const service = new MaterialForecastService({ productionJobs: [job('Gold')], battlePlans: [] })
    const frameDemand = service.getMaterialDemand('job-1').find((demand) => demand.kind === 'FRAME')!

    expect(frameDemand.status).toBe('NEEDS_REVIEW')
    expect(frameDemand.totalLinearInches).toBeNull()
    expect(service.getMaterialStatus('job-1', 'FRAME_MADE').inventorySignals).toContain('frame_cut_needs_review')
  })

  it('aggregates confirmed gross, reserved, available, shortage, and strainer units separately', () => {
    const service = new MaterialForecastService({
      productionJobs: [job('Silver EH')],
      battlePlans: [],
      inventoryBalances: {
        FRAME: { reservedLinearInches: 20, availableLinearInches: 100 },
        STRETCHER: { reservedLinearInches: 10, availableLinearInches: 80 },
      },
    })
    const aggregate = service.getAggregatedMaterialDemand()
    const frame = aggregate.find((item) => item.kind === 'FRAME')!
    const stretcher = aggregate.find((item) => item.kind === 'STRETCHER')!

    expect(frame).toMatchObject({
      grossLinearInches: 114.25,
      reservedLinearInches: 20,
      availableLinearInches: 100,
      shortageLinearInches: 14.25,
    })
    expect(stretcher.grossLinearInches).toBe(107.75)
    expect(stretcher.confirmedStrainerUnits).toBe(0)
  })
})