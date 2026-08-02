import PrintTableOptimizerModule from '../../components/tools/printTableOptimizer/PrintTableOptimizerModule'

const PrintTableOptimizerPage = () => {
  return (
    <section className="page print-table-optimizer-page">
      <header className="page-heading">
        <h2>Print Table Optimizer</h2>
        <p>
          Arrange paintings on the 98 x 80 inch print table, preserve orientation,
          maintain required spacing, and generate placement coordinates.
        </p>
      </header>

      <PrintTableOptimizerModule />
    </section>
  )
}

export default PrintTableOptimizerPage