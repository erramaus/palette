import { useMemo, useState } from 'react'
import {
  buildPrintLayoutDocument,
  generatePrintTableLayout,
  PIECE_SPACING_IN,
  SAMPLE_HEIGHT_IN,
  SAMPLE_SPACING_IN,
  SAMPLE_WIDTH_IN,
  TABLE_DEPTH_IN,
  TABLE_WIDTH_IN,
  type PrintOrientation,
  type PrintPaintingInput,
} from '../../../services/tools/printTableOptimizer/layoutEngine'

interface PaintingDraft {
  label: string
  widthIn: number
  heightIn: number
  orientation: PrintOrientation
  quantity: number
}

const createDefaultDraft = (): PaintingDraft => ({
  label: '',
  widthIn: 16,
  heightIn: 20,
  orientation: 'VERT',
  quantity: 1,
})

const sampleClearanceHeight = SAMPLE_HEIGHT_IN + SAMPLE_SPACING_IN

const PrintTableOptimizerModule = () => {
  const [paintings, setPaintings] = useState<PrintPaintingInput[]>([])
  const [draft, setDraft] = useState<PaintingDraft>(createDefaultDraft)
  const [feedback, setFeedback] = useState<string>('')
  const [generatedOutput, setGeneratedOutput] = useState<string>('')

  const layout = useMemo(() => generatePrintTableLayout(paintings), [paintings])

  const addPainting = () => {
    const label = draft.label.trim()
    if (!label) {
      setFeedback('Painting name is required.')
      return
    }

    if (draft.widthIn <= 0 || draft.heightIn <= 0) {
      setFeedback('Width and height must be greater than zero.')
      return
    }

    if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
      setFeedback('Quantity must be at least 1.')
      return
    }

    const painting: PrintPaintingInput = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      widthIn: Math.round(draft.widthIn * 100) / 100,
      heightIn: Math.round(draft.heightIn * 100) / 100,
      orientation: draft.orientation,
      quantity: Math.floor(draft.quantity),
    }

    setPaintings((current) => [...current, painting])
    setDraft((current) => ({ ...createDefaultDraft(), orientation: current.orientation }))
    setGeneratedOutput('')
    setFeedback('Painting added. Layout refreshed automatically.')
  }

  const removePainting = (id: string) => {
    setPaintings((current) => current.filter((item) => item.id !== id))
    setGeneratedOutput('')
  }

  const clearAll = () => {
    setPaintings([])
    setGeneratedOutput('')
    setFeedback('All paintings cleared.')
  }

  const handleGenerateLayout = () => {
    setGeneratedOutput(buildPrintLayoutDocument(layout))
    setFeedback('Layout document generated for print/PDF handoff.')
  }

  return (
    <section className="pto-module">
      <div className="pto-grid">
        <aside className="panel pto-controls">
          <h3>Add Paintings</h3>
          <p className="subtle">Live auto-layout is active while you add paintings.</p>
          <div className="form-grid pto-form-grid">
            <label>
              Painting name
              <input
                type="text"
                value={draft.label}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                placeholder="Sunset Triptych"
              />
            </label>

            <label>
              Width (in)
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={draft.widthIn}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, widthIn: Number(event.target.value) }))
                }
              />
            </label>

            <label>
              Height (in)
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={draft.heightIn}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, heightIn: Number(event.target.value) }))
                }
              />
            </label>

            <label>
              Orientation
              <select
                value={draft.orientation}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, orientation: event.target.value as PrintOrientation }))
                }
              >
                <option value="VERT">VERT</option>
                <option value="HORI">HORI</option>
              </select>
            </label>

            <label>
              Quantity
              <input
                type="number"
                min={1}
                step={1}
                value={draft.quantity}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, quantity: Number(event.target.value) }))
                }
              />
            </label>
          </div>

          <div className="button-row pto-action-row">
            <button type="button" className="btn btn-primary" onClick={addPainting}>
              Add Painting
            </button>
            <button type="button" className="btn" onClick={clearAll}>
              Clear
            </button>
            <button
              type="button"
              className="btn"
              disabled={layout.placedUnits === 0}
              onClick={handleGenerateLayout}
            >
              Generate Layout
            </button>
          </div>

          {feedback ? (
            <p className="subtle pto-feedback" role="status" aria-live="polite">
              {feedback}
            </p>
          ) : null}

          <h4>Queue</h4>
          {paintings.length === 0 ? (
            <p className="subtle">No paintings queued.</p>
          ) : (
            <ul className="plain-list pto-queue-list">
              {paintings.map((painting) => (
                <li key={painting.id}>
                  <div>
                    <strong>{painting.label}</strong>
                    <p>
                      {painting.widthIn} x {painting.heightIn} in • {painting.orientation} • qty {painting.quantity}
                    </p>
                  </div>
                  <button type="button" className="btn" onClick={() => removePainting(painting.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="pto-results">
          <article className="panel pto-summary-panel">
            <h3>Layout Summary</h3>
            <div className="summary-grid pto-summary-grid">
              <article className="summary-card">
                <p>Tables Used</p>
                <h3>{layout.tables.length}</h3>
              </article>
              <article className="summary-card">
                <p>Units Placed</p>
                <h3>{layout.placedUnits}</h3>
              </article>
              <article className="summary-card">
                <p>Units Unplaced</p>
                <h3>{layout.unplaced.length}</h3>
              </article>
            </div>
            <p className="subtle">
              Rules: {TABLE_WIDTH_IN} x {TABLE_DEPTH_IN} in table, front-right origin, sample fixed at {SAMPLE_WIDTH_IN} x {SAMPLE_HEIGHT_IN} in, {PIECE_SPACING_IN}-inch spacing between paintings.
            </p>
          </article>

          {layout.unplaced.length > 0 ? (
            <article className="panel">
              <h4>Unplaced Units</h4>
              <ul className="plain-list">
                {layout.unplaced.map((item) => (
                  <li key={`${item.paintingId}-${item.label}`}>
                    <div>
                      <strong>{item.label}</strong>
                      <p>
                        {item.widthIn} x {item.heightIn} in • {item.orientation}
                      </p>
                    </div>
                    <span className="subtle">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {layout.tables.map((table) => (
            <article key={table.tableNumber} className="panel pto-table-panel">
              <h4>Table {table.tableNumber}</h4>
              <div className="pto-table-scroll">
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
                  {table.placements.map((placement) => (
                    <div
                      key={`${placement.paintingId}-${placement.label}-${placement.xIn}-${placement.yIn}`}
                      className="pto-piece"
                      style={{
                        width: `${(placement.widthIn / TABLE_WIDTH_IN) * 100}%`,
                        height: `${(placement.heightIn / TABLE_DEPTH_IN) * 100}%`,
                        right: `${(placement.xIn / TABLE_WIDTH_IN) * 100}%`,
                        bottom: `${(placement.yIn / TABLE_DEPTH_IN) * 100}%`,
                      }}
                      title={`${placement.label} (${placement.xMm}, ${placement.yMm}) mm`}
                    >
                      <span>{placement.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="table-wrap">
                <table className="workshop-table">
                  <thead>
                    <tr>
                      <th>Painting</th>
                      <th>Orientation</th>
                      <th>Size (in)</th>
                      <th>X (mm)</th>
                      <th>Y (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.placements.map((placement) => (
                      <tr key={`${placement.paintingId}-${placement.label}-coords`}>
                        <td>{placement.label}</td>
                        <td>{placement.orientation}</td>
                        <td>
                          {placement.widthIn} x {placement.heightIn}
                        </td>
                        <td>{placement.xMm}</td>
                        <td>{placement.yMm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}

          {generatedOutput ? (
            <article className="panel pto-output-panel">
              <h4>Generated Layout Output</h4>
              <pre>{generatedOutput}</pre>
            </article>
          ) : null}
        </section>
      </div>
    </section>
  )
}

export default PrintTableOptimizerModule