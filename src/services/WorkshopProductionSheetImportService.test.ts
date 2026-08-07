/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  workshopProductionSheetJobs,
  workshopProductionSheetSeedMetadata,
} from '../data/workshopProductionSheetJobs'
import { WorkshopProductionSheetImportService } from './WorkshopProductionSheetImportService'

const workbookPath = 'docs/source/Warehouse Production Sheets.xlsx'
const service = new WorkshopProductionSheetImportService()

const loadWorkbookBuffer = (): ArrayBuffer => {
  const bytes = readFileSync(workbookPath)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

describe('WorkshopProductionSheetImportService', () => {
  it('scans the full workbook and parses the current Workshop List', () => {
    const preview = service.parseBuffer(loadWorkbookBuffer(), 'Warehouse Production Sheets.xlsx')

    expect(preview.worksheets).toHaveLength(20)
    expect(preview.worksheets.filter((worksheet) => worksheet.visibility !== 'VISIBLE')).toHaveLength(19)
    expect(preview.worksheets.reduce((sum, worksheet) => sum + worksheet.formulaCellCount, 0)).toBe(15_572)
    expect(preview.worksheets.find((worksheet) => worksheet.name === 'Workshop List')).toMatchObject({
      visibility: 'VISIBLE',
      range: 'A1:BI803',
      formulaCellCount: 910,
    })
    expect(preview.rows).toHaveLength(46)
    expect(preview.jobs).toHaveLength(46)
    expect(new Set(preview.jobs.map((job) => job.id))).toHaveLength(46)
    expect(preview.summaries).toMatchObject({
      NEW: 46,
      CHANGED: 0,
      UNCHANGED: 0,
      SKIPPED: 0,
      NEEDS_REVIEW: 1,
      ERRORS: 0,
    })
    expect(preview.expectedPieceCount).toBe(47)
    expect(preview.issues).toEqual([
      'Workshop List control cell I4 reports 47 pieces, but 46 populated rows were found.',
    ])
  })

  it('preserves completion marks and red-note indicators without reading calculated timing cells', () => {
    const preview = service.parseBuffer(loadWorkbookBuffer(), 'Warehouse Production Sheets.xlsx')

    expect(preview.jobs.filter((job) => job.steps.PRINTED === 'COMPLETE')).toHaveLength(4)
    expect(preview.jobs.filter((job) => job.redNotes)).toHaveLength(4)
    expect(preview.jobs.find((job) => job.artworkTitle === 'New York Light')).toMatchObject({
      customerName: 'Rick Lange',
      dueDate: '2026-08-13',
      redNotes: 'Red note indicated in source workbook.',
      steps: { PRINTED: 'COMPLETE' },
    })
    expect(preview.jobs.some((job) => job.steps.FILES === 'COMPLETE')).toBe(false)
  })

  it('classifies an identical workbook against imported jobs as unchanged', () => {
    const first = service.parseBuffer(loadWorkbookBuffer(), 'Warehouse Production Sheets.xlsx')
    const second = service.parseBuffer(loadWorkbookBuffer(), 'Warehouse Production Sheets.xlsx', first.jobs)

    expect(second.summaries).toMatchObject({ NEW: 0, CHANGED: 0, UNCHANGED: 46 })
    expect(second.jobs.map((job) => job.id)).toEqual(first.jobs.map((job) => job.id))
  })

  it('keeps the checked-in application seed synchronized with the source workbook', () => {
    const preview = service.parseBuffer(
      loadWorkbookBuffer(),
      'Warehouse Production Sheets.xlsx',
      workshopProductionSheetJobs,
    )

    expect(preview.summaries).toMatchObject({ NEW: 0, CHANGED: 0, UNCHANGED: 46 })
    expect(preview.jobs.map((job) => job.id)).toEqual(workshopProductionSheetJobs.map((job) => job.id))
    expect(workshopProductionSheetSeedMetadata).toMatchObject({
      generatedJobCount: 46,
      expectedPieceCount: 47,
      worksheetCount: 20,
      hiddenWorksheetCount: 19,
      formulaCellCount: 15_572,
    })
  })
})