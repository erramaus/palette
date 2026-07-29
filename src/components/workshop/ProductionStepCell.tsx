import type { ProductionStepStatus } from '../../types/production'

interface ProductionStepCellProps {
  status: ProductionStepStatus
  onClick: () => void
}

const ProductionStepCell = ({ status, onClick }: ProductionStepCellProps) => {
  const content =
    status === 'COMPLETE' ? '✓' : status === 'NOT_APPLICABLE' ? 'N/A' : ''

  return (
    <button
      type="button"
      className={`step-cell step-${status.toLowerCase()}`}
      onClick={onClick}
      title={`Step status: ${status}`}
    >
      {content}
    </button>
  )
}

export default ProductionStepCell
