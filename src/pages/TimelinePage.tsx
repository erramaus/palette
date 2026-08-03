import { useAppState } from '../state/AppStateContext'

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const TimelinePage = () => {
  const { operationTimeline } = useAppState()

  return (
    <section className="page">
      <header className="page-heading">
        <h2>Production Timeline</h2>
        <p>Expected operation sequence, dependencies, queues, and completion times.</p>
      </header>
      <section className="panel">
        <div className="table-wrap">
          <table className="workshop-table">
            <thead><tr><th>Queue</th><th>Order / Piece</th><th>Operation</th><th>Work Center</th><th>Start</th><th>Finish</th><th>Dependencies</th><th>Status</th></tr></thead>
            <tbody>
              {operationTimeline.map((item, index) => (
                <tr key={item.operationId} className={item.confidence === 'LOW' ? 'row-due-soon' : ''}>
                  <td>{index + 1}</td>
                  <td><strong>{item.orderNumber}</strong><br /><span className="subtle">{item.pieceLabel}</span></td>
                  <td>{item.operation}</td><td>{item.assignedWorkCenter}</td><td>{formatDateTime(item.plannedStart)}</td><td>{formatDateTime(item.plannedFinish)}</td>
                  <td>{item.dependencyIds.length}</td>
                  <td>{item.cutCalculationStatus === 'NEEDS_REVIEW' || item.tagStatus === 'NEEDS_REVIEW'
                    ? <span className="tag-status tag-status-needs_review">Blocked by Calculation</span>
                    : item.status.split('_').join(' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

export default TimelinePage