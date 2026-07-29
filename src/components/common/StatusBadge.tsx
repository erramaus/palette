import type { DueStatus, Priority } from '../../types/production'
import { DUE_STATUS_LABELS } from '../../utils/dueStatus'
import { colors } from '../../theme/colors'

interface StatusBadgeProps {
  dueStatus?: DueStatus
  priority?: Priority
}

const priorityLabels: Record<Priority, string> = {
  ORIGINALS: 'Originals',
  CUSTOMER_PURCHASED: 'Customer Purchased',
  GALLERY_INVENTORY: 'Gallery Inventory',
}

const dueStatusStyles: Record<DueStatus, { backgroundColor: string; color: string }> = {
  ON_TRACK: { backgroundColor: colors.lightBlue, color: colors.primary },
  DUE_SOON: { backgroundColor: colors.orange, color: colors.primary },
  DUE_TODAY: { backgroundColor: colors.magenta, color: colors.white },
  AT_RISK: { backgroundColor: colors.purple, color: colors.white },
  OVERDUE: { backgroundColor: colors.primary, color: colors.white },
  ON_HOLD: { backgroundColor: colors.darkGray, color: colors.white },
}

const StatusBadge = ({ dueStatus, priority }: StatusBadgeProps) => {
  if (dueStatus) {
    return (
      <span
        className={`badge badge-due badge-${dueStatus.toLowerCase()}`}
        style={dueStatusStyles[dueStatus]}
      >
        {DUE_STATUS_LABELS[dueStatus]}
      </span>
    )
  }

  if (priority) {
    return (
      <span
        className="badge badge-priority"
        style={{ backgroundColor: '#E9EDFF', color: colors.primary }}
      >
        {priorityLabels[priority]}
      </span>
    )
  }

  return null
}

export default StatusBadge
