import { getPriorityPresentation } from '../../utils/priorityPresentation'

interface PriorityBadgeProps {
  priority: number
  className?: string
}

const PriorityBadge = ({ priority, className = '' }: PriorityBadgeProps) => {
  const presentation = getPriorityPresentation(priority)

  return (
    <span
      className={`priority-pill priority-pill-${presentation.tone} ${className}`.trim()}
      title={presentation.tooltip}
      aria-label={`${presentation.label}. ${presentation.tooltip}`}
    >
      {presentation.label}
    </span>
  )
}

export default PriorityBadge
