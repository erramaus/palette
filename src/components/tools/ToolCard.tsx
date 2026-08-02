import { Link } from 'react-router-dom'

export type ToolStatus = 'Available' | 'In Development' | 'Planned'

export interface ToolCardItem {
  name: string
  description: string
  status: ToolStatus
  routePath?: string
}

interface ToolCardProps {
  tool: ToolCardItem
}

const statusClassMap: Record<ToolStatus, string> = {
  Available: 'tool-status-available',
  'In Development': 'tool-status-development',
  Planned: 'tool-status-planned',
}

const ToolCard = ({ tool }: ToolCardProps) => {
  const canOpen = tool.status === 'Available' && Boolean(tool.routePath)

  return (
    <article className="panel tool-card">
      <div className="tool-card-head">
        <h4>{tool.name}</h4>
        <span className={`badge tool-status ${statusClassMap[tool.status]}`}>{tool.status}</span>
      </div>
      <p>{tool.description}</p>
      {canOpen ? (
        <Link className="btn btn-primary tool-card-open" to={tool.routePath!}>
          Open Tool
        </Link>
      ) : (
        <button type="button" className="btn tool-card-open" disabled>
          Open Tool
        </button>
      )}
    </article>
  )
}

export default ToolCard