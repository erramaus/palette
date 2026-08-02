import { useEffect, useMemo, useState } from 'react'
import {
  buildPrintLayoutDocument,
  generatePrintTableLayout,
  SAMPLE_HEIGHT_IN,
  SAMPLE_WIDTH_IN,
  SAMPLE_SPACING_IN,
  TABLE_DEPTH_IN,
  TABLE_WIDTH_IN,
  type PrintOrientation,
  type PrintPaintingInput,
} from '../../../services/tools/printTableOptimizer/layoutEngine'

interface EntryDraft {
  name: string
  widthRaw: string
  heightRaw: string
  orientation: PrintOrientation | ''
}

interface EntryErrors {
  width?: string
  height?: string
  orientation?: string
}

interface OrderPainting {
  id: string
  referenceNumber: string
  optionalName: string
  widthIn: number
  heightIn: number
  orientation: PrintOrientation
  colorHex: string
}

type BottomTab = 'COORDINATES' | 'PLACEMENT_LIST' | 'WARNINGS' | 'NOTES' | 'EXPORT'

const PAINT_COLORS = ['#8ec5ff', '#f9b67a', '#b7e3a1', '#d7b6ff', '#ffd0a8', '#8edfd5', '#f4a7bd']

const createDefaultDraft = (): EntryDraft => ({
  name: '',
  widthRaw: '',
  heightRaw: '',
  orientation: '',
})

const sampleClearanceHeight = SAMPLE_HEIGHT_IN + SAMPLE_SPACING_IN
const tableWidthMm = Math.round(TABLE_WIDTH_IN * 25.4)
const tableDepthMm = Math.round(TABLE_DEPTH_IN * 25.4)

const parseDimension = (raw: string): number | null => {
  const normalized = raw.trim()
  if (!normalized) {
    return null
  }
  if (!/^[0-9]*\.?[0-9]+$/.test(normalized)) {
    return Number.NaN
  }
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return Number.NaN
  }
  return parsed
}

const toDisplayLabel = (painting: OrderPainting): string =>
  painting.optionalName.trim() || painting.referenceNumber

const toPrintInput = (painting: OrderPainting): PrintPaintingInput => ({
  id: painting.id,
  label: toDisplayLabel(painting),
  widthIn: painting.widthIn,
  heightIn: painting.heightIn,
  orientation: painting.orientation,
  quantity: 1,
})

const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) {
    return list
  }
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

const formatInches = (value: number): string => `${Math.round(value * 100) / 100} in`

const PrintTableOptimizerModule = () => {
  const [paintings, setPaintings] = useState<OrderPainting[]>([])
  const [draft, setDraft] = useState<EntryDraft>(createDefaultDraft)
  const [activeTableNumber, setActiveTableNumber] = useState(1)
  const [editingPaintingId, setEditingPaintingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<EntryDraft | null>(null)
  const [entryErrors, setEntryErrors] = useState<EntryErrors>({})
  const [collapsedIntegration, setCollapsedIntegration] = useState(true)
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('COORDINATES')
  const [bottomTabCollapsed, setBottomTabCollapsed] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const [generatedOutput, setGeneratedOutput] = useState<string>('')
  const [referenceCounter, setReferenceCounter] = useState(1)
  const [printSequence, setPrintSequence] = useState(0)

  const layoutInputs = useMemo(() => paintings.map((painting) => toPrintInput(painting)), [paintings])
  const layout = useMemo(() => generatePrintTableLayout(layoutInputs), [layoutInputs])

  const tableCount = layout.tables.length
  const activeTable = layout.tables.find((table) => table.tableNumber === activeTableNumber) ?? null
  const totalCapacityArea = tableCount * TABLE_WIDTH_IN * TABLE_DEPTH_IN
  const totalUsedArea = paintings.reduce((sum, painting) => sum + painting.widthIn * painting.heightIn, 0)
  const totalSampleArea = tableCount * SAMPLE_WIDTH_IN * SAMPLE_HEIGHT_IN
  const unusedArea = Math.max(0, totalCapacityArea - totalUsedArea - totalSampleArea)
  const wastePercent = totalCapacityArea > 0 ? (unusedArea / totalCapacityArea) * 100 : 0
  const estimatedPrintMinutes = paintings.length * 2.8 + tableCount * 1.5

  const mmXAxisTicks = useMemo(() => {
    const values: number[] = []
    for (let index = 0; index <= tableWidthMm; index += 250) {
      values.push(index)
    }
    if (values[values.length - 1] !== tableWidthMm) {
      values.push(tableWidthMm)
    }
    return values
  }, [])

  const mmYAxisTicks = useMemo(() => {
    const values: number[] = []
    for (let index = 0; index <= tableDepthMm; index += 200) {
      values.push(index)
    }
    if (values[values.length - 1] !== tableDepthMm) {
      values.push(tableDepthMm)
    }
    return values
  }, [])

  useEffect(() => {
    if (tableCount === 0) {
      setActiveTableNumber(1)
      return
    }
    if (!layout.tables.some((table) => table.tableNumber === activeTableNumber)) {
      setActiveTableNumber(layout.tables[0].tableNumber)
    }
  }, [activeTableNumber, layout.tables, tableCount])

  useEffect(() => {
    if (printSequence === 0) {
      return
    }
    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        window.print()
      })
      return () => window.cancelAnimationFrame(secondFrame)
    })
    return () => window.cancelAnimationFrame(firstFrame)
  }, [printSequence])

  const addPainting = () => {
    const nextErrors: EntryErrors = {}
    const parsedWidth = parseDimension(draft.widthRaw)
    const parsedHeight = parseDimension(draft.heightRaw)

    if (draft.widthRaw.trim().length === 0) {
      nextErrors.width = 'Width is required.'
    } else if (Number.isNaN(parsedWidth)) {
      nextErrors.width = 'Enter a valid width.'
    } else if ((parsedWidth ?? 0) <= 0) {
      nextErrors.width = 'Width must be greater than 0.'
    }

    if (draft.heightRaw.trim().length === 0) {
      nextErrors.height = 'Height is required.'
    } else if (Number.isNaN(parsedHeight)) {
      nextErrors.height = 'Enter a valid height.'
    } else if ((parsedHeight ?? 0) <= 0) {
      nextErrors.height = 'Height must be greater than 0.'
    }

    if (!draft.orientation) {
      nextErrors.orientation = 'Select VERT or HORI.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setEntryErrors(nextErrors)
      setFeedback('Fix the highlighted fields.')
      return
    }

    const normalizedWidth = Number((parsedWidth ?? 0).toString())
    const normalizedHeight = Number((parsedHeight ?? 0).toString())

    const normalizedOrientation = draft.orientation as PrintOrientation

    const painting: OrderPainting = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      referenceNumber: `#${String(referenceCounter).padStart(2, '0')}`,
      optionalName: draft.name.trim(),
      widthIn: Math.round(normalizedWidth * 100) / 100,
      heightIn: Math.round(normalizedHeight * 100) / 100,
      orientation: normalizedOrientation,
      colorHex: PAINT_COLORS[(referenceCounter - 1) % PAINT_COLORS.length],
    }

    setPaintings((current) => [...current, painting])
    setDraft(createDefaultDraft())
    setEntryErrors({})
    setReferenceCounter((current) => current + 1)
    setGeneratedOutput('')
    setFeedback('Layout updated.')
  }

  const removePainting = (id: string): void => {
    setPaintings((current) => current.filter((item) => item.id !== id))
    if (editingPaintingId === id) {
      setEditingPaintingId(null)
      setEditingDraft(null)
    }
    setGeneratedOutput('')
    setFeedback('Layout updated.')
  }

  const duplicatePainting = (id: string): void => {
    const nextReference = referenceCounter
    setPaintings((current) => {
      const target = current.find((item) => item.id === id)
      if (!target) {
        return current
      }
      const duplicate: OrderPainting = {
        ...target,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        referenceNumber: `#${String(nextReference).padStart(2, '0')}`,
        colorHex: PAINT_COLORS[(nextReference - 1) % PAINT_COLORS.length],
      }
      return [...current, duplicate]
    })
    setReferenceCounter((current) => current + 1)
    setFeedback('Painting duplicated. Layout updated.')
    setGeneratedOutput('')
  }

  const movePainting = (index: number, direction: -1 | 1): void => {
    setPaintings((current) => moveItem(current, index, index + direction))
    setFeedback('Order updated. Layout updated.')
  }

  const clearAll = () => {
    setPaintings([])
    setDraft(createDefaultDraft())
    setEntryErrors({})
    setEditingPaintingId(null)
    setEditingDraft(null)
    setActiveTableNumber(1)
    setGeneratedOutput('')
    setFeedback('Layout cleared.')
  }

  const handleGenerateLayoutPdf = () => {
    if (paintings.length === 0) {
      setFeedback('Add at least one painting before generating a layout.')
      return
    }
    setGeneratedOutput(buildPrintLayoutDocument(layout))
    setActiveBottomTab('EXPORT')
    setBottomTabCollapsed(false)
    setPrintSequence((current) => current + 1)
    setFeedback('Packing complete. Print layout opened.')
  }

  const saveEditedPainting = (id: string, nextDraft: EntryDraft): void => {
    const parsedWidth = parseDimension(nextDraft.widthRaw)
    const parsedHeight = parseDimension(nextDraft.heightRaw)
    if (!nextDraft.orientation || parsedWidth === null || parsedHeight === null || Number.isNaN(parsedWidth) || Number.isNaN(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
      setFeedback('Edited rows require valid width, height, and orientation.')
      return
    }
    const normalizedOrientation = nextDraft.orientation as PrintOrientation
    setPaintings((current) =>
      current.map((painting) =>
        painting.id === id
          ? {
              ...painting,
              optionalName: nextDraft.name.trim(),
              widthIn: Math.round(Number(parsedWidth.toString()) * 100) / 100,
              heightIn: Math.round(Number(parsedHeight.toString()) * 100) / 100,
              orientation: normalizedOrientation,
            }
          : painting,
      ),
    )
    setEditingPaintingId(null)
    setEditingDraft(null)
    setGeneratedOutput('')
    setFeedback('Painting updated. Layout updated.')
  }

  const mockErpAction = (label: string): void => {
    setFeedback(`${label}: Coming soon.`)
  }

  const activeTabLabel = {
    COORDINATES: 'Coordinates',
    PLACEMENT_LIST: 'Placement List',
    WARNINGS: 'Warnings',
    NOTES: 'Optimization Notes',
    EXPORT: 'Export',
  }[activeBottomTab]

  const statusMessage = paintings.length === 0
    ? 'Ready'
    : layout.unplaced.length === 0
      ? 'Packing complete'
      : 'Layout updated with warnings'

  const statusSummary = `Tables ${tableCount} | Waste ${wastePercent.toFixed(1)}%`

  const toEditingDraft = (painting: OrderPainting): EntryDraft => ({
    name: painting.optionalName,
    widthRaw: String(painting.widthIn),
    heightRaw: String(painting.heightIn),
    orientation: painting.orientation,
  })

  const referenceById = new Map(paintings.map((painting) => [painting.id, painting]))

  const renderOrderRow = (painting: OrderPainting, index: number) => {
    const isEditing = editingPaintingId === painting.id
    const rowDraft = editingDraft ?? toEditingDraft(painting)

    return (
      <li key={painting.id} className="pto-order-row">
        <div className="pto-order-head">
          <span className="pto-color-dot" style={{ background: painting.colorHex }} aria-hidden="true" />
          <strong>{painting.referenceNumber}</strong>
          <span className="subtle">{painting.optionalName || 'No name'}</span>
        </div>
        {isEditing ? (
          <div className="pto-order-edit-grid">
            <label>
              Name
              <input
                type="text"
                value={rowDraft.name}
                onChange={(event) =>
                  setEditingDraft((current) => ({ ...(current ?? toEditingDraft(painting)), name: event.target.value }))
                }
              />
            </label>
            <label>
              Width
              <input
                type="text"
                inputMode="decimal"
                value={rowDraft.widthRaw}
                onChange={(event) =>
                  setEditingDraft((current) => ({ ...(current ?? toEditingDraft(painting)), widthRaw: event.target.value }))
                }
              />
            </label>
            <label>
              Height
              <input
                type="text"
                inputMode="decimal"
                value={rowDraft.heightRaw}
                onChange={(event) =>
                  setEditingDraft((current) => ({ ...(current ?? toEditingDraft(painting)), heightRaw: event.target.value }))
                }
              />
            </label>
            <div className="pto-orientation-toggle">
              <button
                type="button"
                className={rowDraft.orientation === 'VERT' ? 'btn btn-primary pto-orientation-btn' : 'btn pto-orientation-btn'}
                onClick={() =>
                  setEditingDraft((current) => ({ ...(current ?? toEditingDraft(painting)), orientation: 'VERT' }))
                }
              >
                VERT
              </button>
              <button
                type="button"
                className={rowDraft.orientation === 'HORI' ? 'btn btn-primary pto-orientation-btn' : 'btn pto-orientation-btn'}
                onClick={() =>
                  setEditingDraft((current) => ({ ...(current ?? toEditingDraft(painting)), orientation: 'HORI' }))
                }
              >
                HORI
              </button>
            </div>
            <div className="pto-order-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const parsedWidth = parseDimension(rowDraft.widthRaw)
                  const parsedHeight = parseDimension(rowDraft.heightRaw)
                  if (!rowDraft.orientation || parsedWidth === null || parsedHeight === null || Number.isNaN(parsedWidth) || Number.isNaN(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
                    setFeedback('Edited rows require valid width, height, and orientation.')
                    return
                  }
                  saveEditedPainting(painting.id, {
                    name: rowDraft.name,
                    widthRaw: String(Number(parsedWidth.toString())),
                    heightRaw: String(Number(parsedHeight.toString())),
                    orientation: rowDraft.orientation,
                  })
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingPaintingId(null)
                  setEditingDraft(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="subtle">
              {formatInches(painting.widthIn)} x {formatInches(painting.heightIn)} • {painting.orientation}
            </p>
            <div className="pto-order-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingPaintingId(painting.id)
                  setEditingDraft(toEditingDraft(painting))
                }}
              >
                Edit
              </button>
              <button type="button" className="btn" onClick={() => duplicatePainting(painting.id)}>
                Duplicate
              </button>
              <button type="button" className="btn" onClick={() => removePainting(painting.id)}>
                Delete
              </button>
              <button type="button" className="btn" disabled={index === 0} onClick={() => movePainting(index, -1)}>
                Up
              </button>
              <button
                type="button"
                className="btn"
                disabled={index === paintings.length - 1}
                onClick={() => movePainting(index, 1)}
              >
                Down
              </button>
            </div>
          </>
        )}
      </li>
    )
  }

  return (
    <section className="pto-module">
      <div className="pto-status-bar" role="status" aria-live="polite">
        <span>{statusMessage}</span>
        <span>Layout Updated</span>
        <span>{statusSummary}</span>
      </div>

      <div className="pto-grid pto-grid-production">
        <aside className="panel pto-controls pto-left-panel">
          <section className="pto-entry-section">
            <h3>Painting Entry</h3>
            <div className="form-grid pto-form-grid">
              <label>
                Name
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Optional name"
                />
              </label>

              <label>
                Width
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Width"
                  value={draft.widthRaw}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, widthRaw: event.target.value }))
                    setEntryErrors((current) => ({ ...current, width: undefined }))
                  }}
                />
                {entryErrors.width ? <small className="pto-inline-error">{entryErrors.width}</small> : null}
              </label>

              <label>
                Height
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Height"
                  value={draft.heightRaw}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, heightRaw: event.target.value }))
                    setEntryErrors((current) => ({ ...current, height: undefined }))
                  }}
                />
                {entryErrors.height ? <small className="pto-inline-error">{entryErrors.height}</small> : null}
              </label>
            </div>

            <div className="pto-orientation-toggle">
              <button
                type="button"
                className={draft.orientation === 'VERT' ? 'btn btn-primary pto-orientation-btn' : 'btn pto-orientation-btn'}
                onClick={() => {
                  setDraft((current) => ({ ...current, orientation: 'VERT' }))
                  setEntryErrors((current) => ({ ...current, orientation: undefined }))
                }}
              >
                VERT
              </button>
              <button
                type="button"
                className={draft.orientation === 'HORI' ? 'btn btn-primary pto-orientation-btn' : 'btn pto-orientation-btn'}
                onClick={() => {
                  setDraft((current) => ({ ...current, orientation: 'HORI' }))
                  setEntryErrors((current) => ({ ...current, orientation: undefined }))
                }}
              >
                HORI
              </button>
            </div>
            {entryErrors.orientation ? <small className="pto-inline-error">{entryErrors.orientation}</small> : null}

            <div className="button-row pto-action-row pto-large-actions">
              <button type="button" className="btn" onClick={addPainting}>
                Add Painting
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateLayoutPdf}
              >
                Generate Layout PDF
              </button>
              <button type="button" className="btn" onClick={clearAll}>
                Clear Layout
              </button>
            </div>

            {feedback ? (
              <p className="subtle pto-feedback" role="status" aria-live="polite">
                {feedback}
              </p>
            ) : null}
          </section>

          <section className="pto-current-order-section">
            <div className="work-item-section-header">
              <h4>Current Order</h4>
              <span className="subtle">{paintings.length} painting(s)</span>
            </div>
            {paintings.length === 0 ? (
              <p className="subtle">No paintings in the order.</p>
            ) : (
              <ul className="pto-order-list">
                {paintings.map((painting, index) => renderOrderRow(painting, index))}
              </ul>
            )}
          </section>

          <section className="pto-integration-section panel">
            <button
              type="button"
              className="pto-collapse-toggle"
              aria-expanded={!collapsedIntegration}
              onClick={() => setCollapsedIntegration((current) => !current)}
            >
              Production Integration
              <span>{collapsedIntegration ? 'Show' : 'Hide'}</span>
            </button>
            {!collapsedIntegration ? (
              <div className="pto-erp-actions">
                <button type="button" className="btn" onClick={() => mockErpAction('Import Today\'s Print Queue')}>
                  Import Today&apos;s Print Queue
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Import Selected Orders')}>
                  Import Selected Orders
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Import From Workshop List')}>
                  Import From Workshop List
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Save Layout')}>
                  Save Layout
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Attach Layout To Production Batch')}>
                  Attach Layout To Production Batch
                </button>
                <button type="button" className="btn" onClick={handleGenerateLayoutPdf}>
                  Export PDF
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setGeneratedOutput(buildPrintLayoutDocument(layout))
                    setActiveBottomTab('EXPORT')
                    setBottomTabCollapsed(false)
                    setFeedback('Coordinates export prepared.')
                  }}
                >
                  Export Coordinates
                </button>
                <button type="button" className="btn" onClick={clearAll}>
                  Clear Layout
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Import Print Queue')}>
                  Import Print Queue
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Save to Batch')}>
                  Save to Batch
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Attach to Work Items')}>
                  Attach to Work Items
                </button>
                <button type="button" className="btn" onClick={() => mockErpAction('Create Print Batch')}>
                  Create Print Batch
                </button>
              </div>
            ) : null}
          </section>
        </aside>

        <section className="pto-results pto-right-panel">
          <article className="panel pto-stat-strip">
            <span>Tables Used: {tableCount}</span>
            <span>Paintings: {paintings.length}</span>
            <span>Waste %: {wastePercent.toFixed(1)}%</span>
            <span>Unused Area: {Math.round(unusedArea)} in²</span>
            <span>Estimated Print Time: {estimatedPrintMinutes.toFixed(1)} min</span>
          </article>

          <article className="panel pto-table-stage">
            <div className="pto-table-tabs" role="tablist" aria-label="Table tabs">
              {(layout.tables.length > 0 ? layout.tables : [{ tableNumber: 1, placements: [] }]).map((table) => (
                <button
                  key={table.tableNumber}
                  type="button"
                  role="tab"
                  aria-selected={table.tableNumber === activeTableNumber}
                  className={table.tableNumber === activeTableNumber ? 'pto-tab pto-tab-active' : 'pto-tab'}
                  onClick={() => setActiveTableNumber(table.tableNumber)}
                >
                  Table {table.tableNumber}
                </button>
              ))}
            </div>

            <div className="pto-table-scroll">
              <div className="pto-ruler-top" aria-hidden="true">
                {mmXAxisTicks.map((tick) => (
                  <span key={`x-${tick}`} style={{ right: `${(tick / tableWidthMm) * 100}%` }}>
                    {tick}
                  </span>
                ))}
              </div>
              <div className="pto-ruler-right" aria-hidden="true">
                {mmYAxisTicks.map((tick) => (
                  <span key={`y-${tick}`} style={{ bottom: `${(tick / tableDepthMm) * 100}%` }}>
                    {tick}
                  </span>
                ))}
              </div>

              <div className="pto-table-canvas">
                <div className="pto-table-sample" aria-label="Fixed sample piece">
                  <span>Sample 6 x 8</span>
                </div>
                <div
                  className="pto-sample-clearance"
                  style={{
                    width: `${((SAMPLE_WIDTH_IN + SAMPLE_SPACING_IN) / TABLE_WIDTH_IN) * 100}%`,
                    height: `${(sampleClearanceHeight / TABLE_DEPTH_IN) * 100}%`,
                  }}
                  aria-hidden="true"
                />
                {(activeTable?.placements ?? []).map((placement) => {
                  const source = referenceById.get(placement.paintingId)
                  const lineOne = source?.optionalName.trim() ? source.optionalName : (source?.referenceNumber ?? placement.label)
                  return (
                    <div
                      key={`${placement.paintingId}-${placement.label}-${placement.xIn}-${placement.yIn}`}
                      className="pto-piece"
                      style={{
                        width: `${(placement.widthIn / TABLE_WIDTH_IN) * 100}%`,
                        height: `${(placement.heightIn / TABLE_DEPTH_IN) * 100}%`,
                        right: `${(placement.xIn / TABLE_WIDTH_IN) * 100}%`,
                        bottom: `${(placement.yIn / TABLE_DEPTH_IN) * 100}%`,
                        background: source ? `${source.colorHex}cc` : undefined,
                      }}
                      title={`${placement.label} (${placement.xMm}, ${placement.yMm}) mm`}
                    >
                      <span>{lineOne}</span>
                      <small>{placement.widthIn} × {placement.heightIn} in</small>
                      <small>{placement.orientation}</small>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="subtle pto-origin-note">
              Front-right origin. Table size {TABLE_WIDTH_IN} x {TABLE_DEPTH_IN} inches ({tableWidthMm} x {tableDepthMm} mm).
            </p>
          </article>

          <article className="panel pto-bottom-panel">
            <div className="pto-bottom-header">
              <div className="pto-bottom-tabs" role="tablist" aria-label="Bottom panel tabs">
                {([
                  ['COORDINATES', 'Coordinates'],
                  ['PLACEMENT_LIST', 'Placement List'],
                  ['WARNINGS', 'Warnings'],
                  ['NOTES', 'Optimization Notes'],
                  ['EXPORT', 'Export'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activeBottomTab === key}
                    className={activeBottomTab === key ? 'pto-tab pto-tab-active' : 'pto-tab'}
                    onClick={() => {
                      setActiveBottomTab(key)
                      setBottomTabCollapsed(false)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setBottomTabCollapsed((current) => !current)}
              >
                {bottomTabCollapsed ? `Show ${activeTabLabel}` : `Hide ${activeTabLabel}`}
              </button>
            </div>

            {!bottomTabCollapsed ? (
              <div className="pto-bottom-content">
                {activeBottomTab === 'COORDINATES' ? (
                  <div className="table-wrap">
                    <table className="workshop-table">
                      <thead>
                        <tr>
                          <th>Painting</th>
                          <th>Table</th>
                          <th>X (mm)</th>
                          <th>Y (mm)</th>
                          <th>Width (mm)</th>
                          <th>Height (mm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeTable?.placements ?? []).map((placement) => (
                          <tr key={`${placement.paintingId}-${placement.xMm}-${placement.yMm}`}>
                            <td>{referenceById.get(placement.paintingId)?.optionalName.trim() || referenceById.get(placement.paintingId)?.referenceNumber || placement.label}</td>
                            <td>{placement.tableNumber}</td>
                            <td>{placement.xMm}</td>
                            <td>{placement.yMm}</td>
                            <td>{placement.widthMm}</td>
                            <td>{placement.heightMm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {activeBottomTab === 'PLACEMENT_LIST' ? (
                  <ul className="plain-list">
                    {layout.tables.flatMap((table) =>
                      table.placements.map((placement) => (
                        <li key={`${table.tableNumber}-${placement.paintingId}-${placement.xMm}-${placement.yMm}`}>
                          <div>
                            <strong>{referenceById.get(placement.paintingId)?.optionalName.trim() || referenceById.get(placement.paintingId)?.referenceNumber || placement.label}</strong>
                            <p>
                              Table {table.tableNumber} • {placement.orientation} • {placement.widthIn} x {placement.heightIn} in
                            </p>
                          </div>
                          <span className="subtle">({placement.xMm}, {placement.yMm}) mm</span>
                        </li>
                      )),
                    )}
                  </ul>
                ) : null}

                {activeBottomTab === 'WARNINGS' ? (
                  layout.unplaced.length > 0 ? (
                    <ul className="plain-list">
                      {layout.unplaced.map((warning) => (
                        <li key={`${warning.paintingId}-${warning.label}`}>
                          <div>
                            <strong>{warning.label}</strong>
                            <p>{warning.reason}</p>
                          </div>
                          <span className="subtle">Unplaced</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="subtle">No warnings. Packing completed under current constraints.</p>
                  )
                ) : null}

                {activeBottomTab === 'NOTES' ? (
                  <ul className="plain-list">
                    <li>
                      <div>
                        <strong>Alignment</strong>
                        <p>Pieces hug the front and right fences while preserving required spacing.</p>
                      </div>
                    </li>
                    <li>
                      <div>
                        <strong>Orientation</strong>
                        <p>Orientation remains fixed per piece (VERT/HORI), matching production input.</p>
                      </div>
                    </li>
                    <li>
                      <div>
                        <strong>Coordinates</strong>
                        <p>All coordinates are shown in whole-number millimeters for print-floor use.</p>
                      </div>
                    </li>
                  </ul>
                ) : null}

                {activeBottomTab === 'EXPORT' ? (
                  <div className="pto-output-panel">
                    <div className="button-row">
                      <button type="button" className="btn btn-primary" onClick={handleGenerateLayoutPdf}>
                        Generate Layout PDF
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setGeneratedOutput(buildPrintLayoutDocument(layout))
                          setFeedback('Coordinates export prepared.')
                        }}
                      >
                        Export Coordinates
                      </button>
                    </div>
                    {generatedOutput ? <pre>{generatedOutput}</pre> : <p className="subtle">No export generated yet.</p>}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        </section>
      </div>

      <section className="pto-print-layout" aria-hidden="true">
        {layout.tables.map((table) => (
          <article key={`print-${table.tableNumber}`} className="pto-print-page">
            <h2>Print Table Layout - Table {table.tableNumber}</h2>
            <div className="pto-print-canvas-wrap">
              <div className="pto-print-canvas">
                <div className="pto-table-sample">
                  <span>Sample 6 x 8</span>
                </div>
                {table.placements.map((placement) => {
                  const source = referenceById.get(placement.paintingId)
                  const lineOne = source?.optionalName.trim() ? source.optionalName : (source?.referenceNumber ?? placement.label)
                  return (
                    <div
                      key={`print-piece-${placement.paintingId}-${placement.xMm}-${placement.yMm}`}
                      className="pto-piece"
                      style={{
                        width: `${(placement.widthIn / TABLE_WIDTH_IN) * 100}%`,
                        height: `${(placement.heightIn / TABLE_DEPTH_IN) * 100}%`,
                        right: `${(placement.xIn / TABLE_WIDTH_IN) * 100}%`,
                        bottom: `${(placement.yIn / TABLE_DEPTH_IN) * 100}%`,
                        background: source ? `${source.colorHex}cc` : undefined,
                      }}
                    >
                      <span>{lineOne}</span>
                      <small>{placement.widthIn} × {placement.heightIn} in</small>
                      <small>{placement.orientation}</small>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="table-wrap">
              <table className="workshop-table">
                <thead>
                  <tr>
                    <th>Painting</th>
                    <th>W</th>
                    <th>H</th>
                    <th>Orientation</th>
                    <th>X (mm)</th>
                    <th>Y (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {table.placements.map((placement) => {
                    const source = referenceById.get(placement.paintingId)
                    const label = source?.optionalName.trim() ? source.optionalName : (source?.referenceNumber ?? placement.label)
                    return (
                      <tr key={`print-row-${placement.paintingId}-${placement.xMm}-${placement.yMm}`}>
                        <td>{label}</td>
                        <td>{placement.widthMm}</td>
                        <td>{placement.heightMm}</td>
                        <td>{placement.orientation}</td>
                        <td>{placement.xMm}</td>
                        <td>{placement.yMm}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}

export default PrintTableOptimizerModule