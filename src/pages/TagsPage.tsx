import { useAppState } from '../state/AppStateContext'

const TagsPage = () => {
	const { operationTags } = useAppState()

	return (
		<section className="page">
			<header className="page-heading">
				<h2>Production Tags</h2>
				<p>One inherited production tag for every required operation.</p>
			</header>

			<section className="panel">
				<div className="work-item-section-header">
					<h3>Operation Tags</h3>
					<span className="subtle">{operationTags.length} generated</span>
				</div>
				<div className="table-wrap">
					<table className="workshop-table">
						<thead><tr><th>Order</th><th>Artwork</th><th>Piece</th><th>Operation</th><th>Assigned</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead>
						<tbody>
							{operationTags.map((tag) => (
								<tr key={tag.id}>
									<td><strong>{tag.orderNumber}</strong><br /><span className="subtle">{tag.customerName}</span></td>
									<td>{tag.artworkName}</td><td>{tag.pieceLabel}<br /><span className="subtle">{tag.orientation}</span></td>
									<td><strong>{tag.operation}</strong></td><td>{tag.assignedEmployeeId ?? 'Unassigned'}</td>
									<td>{tag.dueDate ? new Date(tag.dueDate).toLocaleDateString() : '--'}</td>
									<td>P{tag.priority}</td><td>{tag.status}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</section>
	)
}

export default TagsPage
