import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'

const statusLabel = (status: string): string => status.split('_').map((part) =>
	part.charAt(0) + part.slice(1).toLowerCase()).join(' ')

const TagsPage = () => {
	const navigate = useNavigate()
	const { productionTags, generateProductionTags, printProductionTag } = useAppState()
	const viewSource = (tag: (typeof productionTags)[number]): void => {
		const trace = tag.cutCalculation?.trace
		window.alert(trace
			? `${trace.explanation}\n\nRules: ${trace.ruleIds.join(', ') || 'No confirmed rule'}\nConfidence: ${trace.confidence}\nInputs: ${JSON.stringify(trace.normalizedInputs, null, 2)}`
			: 'This primary tag has no production-cut calculation.')
	}

	return (
		<section className="page">
			<header className="page-heading">
				<h2>Production Tags</h2>
				<p>Printable production tags generated from confirmed cut calculations.</p>
			</header>

			<section className="panel">
				<div className="work-item-section-header">
					<h3>Tag Lifecycle</h3>
					<span className="subtle">{productionTags.length} generated</span>
				</div>
				<div className="table-wrap">
					<table className="workshop-table">
						<thead><tr><th>Work Item</th><th>Artwork</th><th>Type</th><th>Dimensions</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
						<tbody>
							{productionTags.map((tag) => (
								<tr key={tag.id}>
									<td><strong>{tag.workItemNumber}</strong><br /><span className="subtle">{tag.customerDisplayName}</span></td>
									<td>{tag.artworkName}</td><td><strong>{tag.tagType}</strong><br /><span className="subtle">{tag.normalizedFrameName ?? tag.productType ?? ''}</span></td>
									<td>{tag.finishedDimensions ? `${tag.finishedDimensions.width} x ${tag.finishedDimensions.height} in` : '--'}</td>
									<td>{tag.dueDate ? new Date(tag.dueDate).toLocaleDateString() : '--'}</td>
									<td><span className={`tag-status tag-status-${tag.status.toLowerCase()}`}>{statusLabel(tag.status)}</span></td>
									<td><div className="tag-actions">
										<button type="button" className="btn" onClick={() => navigate(`/work-items/${tag.workItemId}`)}>Review Calculation</button>
										<button type="button" className="btn" onClick={() => generateProductionTags(tag.workItemId)}>Regenerate Tag</button>
										<button type="button" className="btn btn-primary" disabled={tag.status !== 'READY_TO_PRINT'} onClick={() => printProductionTag(tag.workItemId, tag.id)}>Print Tag</button>
										<button type="button" className="btn" onClick={() => viewSource(tag)}>View Calculation Source</button>
									</div></td>
								</tr>
							))}
							{productionTags.length === 0 && <tr><td colSpan={7} className="subtle">No production tags have been generated yet.</td></tr>}
						</tbody>
					</table>
				</div>
			</section>
		</section>
	)
}

export default TagsPage
