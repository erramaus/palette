interface InventorySummaryCardProps {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
}

const InventorySummaryCard = ({
  label,
  value,
  detail,
  tone = 'default',
}: InventorySummaryCardProps) => {
  return (
    <article className={`inventory-summary-card inventory-summary-card-${tone}`}>
      <span className="inventory-summary-label">{label}</span>
      <strong className="inventory-summary-value">{value}</strong>
      <p className="inventory-summary-detail">{detail}</p>
    </article>
  )
}

export default InventorySummaryCard