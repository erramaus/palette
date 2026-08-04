import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useAppState, type ImportProductionOrderInput } from '../state/AppStateContext'
import {
  type WebsiteOrderImportPreview,
  type WebsiteOrderImportRowPreview,
  WebsiteOrderExcelImportService,
} from '../services/WebsiteOrderExcelImportService'
import type { ThreeDOrderImportClassification } from '../types/threeDFilePreparation'
import {
  buildErrorReportCsv,
  canSelectPreviewRow,
  formatBytes,
  inferWorkbookExportDate,
  isAcceptedOrderWorkbookFile,
  isBlockingPreviewRow,
} from '../utils/ordersImportWorkspace'

interface ImportFormState {
  orderNumber: string
  customerName: string
  artworkTitle: string
  classification: ThreeDOrderImportClassification
  orderedWidth: number
  orderedHeight: number
  alignment: 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA'
  dueDate: string
  frameInfo: string
  notes: string
  scanDate: string
  existingFilesFound: boolean
  existingFilesCorrectSize: boolean
  colorFilePresent: boolean
  depthSlicesPresent: boolean
}

interface UploadedFileMeta {
  fileName: string
  fileSize: number
  uploadedAt: string
  exportDate: string | null
  worksheetNames: string[]
  rowCount: number
  parsingStatus: 'IDLE' | 'PARSING' | 'READY' | 'ERROR'
}

const workbookImportService = new WebsiteOrderExcelImportService()

const bucketOrder: Array<WebsiteOrderImportRowPreview['bucket']> = [
  'NEW_ORDERS',
  'CHANGED_ORDERS',
  'EXISTING_ORDERS',
  'NEEDS_REVIEW',
  'ERRORS',
  'SKIPPED_ROWS',
]

const bucketLabels: Record<WebsiteOrderImportRowPreview['bucket'], string> = {
  NEW_ORDERS: 'New Orders',
  CHANGED_ORDERS: 'Changed Orders',
  EXISTING_ORDERS: 'Existing Orders',
  NEEDS_REVIEW: 'Needs Review',
  ERRORS: 'Errors',
  SKIPPED_ROWS: 'Skipped Rows',
}

const today = new Date().toISOString().slice(0, 10)

const defaultFormState = (): ImportFormState => ({
  orderNumber: `WEB-${Date.now().toString().slice(-4)}`,
  customerName: '',
  artworkTitle: '',
  classification: 'THREE_D_TEXTURED_REPLICA',
  orderedWidth: 24,
  orderedHeight: 30,
  alignment: 'VERT',
  dueDate: today,
  frameInfo: 'Maple Float Frame',
  notes: '',
  scanDate: '',
  existingFilesFound: false,
  existingFilesCorrectSize: false,
  colorFilePresent: false,
  depthSlicesPresent: false,
})

const dateTime = (value: string | null): string => (value ? new Date(value).toLocaleString() : '--')

const OrdersPage = () => {
  const { productionJobs, threeDFilePreparations, employees, importProductionOrder, importWarehouseExcelOrders } = useAppState()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<WebsiteOrderImportPreview | null>(null)
  const [selectedSourceRecordIds, setSelectedSourceRecordIds] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadWarnings, setLoadWarnings] = useState<string[]>([])
  const [uploadedFileMeta, setUploadedFileMeta] = useState<UploadedFileMeta | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [includeNeedsReviewWithApproval, setIncludeNeedsReviewWithApproval] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState<ImportFormState>(() => defaultFormState())
  const [manualFormError, setManualFormError] = useState<string | null>(null)

  const directorId = useMemo(
    () => employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id ?? employees[0]?.id ?? 'system',
    [employees],
  )

  const existingLookup = useMemo(
    () => workbookImportService.getExistingLookup(workbookImportService.getExistingRecordsFromProductionJobs(productionJobs)),
    [productionJobs],
  )

  const groupedRows = useMemo(() => {
    const rowsByBucket = new Map<WebsiteOrderImportRowPreview['bucket'], WebsiteOrderImportRowPreview[]>()
    preview?.rows.forEach((row) => {
      const rows = rowsByBucket.get(row.bucket) ?? []
      rows.push(row)
      rowsByBucket.set(row.bucket, rows)
    })
    return rowsByBucket
  }, [preview])

  const selectedRows = useMemo(
    () => preview?.rows.filter((row) => selectedSourceRecordIds.includes(row.sourceRecordId)) ?? [],
    [preview, selectedSourceRecordIds],
  )

  const isThreeDClassification =
    manualForm.classification === 'THREE_D_PRINT' || manualForm.classification === 'THREE_D_TEXTURED_REPLICA'

  const recentImports = useMemo(
    () => productionJobs.slice(0, 10).map((job) => ({
      job,
      preparation: threeDFilePreparations.find((preparation) => preparation.productionJobId === job.id),
    })),
    [productionJobs, threeDFilePreparations],
  )

  const importStatusLabel = useMemo(() => {
    if (!uploadedFileMeta) return 'No workbook uploaded'
    if (uploadedFileMeta.parsingStatus === 'PARSING') return 'Parsing workbook'
    if (uploadedFileMeta.parsingStatus === 'ERROR') return 'Parsing failed'
    if (isImporting) return 'Importing approved rows'
    return 'Ready for approval'
  }, [uploadedFileMeta, isImporting])

  const canImportSelection = selectedRows.length > 0 && !isImporting

  useEffect(() => {
    if (!preview) {
      setSelectedSourceRecordIds([])
      return
    }

    const nextSelected = preview.rows
      .filter((row) => canSelectPreviewRow(row, includeNeedsReviewWithApproval))
      .map((row) => row.sourceRecordId)

    setSelectedSourceRecordIds(nextSelected)
  }, [preview, includeNeedsReviewWithApproval])

  const loadWorkbook = async (file: File): Promise<void> => {
    if (!isAcceptedOrderWorkbookFile(file.name)) {
      setLoadError('Unsupported file type. Accepted format: .xlsx')
      return
    }

    const uploadedAt = new Date().toISOString()
    setLoadError(null)
    setLoadWarnings([])
    setUploadedFileMeta({
      fileName: file.name,
      fileSize: file.size,
      uploadedAt,
      exportDate: null,
      worksheetNames: [],
      rowCount: 0,
      parsingStatus: 'PARSING',
    })

    try {
      const parsed = await workbookImportService.parseFile(file, uploadedAt)
      const builtPreview = workbookImportService.buildPreview(parsed, existingLookup)
      const worksheetNames = [...new Set(builtPreview.rows.map((row) => row.worksheetName))]

      setPreview(builtPreview)
      setLoadWarnings([...builtPreview.warnings, ...builtPreview.errors])
      setUploadedFileMeta({
        fileName: file.name,
        fileSize: file.size,
        uploadedAt,
        exportDate: inferWorkbookExportDate(file.name, worksheetNames),
        worksheetNames,
        rowCount: builtPreview.rows.length,
        parsingStatus: builtPreview.errors.length > 0 ? 'ERROR' : 'READY',
      })
    } catch (error) {
      setPreview(null)
      setSelectedSourceRecordIds([])
      setLoadError(error instanceof Error ? error.message : 'Unable to parse workbook.')
      setUploadedFileMeta((current) =>
        current
          ? {
              ...current,
              parsingStatus: 'ERROR',
            }
          : null,
      )
    }
  }

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return
    await loadWorkbook(file)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setIsDraggingOver(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await loadWorkbook(file)
  }

  const openFilePicker = (): void => {
    fileInputRef.current?.click()
  }

  const cancelUpload = (): void => {
    setPreview(null)
    setSelectedSourceRecordIds([])
    setUploadedFileMeta(null)
    setLoadError(null)
    setLoadWarnings([])
    setIncludeNeedsReviewWithApproval(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const importSelected = (onlyValidRows: boolean): void => {
    if (!preview) return

    const rowsToImport = preview.rows.filter((row) => {
      if (!selectedSourceRecordIds.includes(row.sourceRecordId)) {
        return false
      }

      if (isBlockingPreviewRow(row)) {
        return false
      }

      if (onlyValidRows) {
        return row.bucket === 'NEW_ORDERS' || row.bucket === 'CHANGED_ORDERS'
      }

      if (row.bucket === 'NEEDS_REVIEW') {
        return includeNeedsReviewWithApproval
      }

      return row.bucket === 'NEW_ORDERS' || row.bucket === 'CHANGED_ORDERS'
    })

    if (rowsToImport.length === 0) {
      setLoadError('No importable rows selected.')
      return
    }

    setIsImporting(true)
    try {
      importWarehouseExcelOrders({
        preview,
        selectedSourceRecordIds: rowsToImport.map((row) => row.sourceRecordId),
        importedByEmployeeId: directorId,
      })
      setLoadError(null)
      setSelectedSourceRecordIds([])
      setLoadWarnings((current) => [...current, 'Import completed. Reused source IDs were preserved.'])
    } finally {
      setIsImporting(false)
    }
  }

  const toggleRowSelection = (row: WebsiteOrderImportRowPreview, checked: boolean): void => {
    if (!canSelectPreviewRow(row, includeNeedsReviewWithApproval)) {
      return
    }

    setSelectedSourceRecordIds((current) =>
      checked
        ? [...new Set([...current, row.sourceRecordId])]
        : current.filter((id) => id !== row.sourceRecordId),
    )
  }

  const downloadErrorReport = (): void => {
    if (!preview) return
    const csv = buildErrorReportCsv(preview.rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `palette-import-errors-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const submitManualOrder = (): void => {
    if (!manualForm.customerName.trim() || !manualForm.artworkTitle.trim() || !manualForm.orderNumber.trim()) {
      setManualFormError('Order number, customer, and artwork are required.')
      return
    }

    const input: ImportProductionOrderInput = {
      orderNumber: manualForm.orderNumber.trim(),
      customerName: manualForm.customerName.trim(),
      artworkTitle: manualForm.artworkTitle.trim(),
      classification: manualForm.classification,
      orderedWidth: manualForm.orderedWidth,
      orderedHeight: manualForm.orderedHeight,
      alignment: manualForm.alignment,
      dueDate: manualForm.dueDate,
      frameInfo: manualForm.frameInfo,
      notes: manualForm.notes,
      scanDate: manualForm.scanDate || undefined,
      existingFilesFound: isThreeDClassification ? manualForm.existingFilesFound : undefined,
      existingFilesCorrectSize: isThreeDClassification ? manualForm.existingFilesCorrectSize : undefined,
      colorFilePresent: isThreeDClassification ? manualForm.colorFilePresent : undefined,
      depthSlicesPresent: isThreeDClassification ? manualForm.depthSlicesPresent : undefined,
    }

    importProductionOrder(input)
    setManualForm(defaultFormState())
    setManualFormError(null)
    setShowManualModal(false)
  }

  return (
    <section className="page import-center-page">
      <div className="page-heading">
        <h2>Orders</h2>
        <p>
          New Order Import workspace: upload warehouse Excel exports, preview validation groups,
          approve import, and push orders into the unified production pipeline.
        </p>
      </div>

      <section className="panel">
        <div className="work-item-section-header">
          <div>
            <h3>New Order Import</h3>
            <p className="subtle">Admin website -&gt; Export New Orders -&gt; Upload workbook -&gt; Director approval.</p>
          </div>
          <button type="button" className="btn" onClick={() => setShowManualModal(true)}>
            Add Order Manually
          </button>
        </div>

        <div
          className="panel"
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openFilePicker()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDraggingOver(true)
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          aria-label="Upload New Orders Excel"
          style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: isDraggingOver ? '#1e2a4a' : '#d4dbeb' }}
        >
          <h4>Upload New Orders Excel</h4>
          <p>{isDraggingOver ? 'Drop workbook to parse and preview.' : 'Drag and drop a .xlsx workbook or click to browse.'}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileSelection}
            style={{ display: 'none' }}
          />
          <div className="form-grid">
            <div>
              <strong>Selected file</strong>
              <p>{uploadedFileMeta?.fileName ?? '--'}</p>
            </div>
            <div>
              <strong>File size</strong>
              <p>{uploadedFileMeta ? formatBytes(uploadedFileMeta.fileSize) : '--'}</p>
            </div>
            <div>
              <strong>Export date</strong>
              <p>{uploadedFileMeta?.exportDate ?? '--'}</p>
            </div>
            <div>
              <strong>Upload timestamp</strong>
              <p>{dateTime(uploadedFileMeta?.uploadedAt ?? null)}</p>
            </div>
            <div>
              <strong>Rows detected</strong>
              <p>{uploadedFileMeta?.rowCount ?? 0}</p>
            </div>
            <div>
              <strong>Parsing status</strong>
              <p>{uploadedFileMeta?.parsingStatus ?? 'IDLE'}</p>
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <h4>Recent Imports</h4>
            <p>{productionJobs.filter((job) => job.orderSource === 'WAREHOUSE_EXCEL_EXPORT').length} imported via warehouse workbook</p>
          </div>
          <div>
            <h4>Import Status</h4>
            <p>{importStatusLabel}</p>
          </div>
          <div>
            <h4>Director Approver</h4>
            <p>{employees.find((employee) => employee.id === directorId)?.name ?? 'Production Director'}</p>
          </div>
        </div>

        <div className="button-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeNeedsReviewWithApproval}
              onChange={(event) => setIncludeNeedsReviewWithApproval(event.target.checked)}
            />
            Allow Needs Review rows with Director approval
          </label>
          <button type="button" className="btn btn-primary" disabled={!canImportSelection} onClick={() => importSelected(false)}>
            Import Selected
          </button>
          <button type="button" className="btn" disabled={isImporting || !preview} onClick={() => importSelected(true)}>
            Import All Valid
          </button>
          <button type="button" className="btn" disabled={isImporting || !preview} onClick={cancelUpload}>
            Cancel Upload
          </button>
          <button type="button" className="btn" disabled={!preview} onClick={downloadErrorReport}>
            Download Error Report
          </button>
        </div>

        {loadError ? <p className="warning">{loadError}</p> : null}
        {loadWarnings.length > 0 ? (
          <ul className="plain-list">
            {loadWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {preview ? (
        <>
          <section className="panel">
            <h3>Validation Summary</h3>
            <div className="form-grid">
              {bucketOrder.map((bucket) => (
                <div key={bucket}>
                  <strong>{bucketLabels[bucket]}</strong>
                  <p>{preview.summaries[bucket]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Preview Table</h3>
            {bucketOrder.map((bucket) => {
              const rows = groupedRows.get(bucket) ?? []
              if (rows.length === 0) return null

              return (
                <article key={bucket}>
                  <h4>{bucketLabels[bucket]} ({rows.length})</h4>
                  <div className="table-wrap">
                    <table className="workshop-table">
                      <thead>
                        <tr>
                          <th>Use</th>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Artwork</th>
                          <th>Product Type</th>
                          <th>Size</th>
                          <th>Orientation</th>
                          <th>Frame</th>
                          <th>Due Date</th>
                          <th>Fulfillment</th>
                          <th>Red Notes</th>
                          <th>Validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const isSelected = selectedSourceRecordIds.includes(row.sourceRecordId)
                          const selectable = canSelectPreviewRow(row, includeNeedsReviewWithApproval)

                          return (
                            <tr key={row.sourceRecordId}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!selectable}
                                  onChange={(event) => toggleRowSelection(row, event.target.checked)}
                                />
                              </td>
                              <td>{row.normalized?.orderIdentifier.normalized ?? row.sourceOrderIdentifier}</td>
                              <td>{row.normalized?.customerIdentifier.normalized ?? '--'}</td>
                              <td>{row.normalized?.artwork.normalized ?? '--'}</td>
                              <td>{row.normalized?.productType.normalized ?? row.safeSourceFields.TYPE ?? '--'}</td>
                              <td>{row.normalized?.size.normalized ? `${row.normalized.size.normalized.width} x ${row.normalized.size.normalized.height}` : row.safeSourceFields.SIZE ?? '--'}</td>
                              <td>{row.normalized?.orientation.normalized ?? '--'}</td>
                              <td>{row.normalized?.frameSelection.normalized ?? row.safeSourceFields.FRAME ?? '--'}</td>
                              <td>{row.normalized?.dueDate.normalized ?? row.safeSourceFields['DUE BY'] ?? '--'}</td>
                              <td>{row.normalized?.shippingOrPickupMethod.normalized ?? '--'}</td>
                              <td>{row.normalized?.redNotes.normalized ?? '--'}</td>
                              <td>{row.validationErrors.length > 0 ? row.validationErrors.map((error) => error.message).join(' | ') : row.validationStatus}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {bucket === 'CHANGED_ORDERS' ? (
                    <div className="panel-muted">
                      <strong>Field-level differences</strong>
                      {rows.map((row) => (
                        <ul key={`${row.sourceRecordId}-diff`}>
                          {row.fieldDiffs.length === 0 ? <li>No changed fields.</li> : row.fieldDiffs.map((diff) => (
                            <li key={`${row.sourceRecordId}-${diff.field}`}>
                              {diff.field}: {String(diff.before)} -&gt; {String(diff.after)}
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </section>
        </>
      ) : null}

      <section className="panel">
        <h3>Import History</h3>
        <div className="table-wrap">
          <table className="workshop-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Artwork</th>
                <th>Size</th>
                <th>Source</th>
                <th>3D File Status</th>
                <th>Existing Correct-size Files</th>
                <th>Slicing Required</th>
                <th>Resizing Required</th>
                <th>Review Required</th>
              </tr>
            </thead>
            <tbody>
              {recentImports.map(({ job, preparation }) => (
                <tr key={job.id}>
                  <td>{job.orderNumber}</td>
                  <td>{job.artworkTitle}</td>
                  <td>{job.width} x {job.height}</td>
                  <td>{job.orderSource ?? 'MANUAL'}</td>
                  <td>{preparation?.status ?? 'N/A'}</td>
                  <td>{preparation ? (preparation.existingFilesCorrectSize ? 'Yes' : 'No') : 'N/A'}</td>
                  <td>{preparation ? (preparation.slicingRequired ? 'Yes' : 'No') : 'N/A'}</td>
                  <td>{preparation ? (preparation.resizingRequired ? 'Yes' : 'No') : 'N/A'}</td>
                  <td>{preparation ? (preparation.attentionRequired ? 'Yes' : 'No') : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showManualModal ? (
        <div className="workshop-v2-modal-backdrop" role="presentation" onClick={() => setShowManualModal(false)}>
          <section
            className="panel workshop-v2-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-order-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="manual-order-title">Add Order Manually</h3>
            <p className="subtle">Exceptional-case entry only. Excel import remains the primary workflow.</p>

            <div className="form-grid">
              <label>
                Order number
                <input value={manualForm.orderNumber} onChange={(event) => setManualForm((current) => ({ ...current, orderNumber: event.target.value }))} />
              </label>
              <label>
                Customer
                <input value={manualForm.customerName} onChange={(event) => setManualForm((current) => ({ ...current, customerName: event.target.value }))} />
              </label>
              <label>
                Artwork
                <input value={manualForm.artworkTitle} onChange={(event) => setManualForm((current) => ({ ...current, artworkTitle: event.target.value }))} />
              </label>
              <label>
                Classification
                <select value={manualForm.classification} onChange={(event) => setManualForm((current) => ({ ...current, classification: event.target.value as ThreeDOrderImportClassification }))}>
                  <option value="THREE_D_TEXTURED_REPLICA">3D Textured Replica</option>
                  <option value="THREE_D_PRINT">3D Print</option>
                  <option value="CANVAS">Canvas</option>
                  <option value="PAPER">Paper</option>
                </select>
              </label>
              <label>
                Ordered width
                <input type="number" min={1} value={manualForm.orderedWidth} onChange={(event) => setManualForm((current) => ({ ...current, orderedWidth: Number(event.target.value) }))} />
              </label>
              <label>
                Ordered height
                <input type="number" min={1} value={manualForm.orderedHeight} onChange={(event) => setManualForm((current) => ({ ...current, orderedHeight: Number(event.target.value) }))} />
              </label>
              <label>
                Alignment
                <select value={manualForm.alignment} onChange={(event) => setManualForm((current) => ({ ...current, alignment: event.target.value as ImportFormState['alignment'] }))}>
                  <option value="HORIZ">HORIZ</option>
                  <option value="VERT">VERT</option>
                  <option value="SQUARE">SQUARE</option>
                  <option value="PANORAMA">PANORAMA</option>
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={manualForm.dueDate} onChange={(event) => setManualForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </label>
              <label>
                Frame / finish info
                <input value={manualForm.frameInfo} onChange={(event) => setManualForm((current) => ({ ...current, frameInfo: event.target.value }))} />
              </label>
              <label>
                Scan date
                <input type="date" value={manualForm.scanDate} onChange={(event) => setManualForm((current) => ({ ...current, scanDate: event.target.value }))} />
              </label>
              <label className="work-item-detail-wide-field">
                Import notes
                <textarea value={manualForm.notes} onChange={(event) => setManualForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>

            {isThreeDClassification ? (
              <div className="button-row">
                <label className="checkbox-label"><input type="checkbox" checked={manualForm.existingFilesFound} onChange={(event) => setManualForm((current) => ({ ...current, existingFilesFound: event.target.checked }))} /> Existing 3D files found</label>
                <label className="checkbox-label"><input type="checkbox" checked={manualForm.existingFilesCorrectSize} onChange={(event) => setManualForm((current) => ({ ...current, existingFilesCorrectSize: event.target.checked }))} /> Existing correct-size files</label>
                <label className="checkbox-label"><input type="checkbox" checked={manualForm.colorFilePresent} onChange={(event) => setManualForm((current) => ({ ...current, colorFilePresent: event.target.checked }))} /> Color file present</label>
                <label className="checkbox-label"><input type="checkbox" checked={manualForm.depthSlicesPresent} onChange={(event) => setManualForm((current) => ({ ...current, depthSlicesPresent: event.target.checked }))} /> Depth slices present</label>
              </div>
            ) : null}

            {manualFormError ? <p className="warning">{manualFormError}</p> : null}

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={submitManualOrder}>Save Manual Order</button>
              <button type="button" className="btn" onClick={() => setShowManualModal(false)}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default OrdersPage
