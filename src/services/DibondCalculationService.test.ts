import { describe, expect, it } from 'vitest'
import { DibondCalculationService } from './DibondCalculationService'

describe('DibondCalculationService', () => {
  it('uses exact finished painting dimensions at the CNC workstation', () => {
    const result = new DibondCalculationService().calculate({
      productType: 'THREE_D_PRINT',
      width: 20.375,
      height: 30.625,
    })

    expect(result.status).toBe('CONFIRMED')
    expect(result.cutDimensions).toEqual({ width: 20.375, height: 30.625 })
    expect(result.workstation).toBe('cnc')
    expect(result.trace.calculatedOutputs).toMatchObject({
      cutWidthInches: 20.375,
      cutHeightInches: 30.625,
      workstation: 'CNC',
      confirmationDate: '2026-08-03',
    })
  })

  it('does not introduce CNC layout data', () => {
    const result = new DibondCalculationService().calculate({
      productType: 'TEXTURED_REPLICA_3D',
      width: 24,
      height: 36,
    })
    const keys = JSON.stringify(result).toLowerCase()

    expect(keys).not.toContain('coordinates')
    expect(keys).not.toContain('sheetlayout')
    expect(keys).not.toContain('kerf')
    expect(keys).not.toContain('nesting')
    expect(keys).not.toContain('placement')
  })
})