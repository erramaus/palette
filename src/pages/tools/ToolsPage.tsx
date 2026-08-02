import ToolCard, { type ToolCardItem, type ToolStatus } from '../../components/tools/ToolCard'

const statusLegend: ToolStatus[] = ['Available', 'In Development', 'Planned']

const toolCatalog: ToolCardItem[] = [
  {
    name: 'Print Table Optimizer',
    description:
      'Arrange paintings on the 98 x 80 inch print table, preserve orientation, maintain required spacing, and generate placement coordinates.',
    status: 'Available',
    routePath: '/tools/print-table-optimizer',
  },
  {
    name: 'Frame Cut Calculator',
    description: 'Planned utility for fast frame-cut dimension calculations.',
    status: 'Planned',
  },
  {
    name: 'Stretcher/Base Calculator',
    description: 'Planned utility for stretcher and base requirement calculations.',
    status: 'Planned',
  },
  {
    name: 'Box Size Calculator',
    description: 'Planned utility for boxing dimensions and packing checks.',
    status: 'Planned',
  },
  {
    name: '3D File Prep Helper',
    description: 'Planned utility for standardized 3D file preparation checks.',
    status: 'Planned',
  },
  {
    name: 'Material Usage Calculator',
    description: 'Planned utility for forecasting substrate and material consumption.',
    status: 'Planned',
  },
  {
    name: 'Shipping Dimension Tool',
    description: 'Planned utility for parcel sizing and dimensional-weight checks.',
    status: 'Planned',
  },
]

const ToolsPage = () => {
  const availableTools = toolCatalog.filter((tool) => tool.status === 'Available')
  const plannedTools = toolCatalog.filter((tool) => tool.status !== 'Available')

  return (
    <section className="page tools-library-page">
      <header className="page-heading">
        <h2>Tools Library</h2>
        <p>Internal utility applications for production workflows.</p>
      </header>

      <article className="panel tools-status-panel">
        <h3>Status Legend</h3>
        <div className="tools-status-legend" role="list" aria-label="Tool statuses">
          {statusLegend.map((status) => (
            <span key={status} className={`badge tool-status tool-status-${status.toLowerCase().replace(' ', '-')}`} role="listitem">
              {status}
            </span>
          ))}
        </div>
      </article>

      <article className="panel">
        <h3>Available Tools</h3>
        <div className="tools-grid">
          {availableTools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </article>

      <article className="panel">
        <h3>Planned Tools</h3>
        <div className="tools-grid">
          {plannedTools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </article>
    </section>
  )
}

export default ToolsPage