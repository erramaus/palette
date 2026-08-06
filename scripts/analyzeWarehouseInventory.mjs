import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const workbookPath = path.resolve('docs/source/Warehouse Inventory 2026-08-06.xlsx')
const workbook = xlsx.readFile(workbookPath, {
  cellFormula: true,
  cellNF: true,
  cellText: true,
  cellStyles: true,
})

const colName = (index) => {
  let value = ''
  let current = index + 1
  while (current > 0) {
    const rem = (current - 1) % 26
    value = String.fromCharCode(65 + rem) + value
    current = Math.floor((current - 1) / 26)
  }
  return value
}

const parseRange = (rangeRef) => {
  if (!rangeRef) return null
  const range = xlsx.utils.decode_range(rangeRef)
  return {
    startRow: range.s.r + 1,
    endRow: range.e.r + 1,
    startColumn: colName(range.s.c),
    endColumn: colName(range.e.c),
    rowCount: range.e.r - range.s.r + 1,
    columnCount: range.e.c - range.s.c + 1,
  }
}

const firstNonEmpty = (sheet, rowIndex, maxCol) => {
  for (let col = 0; col <= maxCol; col += 1) {
    const addr = xlsx.utils.encode_cell({ r: rowIndex, c: col })
    const cell = sheet[addr]
    if (!cell) continue
    const value = String(cell.w ?? cell.v ?? '').trim()
    if (value) return true
  }
  return false
}

const findHeaderRow = (sheet, range) => {
  if (!range) return 0
  const maxScan = Math.min(range.e.r, range.s.r + 40)
  let bestRow = range.s.r
  let bestScore = -1
  for (let row = range.s.r; row <= maxScan; row += 1) {
    let score = 0
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const addr = xlsx.utils.encode_cell({ r: row, c: col })
      const cell = sheet[addr]
      if (!cell) continue
      const raw = String(cell.w ?? cell.v ?? '').trim()
      if (!raw) continue
      if (/item|description|vendor|supplier|qty|quantity|count|location|unit|price|cost|reorder|on hand|needed|stock|notes|package|po|csw/i.test(raw)) {
        score += 4
      } else if (/^[A-Za-z][A-Za-z0-9 .()\/-]{1,50}$/.test(raw)) {
        score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestRow = row
    }
  }
  return bestRow
}

const collectRows = (sheet, range, headerRow) => {
  const headers = []
  const headerSeen = new Map()
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const addr = xlsx.utils.encode_cell({ r: headerRow, c: col })
    const cell = sheet[addr]
    const raw = String(cell?.w ?? cell?.v ?? '').trim()
    const baseHeader = raw || `COLUMN_${colName(col)}`
    const count = (headerSeen.get(baseHeader) ?? 0) + 1
    headerSeen.set(baseHeader, count)
    const header = count === 1 ? `${baseHeader} [${colName(col)}]` : `${baseHeader}#${count} [${colName(col)}]`
    headers.push(header)
  }

  const rows = []
  for (let row = headerRow + 1; row <= range.e.r; row += 1) {
    if (!firstNonEmpty(sheet, row, range.e.c)) continue
    const entry = {
      rowNumber: row + 1,
      rowReference: `${row + 1}`,
      values: {},
      formulas: {},
      sourceCells: {},
      styleRefs: {},
    }
    let nonEmpty = 0

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const header = headers[col - range.s.c]
      const addr = xlsx.utils.encode_cell({ r: row, c: col })
      const cell = sheet[addr]
      const value = cell ? (cell.w ?? cell.v ?? '') : ''
      const trimmed = String(value).trim()
      if (trimmed) {
        nonEmpty += 1
        entry.values[header] = trimmed
        entry.sourceCells[header] = addr
      }
      if (cell?.f) {
        entry.formulas[header] = cell.f
      }
      if (cell) {
        entry.styleRefs[header] = {
          cell: addr,
          styleIndex: typeof cell.s === 'number' ? cell.s : null,
          styleObject: typeof cell.s === 'object' ? cell.s : null,
          numberFormat: typeof cell.z === 'string' ? cell.z : null,
          cellType: cell.t ?? null,
        }
      }
    }

    if (nonEmpty > 0) {
      rows.push(entry)
    }
  }

  return { headers, rows }
}

const analyzeSheet = (sheetName, index) => {
  const sheet = workbook.Sheets[sheetName]
  const meta = workbook.Workbook?.Sheets?.[index]
  const hiddenState = meta?.Hidden === 1 ? 'HIDDEN' : meta?.Hidden === 2 ? 'VERY_HIDDEN' : 'VISIBLE'
  const range = parseRange(sheet['!ref'])
  const merges = (sheet['!merges'] ?? []).map((merge) => {
    const start = xlsx.utils.encode_cell(merge.s)
    const end = xlsx.utils.encode_cell(merge.e)
    return `${start}:${end}`
  })

  const formulaSamples = []
  let formulaCount = 0
  if (range) {
    for (let row = range.startRow - 1; row <= range.endRow - 1; row += 1) {
      for (let col = xlsx.utils.decode_col(range.startColumn); col <= xlsx.utils.decode_col(range.endColumn); col += 1) {
        const addr = xlsx.utils.encode_cell({ r: row, c: col })
        const cell = sheet[addr]
        if (cell?.f) {
          formulaCount += 1
          if (formulaSamples.length < 25) {
            formulaSamples.push({ cell: addr, formula: cell.f })
          }
        }
      }
    }
  }

  if (!range) {
    return {
      worksheet: sheetName,
      visibility: hiddenState,
      range: null,
      formulaCount,
      formulaSamples,
      headerRow: null,
      headers: [],
      rowCount: 0,
      rows: [],
    }
  }

  const decodeRange = xlsx.utils.decode_range(sheet['!ref'])
  const headerRow = findHeaderRow(sheet, decodeRange)
  const { headers, rows } = collectRows(sheet, decodeRange, headerRow)

  return {
    worksheet: sheetName,
    visibility: hiddenState,
    range,
    mergedRanges: merges,
    formulaCount,
    formulaSamples,
    headerRow: headerRow + 1,
    headers,
    rowCount: rows.length,
    rows,
  }
}

const analysis = {
  workbook: path.basename(workbookPath),
  sheets: workbook.SheetNames.map((sheetName, index) => analyzeSheet(sheetName, index)),
}

fs.mkdirSync(path.resolve('docs/knowledge/generated'), { recursive: true })
fs.writeFileSync(path.resolve('docs/knowledge/generated/WarehouseInventoryWorkbook.analysis.json'), JSON.stringify(analysis, null, 2))

const normalizedSheetRows = analysis.sheets.filter((sheet) => /Unit A|Unit B|Unit C|Erins Studio/i.test(sheet.worksheet))

const normalizeNumber = (value) => {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[$,%]/g, '').replace(/,/g, '').trim()
  if (!cleaned) return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

const readByPrefix = (record, prefix, preferredColumn) => {
  const keys = Object.keys(record)
  const exactPreferred = preferredColumn ? `${prefix} [${preferredColumn}]` : null
  if (exactPreferred && exactPreferred in record) {
    return { key: exactPreferred, value: String(record[exactPreferred] ?? '').trim() }
  }

  const matches = keys.filter((key) => key.startsWith(`${prefix} [` ) || key.startsWith(`${prefix}#`))
  if (matches.length === 0) {
    return { key: null, value: '' }
  }

  const key = matches[0]
  return { key, value: String(record[key] ?? '').trim() }
}

const categoryTracker = new Map()
const categorySet = new Set()
const locationSet = new Set()
const supplierSet = new Set()
const itemRecords = []
const ambiguousRows = []
const formulaRules = new Map()

for (const sheet of normalizedSheetRows) {
  locationSet.add(sheet.worksheet)
  let currentCategory = ''
  for (const row of sheet.rows) {
    const rowCategoryField = readByPrefix(row.values, 'COLUMN_A', 'A')
    const rowCategory = rowCategoryField.value
    const orderField = readByPrefix(row.values, 'ORDER', 'B')
    const orderValue = orderField.value
    if (rowCategory) {
      currentCategory = rowCategory
      categorySet.add(rowCategory)
      categoryTracker.set(`${sheet.worksheet}:${row.rowNumber}`, rowCategory)
    }

    const skuField = readByPrefix(row.values, 'Item#2', 'J')
    const fallbackSkuField = readByPrefix(row.values, 'Item', 'H')
    const sku = skuField.value || fallbackSkuField.value
    const descriptionField = readByPrefix(row.values, 'Description', 'K')
    const description = descriptionField.value
    const supplierField = readByPrefix(row.values, 'Purchase from', 'L')
    const supplier = supplierField.value
    const accountField = readByPrefix(row.values, 'Account', 'M')
    const account = accountField.value
    const sizeField = readByPrefix(row.values, 'Size', 'I')
    const size = sizeField.value
    const stockField = readByPrefix(row.values, 'STOCK', 'G')
    const stockText = stockField.value
    const reorderField = readByPrefix(row.values, 'RE-ORDER QTY', 'D')
    const reorderText = reorderField.value
    const orderQtyField = readByPrefix(row.values, 'ORDER QTY.', 'F')
    const orderQtyText = orderQtyField.value
    const maxQtyField = readByPrefix(row.values, 'MAX QTY', 'C')
    const twelveWeekField = readByPrefix(row.values, '12-WEEKS', 'C')
    const maxQtyText = maxQtyField.value || twelveWeekField.value
    const priceField = readByPrefix(row.values, 'Price Ea.', 'N')
    const priceText = priceField.value
    const subtotalField = readByPrefix(row.values, 'Subtotal', 'O')
    const subtotalText = subtotalField.value
    const notesField = readByPrefix(row.values, 'Notes', 'P')
    const notes = notesField.value

    const hasCoreItemFields = Boolean(orderValue && (description || sku))
    const hasQuantities = Boolean(stockText || reorderText || orderQtyText || maxQtyText)
    const hasAnyInventorySignal = hasCoreItemFields || hasQuantities

    if (!hasAnyInventorySignal) {
      continue
    }

    if (!description || !sku || !supplier || !size) {
      ambiguousRows.push({
        worksheet: sheet.worksheet,
        rowNumber: row.rowNumber,
        sourceRef: `${sheet.worksheet}!${row.sourceCells[descriptionField.key] ?? row.sourceCells[skuField.key] ?? row.sourceCells[fallbackSkuField.key] ?? `A${row.rowNumber}`}`,
        reason: 'Missing one or more required source fields (description, item/SKU, supplier, or size).',
        status: 'NEEDS_REVIEW',
        values: {
          category: rowCategory || currentCategory || null,
          sku: sku || null,
          description: description || null,
          supplier: supplier || null,
          size: size || null,
          account: account || null,
        },
      })
    }

    if (row.formulas && Object.keys(row.formulas).length > 0) {
      for (const [field, formula] of Object.entries(row.formulas)) {
        const key = `${field}:${formula}`
        formulaRules.set(key, {
          field,
          formula,
          exampleWorksheet: sheet.worksheet,
          exampleRow: row.rowNumber,
          sourceRef: `${sheet.worksheet}!${row.sourceCells[field] ?? `A${row.rowNumber}`}`,
        })
      }
    }

    if (supplier) supplierSet.add(supplier)

    itemRecords.push({
      idHint: `${sheet.worksheet}:${row.rowNumber}`,
      worksheet: sheet.worksheet,
      rowNumber: row.rowNumber,
      sourceRef: `${sheet.worksheet}!${row.sourceCells[descriptionField.key] ?? row.sourceCells[skuField.key] ?? row.sourceCells[fallbackSkuField.key] ?? `A${row.rowNumber}`}`,
      category: rowCategory || currentCategory || 'NEEDS_REVIEW',
      orderIndex: normalizeNumber(orderValue),
      sku: sku || null,
      description: description || null,
      size: size || null,
      supplier: supplier || null,
      account: account || null,
      stock: normalizeNumber(stockText),
      reorderQuantity: normalizeNumber(reorderText),
      orderQuantity: normalizeNumber(orderQtyText),
      desiredStock: normalizeNumber(maxQtyText),
      priceEach: normalizeNumber(priceText),
      subtotal: normalizeNumber(subtotalText),
      notes: notes || null,
      formulas: row.formulas,
      styleRefs: row.styleRefs,
      status: (!description || !sku || !supplier || !size) ? 'NEEDS_REVIEW' : 'READY',
      sourceValues: row.values,
    })
  }
}

const summary = {
  workbook: analysis.workbook,
  sheetCount: analysis.sheets.length,
  worksheetsAnalyzed: analysis.sheets.map((sheet) => ({
    worksheet: sheet.worksheet,
    visibility: sheet.visibility,
    headerRow: sheet.headerRow,
    rowCount: sheet.rowCount,
    formulaCount: sheet.formulaCount,
    mergedRanges: sheet.mergedRanges,
    headers: sheet.headers,
  })),
  inventorySheets: normalizedSheetRows.map((sheet) => ({
    worksheet: sheet.worksheet,
    visibility: sheet.visibility,
    headerRow: sheet.headerRow,
    rowCount: sheet.rowCount,
    headers: sheet.headers,
    formulaCount: sheet.formulaCount,
  })),
  inventoryStats: {
    inventoryItemsFound: itemRecords.length,
    categoriesFound: [...categorySet].sort((left, right) => left.localeCompare(right)),
    locationsFound: [...locationSet].sort((left, right) => left.localeCompare(right)),
    suppliersFound: [...supplierSet].sort((left, right) => left.localeCompare(right)),
    ambiguousRowCount: ambiguousRows.length,
  },
  formulaRulesFound: [...formulaRules.values()],
  ambiguousRows,
  parserLimitations: [
    'The xlsx package returns formula expressions but not the full Excel calculation chain or external links.',
    'Cell style extraction is limited to style references exposed by the parser; conditional formatting rules are not fully expanded.',
    'Merged-cell category labels may require manual review where Excel visual grouping carries business meaning.',
    'Workbook macros/VBA and print-layout directives are not executed by this parser.',
  ],
}
fs.writeFileSync(path.resolve('docs/knowledge/generated/WarehouseInventoryWorkbook.summary.json'), JSON.stringify(summary, null, 2))

fs.writeFileSync(path.resolve('docs/knowledge/generated/WarehouseInventoryWorkbook.items.json'), JSON.stringify(itemRecords, null, 2))

console.log(`Analyzed workbook ${analysis.workbook} with ${analysis.sheets.length} sheets.`)
