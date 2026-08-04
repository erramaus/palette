import { useState } from 'react'
import { useAppState } from '../../state/AppStateContext'
import type { ProductionOperation } from '../../services/ProductionPipelineService'

interface OperationLifecycleActionsProps {
  operation: ProductionOperation
  role: 'WORKER' | 'DIRECTOR'
  actorEmployeeId: string
  battlePlanDate?: string
  compact?: boolean
  overflowSecondary?: boolean
}

const ask = (message: string, initialValue = ''): string | null => {
  const value = window.prompt(message, initialValue)
  return value === null ? null : value.trim()
}

const OperationLifecycleActions = ({
  operation,
  role,
  actorEmployeeId,
  battlePlanDate,
  compact = false,
  overflowSecondary = false,
}: OperationLifecycleActionsProps) => {
  const {
    employees,
    assignOperation,
    unassignOperation,
    startOperation,
    blockOperation,
    unblockOperation,
    completeOperation,
    reopenOperation,
    carryForwardOperation,
    changeOperationDueDate,
    changeOperationPriority,
    addOperationNote,
  } = useAppState()
  const [error, setError] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState(operation.assignedEmployeeId ?? '')

  const run = (action: () => void): void => {
    try {
      action()
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Operation action failed.')
    }
  }

  const addNote = (): void => {
    const note = ask('Operation note')
    if (note) run(() => addOperationNote(operation.id, note, actorEmployeeId))
  }

  const block = (): void => {
    const reason = ask('Blocking reason')
    if (!reason) return
    const reference = ask('Optional dependency or material reference')
    run(() => blockOperation({
      operationId: operation.id,
      reason,
      blockedBy: actorEmployeeId,
      dependencyOrMaterialReference: reference || undefined,
    }))
  }

  const complete = (override: boolean): void => {
    const reason = override ? ask('Director dependency override reason') : null
    if (override && !reason) return
    run(() => completeOperation({
      operationId: operation.id,
      completedBy: actorEmployeeId,
      directorOverride: override ? { approvedBy: actorEmployeeId, reason: reason! } : undefined,
    }))
  }

  const densePrimaryAction = (() => {
    if (role === 'DIRECTOR' && operation.status === 'BLOCKED') {
      return {
        label: 'Unblock',
        onClick: () => run(() => unblockOperation(operation.id, actorEmployeeId)),
      }
    }

    if (role === 'DIRECTOR' && operation.status === 'COMPLETE') {
      return {
        label: 'Reopen',
        onClick: () => {
          const reason = ask('Reason for reopening')
          if (reason) run(() => reopenOperation(operation.id, actorEmployeeId, reason))
        },
      }
    }

    if (operation.status !== 'COMPLETE') {
      return {
        label: 'Complete',
        onClick: () => complete(false),
      }
    }

    return null
  })()

  if (overflowSecondary) {
    return (
      <div className={`operation-actions operation-actions-overflow ${compact ? 'operation-actions-compact' : ''}`}>
        <div className="operation-actions-row operation-actions-density-row">
          {densePrimaryAction && (
            <button type="button" className="btn btn-primary" onClick={densePrimaryAction.onClick}>
              {densePrimaryAction.label}
            </button>
          )}
          <button type="button" className="btn" onClick={addNote}>Add Note</button>

          <details className="operation-actions-overflow-menu">
            <summary>More Actions</summary>
            <div className="operation-actions-overflow-content">
              <section className="operation-actions-group">
                <h5>Lifecycle</h5>
                <div className="operation-actions-row">
                  {operation.status !== 'COMPLETE' && operation.status !== 'BLOCKED' && (
                    <button type="button" className="btn" onClick={() => run(() => startOperation(operation.id, actorEmployeeId))}>Start</button>
                  )}
                  {operation.status !== 'COMPLETE' && operation.status !== 'BLOCKED' && (
                    <button type="button" className="btn" onClick={block}>Block</button>
                  )}
                  {operation.status !== 'COMPLETE' && (
                    <button type="button" className="btn" onClick={() => complete(false)}>Complete</button>
                  )}
                  {role === 'DIRECTOR' && operation.status === 'BLOCKED' && (
                    <button type="button" className="btn" onClick={() => run(() => unblockOperation(operation.id, actorEmployeeId))}>Unblock</button>
                  )}
                  {role === 'DIRECTOR' && operation.status === 'COMPLETE' && (
                    <button type="button" className="btn" onClick={() => {
                      const reason = ask('Reason for reopening')
                      if (reason) run(() => reopenOperation(operation.id, actorEmployeeId, reason))
                    }}>Reopen</button>
                  )}
                  {role === 'DIRECTOR' && operation.status !== 'COMPLETE' && (
                    <button type="button" className="btn" onClick={() => complete(true)}>Override Dependency</button>
                  )}
                </div>
              </section>

              {role === 'DIRECTOR' && (
                <section className="operation-actions-group">
                  <h5>Assignment</h5>
                  <div className="operation-actions-row">
                    <label className="operation-assignee-control">
                      <span className="sr-only">Assign operation</span>
                      <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                        <option value="">Unassigned</option>
                        {employees.filter((employee) => employee.active).map((employee) => (
                          <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="btn" onClick={() => assigneeId
                      ? run(() => assignOperation(operation.id, assigneeId, actorEmployeeId))
                      : run(() => unassignOperation(operation.id, actorEmployeeId))}
                    >{operation.assignedEmployeeId ? 'Reassign' : 'Assign'}</button>
                  </div>
                </section>
              )}

              {role === 'DIRECTOR' && (
                <section className="operation-actions-group">
                  <h5>Schedule</h5>
                  <div className="operation-actions-row">
                    <button type="button" className="btn" onClick={() => {
                      const originalDate = battlePlanDate ?? ask('Original Battle Plan date', new Date().toISOString().slice(0, 10))
                      if (!originalDate) return
                      const newDate = ask('New Battle Plan date', originalDate)
                      const reason = ask('Carry-forward reason')
                      if (newDate && reason) run(() => carryForwardOperation({ operationId: operation.id, originalBattlePlanDate: originalDate, newBattlePlanDate: newDate, reason, carriedForwardBy: actorEmployeeId }))
                    }}>Carry Forward</button>
                    <button type="button" className="btn" onClick={() => {
                      const priority = ask('New priority', String(operation.priority))
                      if (priority) run(() => changeOperationPriority(operation.id, Number(priority), actorEmployeeId))
                    }}>Priority</button>
                    <button type="button" className="btn" onClick={() => {
                      const dueDate = ask('New due date (YYYY-MM-DD)', operation.dueDate ?? '')
                      if (dueDate) run(() => changeOperationDueDate(operation.id, dueDate, actorEmployeeId))
                    }}>Due Date</button>
                  </div>
                </section>
              )}
            </div>
          </details>
        </div>
        {error && <p className="warning operation-action-error" role="alert">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`operation-actions ${compact ? 'operation-actions-compact' : ''}`}>
      <div className="operation-actions-row">
        {operation.status !== 'COMPLETE' && operation.status !== 'BLOCKED' && (
          <button type="button" className="btn" onClick={() => run(() => startOperation(operation.id, actorEmployeeId))}>Start</button>
        )}
        {operation.status !== 'COMPLETE' && operation.status !== 'BLOCKED' && (
          <button type="button" className="btn" onClick={block}>Block</button>
        )}
        {operation.status !== 'COMPLETE' && (
          <button type="button" className="btn" onClick={() => complete(false)}>Complete</button>
        )}
        <button type="button" className="btn" onClick={addNote}>Add Note</button>

        {role === 'DIRECTOR' && (
          <>
            <label className="operation-assignee-control">
              <span className="sr-only">Assign operation</span>
              <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                <option value="">Unassigned</option>
                {employees.filter((employee) => employee.active).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </label>
            <button type="button" className="btn" onClick={() => assigneeId
              ? run(() => assignOperation(operation.id, assigneeId, actorEmployeeId))
              : run(() => unassignOperation(operation.id, actorEmployeeId))}
            >{operation.assignedEmployeeId ? 'Reassign' : 'Assign'}</button>
            {operation.status === 'BLOCKED' && (
              <button type="button" className="btn" onClick={() => run(() => unblockOperation(operation.id, actorEmployeeId))}>Unblock</button>
            )}
            {operation.status === 'COMPLETE' && (
              <button type="button" className="btn" onClick={() => {
                const reason = ask('Reason for reopening')
                if (reason) run(() => reopenOperation(operation.id, actorEmployeeId, reason))
              }}>Reopen</button>
            )}
            {operation.status !== 'COMPLETE' && (
              <button type="button" className="btn" onClick={() => complete(true)}>Override Dependency</button>
            )}
            <button type="button" className="btn" onClick={() => {
              const originalDate = battlePlanDate ?? ask('Original Battle Plan date', new Date().toISOString().slice(0, 10))
              if (!originalDate) return
              const newDate = ask('New Battle Plan date', originalDate)
              const reason = ask('Carry-forward reason')
              if (newDate && reason) run(() => carryForwardOperation({ operationId: operation.id, originalBattlePlanDate: originalDate, newBattlePlanDate: newDate, reason, carriedForwardBy: actorEmployeeId }))
            }}>Carry Forward</button>
            <button type="button" className="btn" onClick={() => {
              const priority = ask('New priority', String(operation.priority))
              if (priority) run(() => changeOperationPriority(operation.id, Number(priority), actorEmployeeId))
            }}>Priority</button>
            <button type="button" className="btn" onClick={() => {
              const dueDate = ask('New due date (YYYY-MM-DD)', operation.dueDate ?? '')
              if (dueDate) run(() => changeOperationDueDate(operation.id, dueDate, actorEmployeeId))
            }}>Due Date</button>
          </>
        )}
      </div>
      {error && <p className="warning operation-action-error" role="alert">{error}</p>}
    </div>
  )
}

export default OperationLifecycleActions