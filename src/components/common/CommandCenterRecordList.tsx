import { useMemo, useState } from 'react'
import { colors } from '../../theme/colors'

export type CommandCenterStatusTone = 'late' | 'blocked' | 'progress' | 'ready' | 'review' | 'complete' | 'default'

export interface CommandCenterRecord {
  id: string
  status: string
  dueDate?: string
  customer?: string
  artwork?: string
  currentOperation?: string
  assignedEmployee?: string
  priority?: number
  estimatedRemainingMinutes?: number
  workItemId?: string
  statusTone?: CommandCenterStatusTone
  searchText?: string
  orderLabel?: string
}

interface CommandCenterRecordListProps {
  title: string
  description: string
  records: CommandCenterRecord[]
  emptyMessage?: string
  openLabel?: string
  dueDateLabel?: string
  onOpenRecord?: (record: CommandCenterRecord) => void
}

const statusToneStyles: Record<CommandCenterStatusTone, { backgroundColor: string; color: string }> = {
  late: { backgroundColor: colors.primary, color: colors.white },
  blocked: { backgroundColor: colors.darkGray, color: colors.white },
  progress: { backgroundColor: colors.orange, color: colors.primary },
  ready: { backgroundColor: colors.lightBlue, color: colors.primary },
  review: { backgroundColor: colors.purple, color: colors.white },
  complete: { backgroundColor: colors.magenta, color: colors.white },
  default: { backgroundColor: colors.lightGray, color: colors.text },
}

const localDateKey = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`

const formatDate = (value?: string): string => {
  if (!value) return '--'
  return new Date(value).toLocaleDateString()
}

const normalize = (value: string): string => value.trim().toLowerCase()

const computeUrgency = (record: CommandCenterRecord): number => {
  const today = localDateKey(new Date())
  const dueDate = record.dueDate?.slice(0, 10)
  const dueRank = dueDate === undefined
    ? 4
    : dueDate < today
      ? 0
      : dueDate === today
        ? 1
        : dueDate <= localDateKey(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
          ? 2
          : 3

  const priorityRank = 100 - Math.max(0, Math.min(100, record.priority ?? 0))
  const remainingRank = Math.max(0, Math.min(9999, record.estimatedRemainingMinutes ?? 0))
  return dueRank * 100000 + priorityRank * 100 + remainingRank
}

const statusLabel = (value: string): string => value.replaceAll('_', ' ')

const CommandCenterRecordList = ({
  title,
  description,
  records,
  emptyMessage = 'No matching records',
  openLabel = 'Open Work Item',
  dueDateLabel = 'Due',
  onOpenRecord,
}: CommandCenterRecordListProps) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortMode, setSortMode] = useState<'urgency' | 'dueDate' | 'priority' | 'customer' | 'artwork' | 'employee'>('urgency')

  const normalizedSearch = normalize(searchText)

  const filteredRecords = useMemo(() => {
    let next = records.filter((record) => {
      if (statusFilter && record.status !== statusFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        record.orderLabel ?? '',
        record.status,
        record.customer ?? '',
        record.artwork ?? '',
        record.currentOperation ?? '',
        record.assignedEmployee ?? '',
        String(record.priority ?? ''),
        String(record.estimatedRemainingMinutes ?? ''),
        record.searchText ?? '',
      ].join(' ')

      return normalize(haystack).includes(normalizedSearch)
    })

    next = [...next].sort((left, right) => {
      switch (sortMode) {
        case 'dueDate':
          return (left.dueDate ?? '9999-12-31').localeCompare(right.dueDate ?? '9999-12-31')
        case 'priority':
          return (right.priority ?? 0) - (left.priority ?? 0)
        case 'customer':
          return (left.customer ?? '').localeCompare(right.customer ?? '')
        case 'artwork':
          return (left.artwork ?? '').localeCompare(right.artwork ?? '')
        case 'employee':
          return (left.assignedEmployee ?? '').localeCompare(right.assignedEmployee ?? '')
        case 'urgency':
        default:
          return computeUrgency(left) - computeUrgency(right)
      }
    })

    return next
  }, [normalizedSearch, records, sortMode, statusFilter])

  const groupedRecords = useMemo(() => {
    const groups = new Map<string, CommandCenterRecord[]>()
    filteredRecords.forEach((record) => {
      const current = groups.get(record.status) ?? []
      current.push(record)
      groups.set(record.status, current)
    })

    return [...groups.entries()].sort((left, right) => {
      const leftRank = left[1].reduce((sum, record) => sum + computeUrgency(record), 0) / Math.max(1, left[1].length)
      const rightRank = right[1].reduce((sum, record) => sum + computeUrgency(record), 0) / Math.max(1, right[1].length)
      return leftRank - rightRank
    })
  }, [filteredRecords])

  const lateCount = records.filter((record) => (record.dueDate?.slice(0, 10) ?? '') < localDateKey(new Date())).length
  const blockedCount = records.filter((record) => normalize(record.status).includes('blocked') || record.statusTone === 'blocked').length
  const dueTodayCount = records.filter((record) => record.dueDate?.slice(0, 10) === localDateKey(new Date())).length

  const statusOptions = useMemo(() => {
    return [...new Set(records.map((record) => record.status))].sort((left, right) => left.localeCompare(right))
  }, [records])

  return (
    <section className="panel command-center-list-panel">
      <div className="work-item-section-header">
        <div>
          <h3>{title}</h3>
          <p className="subtle">{description}</p>
        </div>
        <span className="badge">{filteredRecords.length} records</span>
      </div>

      <div className="command-center-summary-grid">
        <span className="badge">Total {records.length}</span>
        <span className="badge">Late {lateCount}</span>
        <span className="badge">Blocked {blockedCount}</span>
        <span className="badge">Due Today {dueTodayCount}</span>
      </div>

      <div className="command-center-toolbar">
        <label>
          Search
          <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Order, customer, artwork, employee" />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
            <option value="urgency">Urgency</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="customer">Customer</option>
            <option value="artwork">Artwork</option>
            <option value="employee">Assigned employee</option>
          </select>
        </label>
      </div>

      {groupedRecords.length === 0 ? (
        <p className="subtle">{emptyMessage}</p>
      ) : (
        <div className="command-center-status-groups">
          {groupedRecords.map(([status, groupRecords]) => (
            <article key={status} className="command-center-status-group">
              <div className="work-item-section-header">
                <div>
                  <h4>{statusLabel(status)}</h4>
                  <p className="subtle">{groupRecords.length} records in this status</p>
                </div>
                <span
                  className="badge"
                  style={{ backgroundColor: statusToneStyles[groupRecords[0]?.statusTone ?? 'default'].backgroundColor, color: statusToneStyles[groupRecords[0]?.statusTone ?? 'default'].color }}
                >
                  {statusLabel(groupRecords[0]?.statusTone?.toUpperCase() ?? status)}
                </span>
              </div>
              <ul className="plain-list command-center-record-list">
                {groupRecords.map((record) => {
                  const tone = record.statusTone ?? 'default'
                  return (
                    <li key={record.id} className="command-center-record-item">
                      <button
                        type="button"
                        className="command-center-record-button"
                        onClick={() => onOpenRecord?.(record)}
                      >
                        <div className="command-center-record-main">
                          <div className="command-center-record-head">
                            <div>
                              <strong>{record.orderLabel ?? record.id}</strong>
                              <p>{record.customer ?? '--'}</p>
                            </div>
                            <span className="badge" style={statusToneStyles[tone]}>{statusLabel(record.status)}</span>
                          </div>
                          <p className="subtle">{record.artwork ?? '--'} · {record.currentOperation ?? '--'}</p>
                          <p className="subtle">{record.assignedEmployee ?? '--'} · Priority {record.priority ?? '--'} · {record.estimatedRemainingMinutes ?? '--'} min remaining</p>
                          <p className="subtle">{dueDateLabel} {formatDate(record.dueDate)}</p>
                        </div>
                        <span className="command-center-record-action">{openLabel}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CommandCenterRecordList
