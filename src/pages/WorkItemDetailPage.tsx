import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getWorkItemDetailService,
  type EditWorkItemInput,
} from '../services/WorkItemDetailService'
import { ProductionForecastService } from '../services/ProductionForecastService'
import { loadProductionForecastSettings } from '../services/productionForecastSettings'
import { getWorkshopListUiEnvironment } from '../services/workshopListUiBootstrap'
import { useAppState } from '../state/AppStateContext'

interface EditFormState {
  priority: number
  dueDate: string
  assignedEmployeeId: string
  assignedDepartmentId: string
  notesInput: string
  tagsInput: string
}

const formatDate = (value?: string): string => {
  if (!value) {
    return '--'
  }

  return new Date(value).toLocaleDateString()
}

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '--'
  }

  return new Date(value).toLocaleString()
}

const toDateInputValue = (value?: string): string => {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

const parseTags = (tagsInput: string): string[] =>
  [...new Set(
    tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
  )]

const parseNotes = (notesInput: string): string[] =>
  notesInput
    .split('\n')
    .map((note) => note.trim())
    .filter((note) => note.length > 0)

const promptActualMinutes = (label: string, suggestedMinutes: number): number | null => {
  const response = window.prompt(
    `Enter actual completion minutes for ${label}:`,
    String(Math.max(1, Math.round(suggestedMinutes))),
  )

  if (response === null) {
    return null
  }

  const parsed = Number(response)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    window.alert('A positive numeric actual minutes value is required.')
    return null
  }

  return Math.round(parsed)
}

const WorkItemDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { productionJobs, battlePlans, employees, activityLogs, addActivityLog } = useAppState()

  const environment = useMemo(() => getWorkshopListUiEnvironment(), [])
  const detailService = useMemo(() => getWorkItemDetailService(environment), [environment])

  const [refreshKey, setRefreshKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  const [approvalRole, setApprovalRole] = useState('PRODUCTION_DIRECTOR')
  const [approvalEmployeeId, setApprovalEmployeeId] = useState(environment.employees[0]?.id ?? '')

  const [jumpStageId, setJumpStageId] = useState('')

  const [newNote, setNewNote] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUri, setAttachmentUri] = useState('')

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)

  const snapshotResult = useMemo(() => {
    if (!id) {
      return {
        snapshot: null,
        loadError: 'No Work Item id was provided.',
      }
    }

    try {
      const snapshot = detailService.getSnapshot(id)
      return {
        snapshot,
        loadError: null,
      }
    } catch (error) {
      return {
        snapshot: null,
        loadError:
          error instanceof Error ? error.message : 'Failed to load Work Item detail.',
      }
    }
  }, [detailService, id, refreshKey])

  const snapshot = snapshotResult.snapshot
  const loadError = snapshotResult.loadError

  const forecastService = useMemo(
    () =>
      new ProductionForecastService({
        productionJobs,
        battlePlans,
        employees,
        activityLogs,
        config: loadProductionForecastSettings(),
      }),
    [productionJobs, battlePlans, employees, activityLogs],
  )

  const forecastResult = useMemo(() => forecastService.getForecast(), [forecastService])

  const mappedProductionJob = useMemo(() => {
    if (!snapshot) {
      return undefined
    }

    return productionJobs.find((job) =>
      job.id === snapshot.workItem.id ||
      job.orderNumber === snapshot.workItem.orderId ||
      job.artworkTitle === snapshot.artworkName,
    )
  }, [snapshot, productionJobs])

  const forecastPanelData = useMemo(() => {
    if (!mappedProductionJob) {
      return {
        status: 'INSUFFICIENT_DATA' as const,
        reasons: [
          'No production-job mapping found for this work item.',
          'Link work item to production job id or order number to enable deadline forecasting.',
        ],
      }
    }

    return forecastService.getWorkItemForecastPanelData(mappedProductionJob.id)
  }, [mappedProductionJob, forecastService])

  const runAction = (action: () => void): void => {
    setIsWorking(true)

    try {
      action()
      setRefreshKey((value) => value + 1)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setIsWorking(false)
    }
  }

  const openEditDialog = (): void => {
    if (!snapshot) {
      return
    }

    setEditForm({
      priority: snapshot.workItem.priority,
      dueDate: toDateInputValue(snapshot.workItem.dueDate),
      assignedEmployeeId: snapshot.workItem.assignedEmployeeId ?? '',
      assignedDepartmentId: snapshot.workItem.assignedDepartmentId ?? '',
      notesInput: snapshot.workItem.notes.join('\n'),
      tagsInput: snapshot.workItem.tags.join(', '),
    })

    setShowEditDialog(true)
  }

  const saveEdit = (): void => {
    if (!snapshot || !editForm) {
      return
    }

    const input: EditWorkItemInput = {
      priority: editForm.priority,
      dueDate: editForm.dueDate || undefined,
      assignedEmployeeId: editForm.assignedEmployeeId || undefined,
      assignedDepartmentId: editForm.assignedDepartmentId || undefined,
      notes: parseNotes(editForm.notesInput),
      tags: parseTags(editForm.tagsInput),
    }

    runAction(() => {
      detailService.editWorkItem(snapshot.workItem.id, input)
      setShowEditDialog(false)
    })
  }

  if (loadError) {
    return (
      <section className="page work-item-detail-page">
        <div className="panel warning" role="alert">
          {loadError}
        </div>
        <div>
          <button type="button" className="btn" onClick={() => navigate('/workshop-list')}>
            Back to Workshop List
          </button>
        </div>
      </section>
    )
  }

  if (!snapshot) {
    return (
      <section className="page work-item-detail-page">
        <div className="panel">
          <h3>No Work Item selected</h3>
          <p className="subtle">Open a Work Item from the Workshop List.</p>
        </div>
      </section>
    )
  }

  const isBlocked = snapshot.workItem.status === 'BLOCKED'
  const controls = snapshot.workflowControls
  const selectedJumpOption = controls.jumpOptions.find((option) => option.stageId === jumpStageId)
  const canJumpToSelectedStage = Boolean(selectedJumpOption?.enabled)

  const completeCurrentStageWithActualMinutes = (): void => {
    const actualMinutes = promptActualMinutes(
      snapshot.currentStageName,
      snapshot.workflowStages.find((stage) => stage.status === 'CURRENT')?.estimatedDuration ?? 30,
    )
    if (actualMinutes === null) {
      return
    }

    runAction(() => {
      detailService.completeCurrentStage(snapshot.workItem.id)
      if (mappedProductionJob) {
        addActivityLog({
          entityType: 'WorkItem',
          entityId: mappedProductionJob.id,
          action: 'WORK_COMPLETED',
          metadata: {
            actualMinutes,
            source: 'WORK_ITEM_DETAIL',
            stage: snapshot.currentStageName,
          },
        })
      }
    })
  }

  return (
    <section className="page work-item-detail-page">
      <div className="work-item-detail-actions">
        <button type="button" className="btn" onClick={() => navigate('/workshop-list')}>
          Back to Workshop List
        </button>
      </div>

      <header className="panel work-item-detail-header">
        <div>
          <h2>{snapshot.workItem.workItemNumber}</h2>
          <p className="subtle">{snapshot.artworkName}</p>
          <p>{snapshot.customerName}</p>
        </div>

        <div className="work-item-header-grid">
          <p>
            <strong>Status:</strong> {snapshot.workItem.status}
          </p>
          <p>
            <strong>Priority:</strong> {snapshot.workItem.priority}
          </p>
          <p>
            <strong>Due:</strong> {formatDate(snapshot.workItem.dueDate)}
          </p>
          <p>
            <strong>Employee:</strong> {snapshot.assignedEmployeeName}
          </p>
          <p>
            <strong>Department:</strong> {snapshot.assignedDepartmentName}
          </p>
        </div>

        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={openEditDialog}>
            Edit
          </button>
        </div>
      </header>

      {isWorking && <div className="panel">Applying change...</div>}
      {errorMessage && (
        <div className="panel warning" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="panel">
        <h3>Overview</h3>
        <div className="work-item-overview-grid">
          <p>
            <strong>Work item type:</strong> {snapshot.workItem.type}
          </p>
          <p>
            <strong>Order:</strong> {snapshot.workItem.orderId}
          </p>
          <p>
            <strong>Product:</strong> {snapshot.productName}
          </p>
          <p>
            <strong>Artwork:</strong> {snapshot.artworkName}
          </p>
          <p>
            <strong>Customer:</strong> {snapshot.customerName}
          </p>
          <p>
            <strong>Workflow:</strong> {snapshot.workflowContext.workflow.name}
          </p>
          <p>
            <strong>Current stage:</strong> {snapshot.currentStageName}
          </p>
          <p>
            <strong>Start date:</strong> {formatDateTime(snapshot.workItem.startDate)}
          </p>
          <p>
            <strong>Due date:</strong> {formatDate(snapshot.workItem.dueDate)}
          </p>
          <p>
            <strong>Completed date:</strong> {formatDateTime(snapshot.workItem.completedDate)}
          </p>
        </div>

        <p>
          <strong>Notes:</strong>{' '}
          {snapshot.workItem.notes.length > 0 ? snapshot.workItem.notes.join(' | ') : '--'}
        </p>
        <p>
          <strong>Tags:</strong>{' '}
          {snapshot.workItem.tags.length > 0 ? snapshot.workItem.tags.join(', ') : '--'}
        </p>
      </section>

      <section className="panel">
        <h3>Predictive Forecast</h3>
        {forecastPanelData.status === 'READY' && forecastPanelData.forecast ? (
          <>
            <div className="work-item-overview-grid">
              <p>
                <strong>Expected completion date:</strong> {forecastPanelData.forecast.expectedDate}
              </p>
              <p>
                <strong>Due date:</strong> {forecastPanelData.forecast.dueDate}
              </p>
              <p>
                <strong>Deadline risk:</strong> {forecastPanelData.forecast.riskLevel}
              </p>
              <p>
                <strong>Remaining estimated minutes:</strong> {forecastPanelData.forecast.remainingEstimatedMinutes}
              </p>
              <p>
                <strong>Current stage delay:</strong> {forecastPanelData.forecast.expectedWaitingMinutes} min expected wait
              </p>
              <p>
                <strong>Confidence:</strong> {forecastPanelData.forecast.confidence}
              </p>
              <p>
                <strong>Optimistic / Conservative:</strong> {forecastPanelData.forecast.optimisticDate} / {forecastPanelData.forecast.conservativeDate}
              </p>
              <p>
                <strong>Recommended action:</strong> {forecastPanelData.forecast.recommendedAction}
              </p>
            </div>

            <h4>Reasons</h4>
            <ul className="plain-list">
              {forecastPanelData.forecast.reasons.slice(0, 8).map((reason) => (
                <li key={`${reason.code}-${reason.description}`}>
                  <div>
                    <strong>{reason.code}</strong>
                    <p>{reason.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p><strong>INSUFFICIENT_DATA</strong></p>
            <ul className="plain-list">
              {forecastPanelData.reasons.map((reason) => (
                <li key={reason}>
                  <div>
                    <strong>Data requirement</strong>
                    <p>{reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="subtle">
          Historical profiles used: {forecastResult.historicalProfiles.stageProfiles.length} •
          Missing actual times: {forecastResult.dataQuality.missingActualTimes}
        </p>
      </section>

      <section className="panel">
        <h3>Workflow</h3>
        <div className="table-wrap">
          <table className="workshop-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Status</th>
                <th>Department</th>
                <th>Est. Duration</th>
                <th>Required Approvals</th>
                <th>Completion Status</th>
                <th>Completed By</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.workflowStages.map((stage) => (
                <tr key={stage.stageId}>
                  <td>{stage.stageName}</td>
                  <td>{stage.status}</td>
                  <td>{stage.department}</td>
                  <td>{stage.estimatedDuration} min</td>
                  <td>{stage.requiredApprovals}</td>
                  <td>{stage.completionStatus}</td>
                  <td>{stage.completedBy}</td>
                  <td>{formatDateTime(stage.completedDate === '--' ? undefined : stage.completedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="work-item-workflow-controls">
          <div className="button-row">
            <button
              type="button"
              className="btn"
              disabled={!controls.completeCurrentStage.enabled}
              title={controls.completeCurrentStage.reason}
              onClick={completeCurrentStageWithActualMinutes}
            >
              Complete Current Stage
            </button>
            <button
              type="button"
              className="btn"
              disabled={!controls.moveToNextStage.enabled}
              title={controls.moveToNextStage.reason}
              onClick={() => runAction(() => detailService.moveToNextStage(snapshot.workItem.id))}
            >
              Move to Next Stage
            </button>
            <button
              type="button"
              className="btn"
              disabled={!controls.moveToPreviousStage.enabled}
              title={controls.moveToPreviousStage.reason}
              onClick={() => runAction(() => detailService.moveToPreviousStage(snapshot.workItem.id))}
            >
              Move to Previous Stage
            </button>
            <button
              type="button"
              className="btn"
              disabled={!controls.blockedToggle.enabled}
              title={controls.blockedToggle.reason}
              onClick={() => runAction(() => detailService.setBlockedStatus(snapshot.workItem.id, !isBlocked))}
            >
              {isBlocked ? 'Remove Blocked Status' : 'Mark Blocked'}
            </button>
          </div>

          <div className="work-item-control-hints" aria-live="polite">
            {!controls.completeCurrentStage.enabled && controls.completeCurrentStage.reason && (
              <p className="subtle">Complete stage unavailable: {controls.completeCurrentStage.reason}</p>
            )}
            {!controls.moveToNextStage.enabled && controls.moveToNextStage.reason && (
              <p className="subtle">Next stage unavailable: {controls.moveToNextStage.reason}</p>
            )}
            {!controls.moveToPreviousStage.enabled && controls.moveToPreviousStage.reason && (
              <p className="subtle">Previous stage unavailable: {controls.moveToPreviousStage.reason}</p>
            )}
            {!controls.blockedToggle.enabled && controls.blockedToggle.reason && (
              <p className="subtle">Blocked status unavailable: {controls.blockedToggle.reason}</p>
            )}
          </div>

          <div className="form-grid work-item-detail-form-grid">
            <label>
              Jump to stage
              <select
                value={jumpStageId}
                onChange={(event) => setJumpStageId(event.target.value)}
              >
                <option value="">Select stage</option>
                {controls.jumpOptions.map((stage) => (
                  <option key={stage.stageId} value={stage.stageId} disabled={!stage.enabled}>
                    {stage.stageName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Approval role
              <input
                type="text"
                value={approvalRole}
                onChange={(event) => setApprovalRole(event.target.value)}
              />
            </label>

            <label>
              Approved by
              <select
                value={approvalEmployeeId}
                onChange={(event) => setApprovalEmployeeId(event.target.value)}
              >
                {environment.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="btn"
              disabled={!jumpStageId || !canJumpToSelectedStage}
              title={selectedJumpOption?.reason}
              onClick={() => {
                if (!jumpStageId) {
                  setErrorMessage('Choose a stage to jump to.')
                  return
                }

                if (!canJumpToSelectedStage) {
                  setErrorMessage(selectedJumpOption?.reason ?? 'Jump to that stage is unavailable.')
                  return
                }

                runAction(() => detailService.jumpToStage(snapshot.workItem.id, jumpStageId))
              }}
            >
              Jump to Stage
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (!approvalRole.trim() || !approvalEmployeeId) {
                  setErrorMessage('Provide role and employee for approval.')
                  return
                }

                runAction(() => {
                  detailService.addApproval(
                    snapshot.workItem.id,
                    approvalRole.trim(),
                    approvalEmployeeId,
                  )
                })
              }}
            >
              Add Required Approval
            </button>
          </div>

          {selectedJumpOption && !selectedJumpOption.enabled && selectedJumpOption.reason && (
            <p className="subtle">Jump unavailable: {selectedJumpOption.reason}</p>
          )}

          {snapshot.approvals.length > 0 && (
            <ul className="plain-list work-item-approval-list">
              {snapshot.approvals.map((approval, index) => (
                <li key={`${approval.role}-${approval.approvedByEmployeeId}-${index}`}>
                  <p>
                    <strong>{approval.role}</strong> approved by {approval.approvedByEmployeeName}
                  </p>
                  <p className="subtle">{formatDateTime(approval.approvedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="work-item-section-header">
          <h3>Production Tags</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => runAction(() => detailService.generateTags(snapshot.workItem.id))}
          >
            Generate Tags
          </button>
        </div>

        {snapshot.generatedTags.length === 0 && (
          <p className="subtle">No production tags have been generated yet.</p>
        )}

        {snapshot.generatedTags.length > 0 && (
          <div className="work-item-tag-grid">
            {snapshot.generatedTags.map((tag) => (
              <article key={tag.id} className="work-item-tag-card">
                <h4>{tag.tagType}</h4>
                <p>
                  <strong>Product type:</strong> {tag.productName}
                </p>
                <p>
                  <strong>Frame dimensions:</strong>{' '}
                  {tag.frameDimensions
                    ? `${tag.frameDimensions.width} x ${tag.frameDimensions.height}`
                    : '--'}
                </p>
                <p>
                  <strong>Stretcher/Base dimensions:</strong>{' '}
                  {tag.stretcherDimensions
                    ? `${tag.stretcherDimensions.width} x ${tag.stretcherDimensions.height}`
                    : tag.baseDimensions
                      ? `${tag.baseDimensions.width} x ${tag.baseDimensions.height}`
                      : '--'}
                </p>
                <p>
                  <strong>Packaging method:</strong> {tag.packagingMethod}
                </p>
                <p>
                  <strong>Shipping box:</strong> {tag.shippingBoxCode ?? '--'}
                </p>
                <p>
                  <strong>Checkpoints:</strong>{' '}
                  {tag.checkpoints.length > 0
                    ? tag.checkpoints.map((checkpoint) => `${checkpoint.label}: ${checkpoint.value}`).join(', ')
                    : '--'}
                </p>
                <p>
                  <strong>Generated:</strong> {formatDateTime(tag.generatedAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Activity</h3>
        {snapshot.activityTimeline.length === 0 && (
          <p className="subtle">No activity yet.</p>
        )}

        {snapshot.activityTimeline.length > 0 && (
          <ul className="work-item-activity-list">
            {snapshot.activityTimeline.map((activity) => (
              <li key={`${activity.source}-${activity.id}`}>
                <div>
                  <p>
                    <strong>{activity.action}</strong> {activity.message}
                  </p>
                  <p className="subtle">
                    {activity.actorEmployeeName} • {formatDateTime(activity.occurredAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>Notes and Attachments</h3>
        <div className="form-grid work-item-detail-form-grid">
          <label className="work-item-detail-wide-field">
            Add note
            <textarea
              rows={3}
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
            />
          </label>

          <label>
            Attachment name
            <input
              type="text"
              value={attachmentName}
              onChange={(event) => setAttachmentName(event.target.value)}
              placeholder="example-proof.pdf"
            />
          </label>

          <label>
            Attachment reference URL/URI
            <input
              type="text"
              value={attachmentUri}
              onChange={(event) => setAttachmentUri(event.target.value)}
              placeholder="https://... or file://..."
            />
          </label>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (!newNote.trim()) {
                setErrorMessage('Enter a note before adding.')
                return
              }

              runAction(() => {
                detailService.addNote(snapshot.workItem.id, newNote.trim())
                setNewNote('')
              })
            }}
          >
            Add Note
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              if (!attachmentName.trim() || !attachmentUri.trim()) {
                setErrorMessage('Provide attachment name and reference.')
                return
              }

              runAction(() => {
                detailService.addAttachmentReference(
                  snapshot.workItem.id,
                  attachmentName.trim(),
                  attachmentUri.trim(),
                )
                setAttachmentName('')
                setAttachmentUri('')
              })
            }}
          >
            Add Attachment Reference
          </button>
        </div>

        <div className="work-item-notes-attachments-grid">
          <article>
            <h4>Existing Notes</h4>
            {snapshot.workItem.notes.length === 0 ? (
              <p className="subtle">No notes yet.</p>
            ) : (
              <ul className="plain-list">
                {snapshot.workItem.notes.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            )}
          </article>

          <article>
            <h4>Existing Attachments</h4>
            {snapshot.workItem.attachments.length === 0 ? (
              <p className="subtle">No attachments yet.</p>
            ) : (
              <ul className="plain-list">
                {snapshot.workItem.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <p>{attachment.fileName}</p>
                    <p className="subtle">{attachment.uri}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      {showEditDialog && editForm && (
        <div className="workshop-v2-modal-backdrop" role="presentation" onClick={() => setShowEditDialog(false)}>
          <section
            className="panel workshop-v2-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-work-item-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="edit-work-item-title">Edit Work Item</h3>
            <div className="form-grid work-item-detail-form-grid">
              <label>
                Priority
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={editForm.priority}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            priority: Number(event.target.value),
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            dueDate: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label>
                Assigned employee
                <select
                  value={editForm.assignedEmployeeId}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            assignedEmployeeId: event.target.value,
                          }
                        : current,
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {environment.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Assigned department
                <select
                  value={editForm.assignedDepartmentId}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            assignedDepartmentId: event.target.value,
                          }
                        : current,
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {environment.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="work-item-detail-wide-field">
                Notes
                <textarea
                  rows={4}
                  value={editForm.notesInput}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            notesInput: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </label>

              <label className="work-item-detail-wide-field">
                Tags
                <input
                  type="text"
                  value={editForm.tagsInput}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            tagsInput: event.target.value,
                          }
                        : current,
                    )
                  }
                  placeholder="Comma-separated tags"
                />
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={saveEdit}>
                Save Changes
              </button>
              <button type="button" className="btn" onClick={() => setShowEditDialog(false)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default WorkItemDetailPage
