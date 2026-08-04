import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useAppState } from '../state/AppStateContext'
import {
  type WebsiteOrderImportPreview,
  type WebsiteOrderImportRowPreview,
  WebsiteOrderExcelImportService,
} from '../services/WebsiteOrderExcelImportService'

const workbookImportService = new WebsiteOrderExcelImportService()
const acceptedWorkbookExtensions = ['.xlsx', '.xls'] as const

const isAcceptedWorkbookFile = (fileName: string): boolean => {
  const lowerName = fileName.trim().toLowerCase()
  return acceptedWorkbookExtensions.some((extension) => lowerName.endsWith(extension))
}

const bucketLabels: Record<WebsiteOrderImportRowPreview['bucket'], string> = {
  NEW_ORDERS: 'New Orders',
  CHANGED_ORDERS: 'Changed Orders',
  EXISTING_ORDERS: 'Existing Orders',
  SKIPPED_ROWS: 'Skipped Rows',
  NEEDS_REVIEW: 'Needs Review',
  ERRORS: 'Errors',
}

const ImportCenterPage = () => {
  const { productionJobs, employees, importWarehouseExcelOrders } = useAppState()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const directorId = useMemo(
    () => employees.find((employee) => employee.role === 'PRODUCTION_DIRECTOR')?.id ?? employees[0]?.id ?? 'system',
    [employees],
  )
  const existingLookup = useMemo(
    () => workbookImportService.getExistingLookup(workbookImportService.getExistingRecordsFromProductionJobs(productionJobs)),
    [productionJobs],
  )
  const [preview, setPreview] = useState<WebsiteOrderImportPreview | null>(null)
  const [selectedSourceRecordIds, setSelectedSourceRecordIds] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (!preview) return
    const nextSelected = preview.rows
      .filter((row) => row.bucket === 'NEW_ORDERS' || row.bucket === 'CHANGED_ORDERS' || row.bucket === 'NEEDS_REVIEW')
      .map((row) => row.sourceRecordId)
    setSelectedSourceRecordIds(nextSelected)
  }, [preview])

  const groupedRows = useMemo(() => {
    const rowsByBucket = new Map<WebsiteOrderImportRowPreview['bucket'], WebsiteOrderImportRowPreview[]>()
    preview?.rows.forEach((row) => {
      const rows = rowsByBucket.get(row.bucket) ?? []
      rows.push(row)
      rowsByBucket.set(row.bucket, rows)
    })
    return rowsByBucket
  }, [preview])

  const loadWorkbook = async (file: File): Promise<void> => {
    if (!isAcceptedWorkbookFile(file.name)) {
      setLoadError(`Unsupported file type. Accepted formats: ${acceptedWorkbookExtensions.join(', ')}`)
      return
    }

    const nextUploadedAt = new Date().toISOString()
    setFileName(file.name)
    setUploadedAt(nextUploadedAt)
    setLoadError(null)

    try {
      const parsed = await workbookImportService.parseFile(file, nextUploadedAt)
      const nextPreview = workbookImportService.buildPreview(parsed, existingLookup)
      setPreview(nextPreview)
    } catch (error) {
      setPreview(null)
      setSelectedSourceRecordIds([])
      setLoadError(error instanceof Error ? error.message : 'Unable to read the workbook.')
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return
    await loadWorkbook(file)
  }

  const importSelected = (onlyValidRows = false): void => {
    if (!preview) return
    const rowsToImport = preview.rows.filter((row) =>
      selectedSourceRecordIds.includes(row.sourceRecordId)
      && (!onlyValidRows || row.bucket === 'NEW_ORDERS' || row.bucket === 'CHANGED_ORDERS'),
    )
    if (rowsToImport.length === 0) return

    setIsImporting(true)
    try {
      importWarehouseExcelOrders({
        preview: { ...preview, rows: rowsToImport },
        selectedSourceRecordIds: rowsToImport.map((row) => row.sourceRecordId),
        importedByEmployeeId: directorId,
      })
      setLoadError(null)
      setSelectedSourceRecordIds([])
    } finally {
      setIsImporting(false)
    }
  }

  const cancelPreview = (): void => {
    setPreview(null)
    setSelectedSourceRecordIds([])
    setFileName(null)
    setUploadedAt(null)
    setLoadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="page import-center-page">
      <div className="page-heading">
        <h2>Import Center</h2>
        <p>
          Upload the Excel workbook downloaded from Print Warehouse Reps, review the normalized preview,
          and approve the import as Production Director.
        </p>
      </div>

      <section className="panel">
        <h3>Upload New Orders Excel</h3>
        <div className="form-grid">
          <label>
            Workbook file
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
            />
          </label>
          <div>
            <strong>Selected file</strong>
            <p>{fileName ?? '--'}</p>
          </div>
          <div>
            <strong>Import timestamp</strong>
            <p>{uploadedAt ? new Date(uploadedAt).toLocaleString() : '--'}</p>
          </div>
          <div>
            <strong>Director approver</strong>
            <p>{employees.find((employee) => employee.id === directorId)?.name ?? 'Production Director'}</p>
          </div>
        </div>
        {loadError ? <p className="warning">{loadError}</p> : null}
      </section>

      {preview ? (
        <>
          <section className="panel">
            <h3>Preview Summary</h3>
            <div className="form-grid">
              {Object.entries(preview.summaries).map(([key, value]) => (
                <div key={key}>
                  <strong>{bucketLabels[key as WebsiteOrderImportRowPreview['bucket']]}</strong>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={() => importSelected(false)} disabled={isImporting}>
                Import Selected
              </button>
              <button type="button" className="btn" onClick={() => importSelected(true)} disabled={isImporting}>
                Import All Valid
              </button>
              <button type="button" className="btn" onClick={cancelPreview} disabled={isImporting}>
                Cancel
              </button>
            </div>
          </section>

          <section className="panel">
            <h3>Warnings</h3>
            {preview.warnings.length > 0 ? (
              <ul>
                {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            ) : <p>No workbook warnings.</p>}
          </section>

          {(['NEW_ORDERS', 'CHANGED_ORDERS', 'EXISTING_ORDERS', 'SKIPPED_ROWS', 'NEEDS_REVIEW', 'ERRORS'] as const).map((bucket) => {
            const rows = groupedRows.get(bucket) ?? []
            return (
              <section className="panel" key={bucket}>
                <h3>{bucketLabels[bucket]} ({rows.length})</h3>
                <div className="table-wrap">
                  <table className="workshop-table">
                    <thead>
                      <tr>
                        <th>Use</th>
                        <th>Source Record</th>
                        <th>Order / Ref</th>
                        <th>Customer</th>
                        <th>Artwork</th>
                        <th>Product Type</th>
                        <th>Size</th>
                        <th>Frame</th>
                        <th>Due By</th>
                        <th>Ship</th>
                        <th>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.sourceRecordId}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedSourceRecordIds.includes(row.sourceRecordId)}
                              onChange={(event) => setSelectedSourceRecordIds((current) =>
                                event.target.checked
                                  ? [...current, row.sourceRecordId]
                                  : current.filter((id) => id !== row.sourceRecordId),
                              )}
                            />
                          </td>
                          <td>
                            <div>{row.sourceRecordLabel}</div>
                            <small>{row.sourceRecordId}</small>
                          </td>
                          <td>{row.sourceOrderIdentifier}</td>
                          <td>{row.normalized?.customerIdentifier.normalized ?? '--'}</td>
                          <td>{row.normalized?.artwork.normalized ?? '--'}</td>
                          <td>{row.normalized?.productType.normalized ?? row.safeSourceFields.TYPE ?? '--'}</td>
                          <td>{row.normalized?.size.normalized ? `${row.normalized.size.normalized.width} x ${row.normalized.size.normalized.height}` : row.safeSourceFields.SIZE ?? '--'}</td>
                          <td>{row.normalized?.frameSelection.normalized ?? row.safeSourceFields.FRAME ?? '--'}</td>
                          <td>{row.normalized?.dueDate.normalized ?? row.safeSourceFields['DUE BY'] ?? '--'}</td>
                          <td>{row.normalized?.shippingOrPickupMethod.normalized ?? '--'}</td>
                          <td>{row.validationErrors.length > 0 ? row.validationErrors.map((error) => error.message).join(' | ') : row.validationStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bucket === 'CHANGED_ORDERS' ? (
                  <div className="panel-muted">
                    <strong>Field diffs</strong>
                    {rows.map((row) => (
                      <ul key={`${row.sourceRecordId}-diffs`}>
                        {row.fieldDiffs.map((diff) => (
                          <li key={`${row.sourceRecordId}-${diff.field}`}>{diff.field}: {String(diff.before)} → {String(diff.after)}</li>
                        ))}
                      </ul>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          })}
        </>
      ) : null}
    </section>
  )
}

export default ImportCenterPage