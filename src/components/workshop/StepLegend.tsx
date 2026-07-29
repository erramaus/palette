const StepLegend = () => {
  return (
    <div className="step-legend" aria-label="Workshop step legend">
      <div className="legend-item">
        <span className="step-cell step-waiting" />
        <span>Waiting</span>
      </div>
      <div className="legend-item">
        <span className="step-cell step-complete">✓</span>
        <span>Complete</span>
      </div>
      <div className="legend-item">
        <span className="step-cell step-not_applicable">N/A</span>
        <span>Not Applicable</span>
      </div>
    </div>
  )
}

export default StepLegend
