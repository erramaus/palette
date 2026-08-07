import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { WorkshopProductionSheetImportService } from '../src/services/WorkshopProductionSheetImportService'

const sourcePath = resolve('docs/source/Warehouse Production Sheets.xlsx')
const outputPath = resolve('src/data/workshopProductionSheetJobs.ts')
const bytes = readFileSync(sourcePath)
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
const preview = new WorkshopProductionSheetImportService().parseBuffer(
  buffer,
  'Warehouse Production Sheets.xlsx',
)

if (preview.jobs.length === 0 || preview.rows.some((row) => row.errors.length > 0)) {
  throw new Error(`Seed generation stopped: ${preview.jobs.length} valid jobs and ${preview.summaries.NEEDS_REVIEW} review issue(s).`)
}

const output = `import type { ProductionJob } from '../types/production'
import { calculateDueStatus } from '../utils/dueStatus'

const generatedJobs: ProductionJob[] = ${JSON.stringify(preview.jobs, null, 2)}

export const workshopProductionSheetJobs: ProductionJob[] = generatedJobs.map((job) => ({
  ...job,
  dueStatus: calculateDueStatus(job.dueDate, job.onHold),
}))

export const workshopProductionSheetSeedMetadata = ${JSON.stringify({
  sourceFileName: preview.fileName,
  sourceWorksheet: preview.sourceWorksheet,
  generatedJobCount: preview.jobs.length,
  expectedPieceCount: preview.expectedPieceCount,
  issues: preview.issues,
  worksheetCount: preview.worksheets.length,
  hiddenWorksheetCount: preview.worksheets.filter((worksheet) => worksheet.visibility !== 'VISIBLE').length,
  formulaCellCount: preview.worksheets.reduce((sum, worksheet) => sum + worksheet.formulaCellCount, 0),
}, null, 2)} as const
`

writeFileSync(outputPath, output)
console.log(`Generated ${preview.jobs.length} Workshop Production Sheet jobs at ${outputPath}.`)