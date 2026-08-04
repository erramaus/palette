import fs from 'node:fs'
import path from 'node:path'

const itemsPath = path.resolve('docs/knowledge/generated/WarehouseInventoryWorkbook.items.json')
const summaryPath = path.resolve('docs/knowledge/generated/WarehouseInventoryWorkbook.summary.json')
const targetPath = path.resolve('src/data/warehouseInventoryWorkbookSeed.ts')

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))

const lines = []
lines.push("import type { WarehouseInventorySeedRow } from '../types/inventory'")
lines.push('')
lines.push(`export const WAREHOUSE_INVENTORY_WORKBOOK_NAME = ${JSON.stringify(summary.workbook)} as const`)
lines.push('')
lines.push(`export const WAREHOUSE_INVENTORY_SEED_ROWS: WarehouseInventorySeedRow[] = ${JSON.stringify(items, null, 2)} as WarehouseInventorySeedRow[]`)
lines.push('')
lines.push('export const WAREHOUSE_INVENTORY_AMBIGUOUS_ROWS = ' + JSON.stringify(summary.ambiguousRows, null, 2) + ' as const')
lines.push('')

fs.writeFileSync(targetPath, `${lines.join('\n')}\n`)
console.log(`Wrote ${targetPath} with ${items.length} seed rows.`)
