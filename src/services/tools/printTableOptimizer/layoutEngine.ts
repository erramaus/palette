export const TABLE_WIDTH_IN = 98
export const TABLE_DEPTH_IN = 80
export const SAMPLE_WIDTH_IN = 6
export const SAMPLE_HEIGHT_IN = 8
export const SAMPLE_SPACING_IN = 1
export const PIECE_SPACING_IN = 1

export type PrintOrientation = 'VERT' | 'HORI'

export interface PrintPaintingInput {
  id: string
  label: string
  widthIn: number
  heightIn: number
  orientation: PrintOrientation
  quantity: number
}

export interface PrintLayoutPlacement {
  tableNumber: number
  paintingId: string
  label: string
  orientation: PrintOrientation
  widthIn: number
  heightIn: number
  xIn: number
  yIn: number
  widthMm: number
  heightMm: number
  xMm: number
  yMm: number
}

export interface PrintLayoutTable {
  tableNumber: number
  placements: PrintLayoutPlacement[]
}

export interface PrintLayoutUnplaced {
  paintingId: string
  label: string
  orientation: PrintOrientation
  widthIn: number
  heightIn: number
  reason: string
}

export interface PrintLayoutResult {
  tables: PrintLayoutTable[]
  totalUnitsRequested: number
  placedUnits: number
  unplaced: PrintLayoutUnplaced[]
}

interface NormalizedUnit {
  paintingId: string
  label: string
  orientation: PrintOrientation
  widthIn: number
  heightIn: number
}

interface TableState {
  tableNumber: number
  placements: PrintLayoutPlacement[]
  cursorXIn: number
  cursorYIn: number
  rowHeightIn: number
}

const toMm = (inches: number): number => Math.round(inches * 25.4)

const rowIntersectsSampleClearance = (rowYIn: number, pieceHeightIn: number): boolean => {
  const rowStart = rowYIn
  const rowEnd = rowYIn + pieceHeightIn
  return rowStart < SAMPLE_HEIGHT_IN + SAMPLE_SPACING_IN && rowEnd > 0
}

const normalizeDimensions = (
  widthIn: number,
  heightIn: number,
  orientation: PrintOrientation,
): Pick<NormalizedUnit, 'widthIn' | 'heightIn'> => {
  const shortSide = Math.min(widthIn, heightIn)
  const longSide = Math.max(widthIn, heightIn)

  if (orientation === 'VERT') {
    return {
      widthIn: shortSide,
      heightIn: longSide,
    }
  }

  return {
    widthIn: longSide,
    heightIn: shortSide,
  }
}

const createTableState = (tableNumber: number): TableState => ({
  tableNumber,
  placements: [],
  cursorXIn: 0,
  cursorYIn: 0,
  rowHeightIn: 0,
})

const tryPlaceAtCursor = (table: TableState, unit: NormalizedUnit): PrintLayoutPlacement | null => {
  if (table.cursorYIn + unit.heightIn > TABLE_DEPTH_IN) {
    return null
  }

  let candidateX = table.cursorXIn
  if (rowIntersectsSampleClearance(table.cursorYIn, unit.heightIn)) {
    candidateX = Math.max(candidateX, SAMPLE_WIDTH_IN + SAMPLE_SPACING_IN)
  }

  if (candidateX + unit.widthIn > TABLE_WIDTH_IN) {
    return null
  }

  const placement: PrintLayoutPlacement = {
    tableNumber: table.tableNumber,
    paintingId: unit.paintingId,
    label: unit.label,
    orientation: unit.orientation,
    widthIn: unit.widthIn,
    heightIn: unit.heightIn,
    xIn: candidateX,
    yIn: table.cursorYIn,
    widthMm: toMm(unit.widthIn),
    heightMm: toMm(unit.heightIn),
    xMm: toMm(candidateX),
    yMm: toMm(table.cursorYIn),
  }

  table.placements.push(placement)
  table.cursorXIn = candidateX + unit.widthIn + PIECE_SPACING_IN
  table.rowHeightIn = Math.max(table.rowHeightIn, unit.heightIn)
  return placement
}

const placeOnTable = (table: TableState, unit: NormalizedUnit): PrintLayoutPlacement | null => {
  const sameRowPlacement = tryPlaceAtCursor(table, unit)
  if (sameRowPlacement) {
    return sameRowPlacement
  }

  if (table.rowHeightIn <= 0) {
    return null
  }

  table.cursorYIn += table.rowHeightIn + PIECE_SPACING_IN
  table.cursorXIn = 0
  table.rowHeightIn = 0

  return tryPlaceAtCursor(table, unit)
}

const expandUnits = (inputs: PrintPaintingInput[]): NormalizedUnit[] => {
  const expanded: NormalizedUnit[] = []

  inputs.forEach((input) => {
    const qty = Math.max(0, Math.floor(input.quantity))
    const dimensions = normalizeDimensions(input.widthIn, input.heightIn, input.orientation)

    for (let index = 0; index < qty; index += 1) {
      expanded.push({
        paintingId: input.id,
        label: qty > 1 ? `${input.label} #${index + 1}` : input.label,
        orientation: input.orientation,
        widthIn: dimensions.widthIn,
        heightIn: dimensions.heightIn,
      })
    }
  })

  return expanded
}

export const generatePrintTableLayout = (paintings: PrintPaintingInput[]): PrintLayoutResult => {
  const units = expandUnits(paintings)
  const tables: TableState[] = [createTableState(1)]
  const unplaced: PrintLayoutUnplaced[] = []

  units.forEach((unit) => {
    const currentTable = tables[tables.length - 1]
    const currentPlacement = placeOnTable(currentTable, unit)

    if (currentPlacement) {
      return
    }

    const nextTable = createTableState(tables.length + 1)
    const nextPlacement = placeOnTable(nextTable, unit)

    if (nextPlacement) {
      tables.push(nextTable)
      return
    }

    unplaced.push({
      paintingId: unit.paintingId,
      label: unit.label,
      orientation: unit.orientation,
      widthIn: unit.widthIn,
      heightIn: unit.heightIn,
      reason: 'Piece dimensions exceed usable area under current spacing constraints.',
    })
  })

  const resultTables: PrintLayoutTable[] = tables
    .filter((table) => table.placements.length > 0)
    .map((table) => ({
      tableNumber: table.tableNumber,
      placements: table.placements,
    }))

  const placedUnits = resultTables.reduce((sum, table) => sum + table.placements.length, 0)

  return {
    tables: resultTables,
    totalUnitsRequested: units.length,
    placedUnits,
    unplaced,
  }
}

export const buildPrintLayoutDocument = (result: PrintLayoutResult): string => {
  const lines: string[] = []

  lines.push('PALETTE PRINT TABLE OPTIMIZER LAYOUT')
  lines.push(`Table size: ${TABLE_WIDTH_IN} in x ${TABLE_DEPTH_IN} in`) 
  lines.push('Origin: Front-right (x, y in mm)')
  lines.push(`Sample: ${SAMPLE_WIDTH_IN} in x ${SAMPLE_HEIGHT_IN} in fixed at front-right`)
  lines.push(`Spacing: ${PIECE_SPACING_IN} in between paintings, ${SAMPLE_SPACING_IN} in from sample`)
  lines.push('')
  lines.push(`Units requested: ${result.totalUnitsRequested}`)
  lines.push(`Units placed: ${result.placedUnits}`)
  lines.push(`Units unplaced: ${result.unplaced.length}`)
  lines.push('')

  result.tables.forEach((table) => {
    lines.push(`Table ${table.tableNumber}`)
    lines.push('Label | Orientation | Size (in) | X mm | Y mm')
    table.placements.forEach((placement) => {
      lines.push(
        `${placement.label} | ${placement.orientation} | ${placement.widthIn} x ${placement.heightIn} | ${placement.xMm} | ${placement.yMm}`,
      )
    })
    lines.push('')
  })

  if (result.unplaced.length > 0) {
    lines.push('UNPLACED UNITS')
    result.unplaced.forEach((item) => {
      lines.push(`${item.label} (${item.widthIn} x ${item.heightIn} in, ${item.orientation}) - ${item.reason}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}