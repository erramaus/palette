interface SummaryCardProps {
  label: string
  value: number
}

const SummaryCard = ({ label, value }: SummaryCardProps) => {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  )
}

export default SummaryCard
