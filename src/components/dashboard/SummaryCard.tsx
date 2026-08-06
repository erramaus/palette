import { useNavigate } from 'react-router-dom'

interface SummaryCardProps {
  label: string
  value: string | number
  to: string
  hint?: string
}

const SummaryCard = ({ label, value, to, hint = 'View' }: SummaryCardProps) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="summary-card summary-card-action"
      onClick={() => navigate(to)}
      aria-label={`${label} ${hint}`}
    >
      <p>{label}</p>
      <h3>{value}</h3>
      <span className="summary-card-hint" aria-hidden="true">
        {hint} →
      </span>
    </button>
  )
}

export default SummaryCard
