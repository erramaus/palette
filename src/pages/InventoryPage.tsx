import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { WarehouseInventoryImportService } from '../services/WarehouseInventoryImportService'
import type { InventoryCountEntryStatus, InventoryFoundationState, InventoryItem } from '../types/inventory'

const inventoryService = new WarehouseInventoryImportService()

const formatNumber = (value: number | null): string =>
	typeof value === 'number' && Number.isFinite(value) ? `${value}` : '--'

const formatCurrency = (value: number | null): string =>
	typeof value === 'number' && Number.isFinite(value)
		? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
		: '--'

const isLowStock = (item: InventoryItem): boolean =>
	item.reorderLevel !== null && item.quantityAvailable <= item.reorderLevel

const InventoryPage = () => {
	const { productionJobs } = useAppState()

	const [state, setState] = useState<InventoryFoundationState>(() => {
		const loaded = inventoryService.load()
		const initialized = inventoryService.importFromSeed(loaded)
		inventoryService.save(initialized)
		return initialized
	})

	const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
	const [filterCategory, setFilterCategory] = useState('')
	const [filterLocation, setFilterLocation] = useState('')
	const [filterSupplier, setFilterSupplier] = useState('')
	const [filterLowStock, setFilterLowStock] = useState(false)
	const [filterPurchaseNeeded, setFilterPurchaseNeeded] = useState(false)
	const [filterNeedsReview, setFilterNeedsReview] = useState(false)
	const [filterErinsStudio, setFilterErinsStudio] = useState(false)
	const [filterMoulding, setFilterMoulding] = useState(false)
	const [reserveAmount, setReserveAmount] = useState('')
	const [countNotes, setCountNotes] = useState<Record<string, string>>({})
	const [countValues, setCountValues] = useState<Record<string, string>>({})
	const [countStatuses, setCountStatuses] = useState<Record<string, InventoryCountEntryStatus>>({})
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const activeItems = useMemo(() => state.items.filter((item) => item.active), [state.items])

	const filteredItems = useMemo(() => {
		return activeItems.filter((item) => {
			if (filterCategory && item.categoryName !== filterCategory) return false
			if (filterLocation && item.locationName !== filterLocation) return false
			if (filterSupplier && item.preferredSupplierName !== filterSupplier) return false
			if (filterLowStock && !isLowStock(item)) return false
			if (filterPurchaseNeeded) {
				const recommendation = state.recommendations.find((candidate) => candidate.itemId === item.id)
				if (!recommendation || recommendation.observedShortage <= 0) return false
			}
			if (filterNeedsReview && item.status !== 'NEEDS_REVIEW') return false
			if (filterErinsStudio && item.locationName !== 'Erins Studio') return false
			if (filterMoulding) {
				const text = `${item.name} ${item.description ?? ''} ${item.categoryName}`.toLowerCase()
				if (!text.includes('mould')) return false
			}
			return true
		})
	}, [
		activeItems,
		filterCategory,
		filterErinsStudio,
		filterLocation,
		filterLowStock,
		filterMoulding,
		filterNeedsReview,
		filterPurchaseNeeded,
		filterSupplier,
		state.recommendations,
	])

	const selectedItem = useMemo(
		() => state.items.find((item) => item.id === selectedItemId) ?? null,
		[selectedItemId, state.items],
	)

	const latestSession = useMemo(
		() => state.sessions.find((session) => session.status === 'IN_PROGRESS' || session.status === 'SUBMITTED') ?? null,
		[state.sessions],
	)

	const sessionEntries = useMemo(() => {
		if (!latestSession) return []
		const entryIdSet = new Set(latestSession.entryIds)
		return state.entries.filter((entry) => entryIdSet.has(entry.id))
	}, [latestSession, state.entries])

	const purchaseQueue = useMemo(
		() => state.recommendations.filter((recommendation) => recommendation.observedShortage > 0 || recommendation.status === 'NEEDS_REVIEW'),
		[state.recommendations],
	)

	const affectedProductionOperations = useMemo(() => {
		if (!selectedItem) return []
		const tokens = `${selectedItem.name} ${selectedItem.description ?? ''}`
			.toLowerCase()
			.split(/[^a-z0-9]+/)
			.filter((token) => token.length >= 4)
			.slice(0, 8)
		if (tokens.length === 0) return []

		return productionJobs
			.filter((job) => {
				const haystack = `${job.notes} ${job.frameInfo} ${job.artworkTitle}`.toLowerCase()
				return tokens.some((token) => haystack.includes(token))
			})
			.slice(0, 8)
			.map((job) => `${job.orderNumber} · ${job.artworkTitle}`)
	}, [productionJobs, selectedItem])

	const saveState = (next: InventoryFoundationState): void => {
		setState(next)
		inventoryService.save(next)
	}

	const reimportWorkbook = (): void => {
		saveState(inventoryService.importFromSeed(state))
	}

	const startWarehouseCount = (): void => {
		saveState(inventoryService.startWarehouseCount(state))
	}

	const submitSession = (): void => {
		if (!latestSession) return
		saveState(inventoryService.submitCountSession(state, latestSession.id))
	}

	const approveSession = (): void => {
		if (!latestSession) return
		saveState(inventoryService.approveCountSession(state, latestSession.id))
	}

	const updateEntry = (entryId: string): void => {
		const quantityRaw = countValues[entryId]
		const quantity = quantityRaw === undefined || quantityRaw.trim() === '' ? null : Number(quantityRaw)
		const status = countStatuses[entryId] ?? 'COUNTED'

		saveState(
			inventoryService.updateCountEntry(state, entryId, {
				countedQuantity: quantity,
				status,
				countNotes: countNotes[entryId] ?? '',
			}),
		)
	}

	const reserveSelected = (): void => {
		if (!selectedItem) return
		const quantity = Number(reserveAmount)
		try {
			saveState(inventoryService.reserveItem(state, selectedItem.id, quantity))
			setReserveAmount('')
			setErrorMessage(null)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Reserve failed.')
		}
	}

	const releaseSelected = (): void => {
		if (!selectedItem) return
		const quantity = Number(reserveAmount)
		try {
			saveState(inventoryService.releaseItem(state, selectedItem.id, quantity))
			setReserveAmount('')
			setErrorMessage(null)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Release failed.')
		}
	}

	return (
		<section className="page inventory-foundation-page">
			<header className="workshop-v2-header">
				<div>
					<h2>Inventory</h2>
					<p>Workbook-grounded inventory foundation from {state.workbookName}.</p>
				</div>
				<div className="workshop-v2-header-actions">
					<button type="button" className="btn btn-primary" onClick={startWarehouseCount}>
						Start Warehouse Count
					</button>
					<button type="button" className="btn" onClick={reimportWorkbook}>
						Reimport Workbook Seed
					</button>
					<span className="workshop-v2-count">{filteredItems.length} items</span>
				</div>
			</header>

			<section className="filters workshop-v2-filters" aria-label="Inventory filters">
				<label>
					Category
					<select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
						<option value="">All</option>
						{state.categories.map((category) => (
							<option key={category.id} value={category.name}>{category.name}</option>
						))}
					</select>
				</label>

				<label>
					Location
					<select value={filterLocation} onChange={(event) => setFilterLocation(event.target.value)}>
						<option value="">All</option>
						{state.locations.map((location) => (
							<option key={location.id} value={location.name}>{location.name}</option>
						))}
					</select>
				</label>

				<label>
					Supplier
					<select value={filterSupplier} onChange={(event) => setFilterSupplier(event.target.value)}>
						<option value="">All</option>
						{state.suppliers.map((supplier) => (
							<option key={supplier.id} value={supplier.name}>{supplier.name}</option>
						))}
					</select>
				</label>

				<label className="checkbox-label">
					<input type="checkbox" checked={filterLowStock} onChange={(event) => setFilterLowStock(event.target.checked)} />
					Low Stock
				</label>
				<label className="checkbox-label">
					<input type="checkbox" checked={filterPurchaseNeeded} onChange={(event) => setFilterPurchaseNeeded(event.target.checked)} />
					Purchase Needed
				</label>
				<label className="checkbox-label">
					<input type="checkbox" checked={filterNeedsReview} onChange={(event) => setFilterNeedsReview(event.target.checked)} />
					Needs Review
				</label>
				<label className="checkbox-label">
					<input type="checkbox" checked={filterErinsStudio} onChange={(event) => setFilterErinsStudio(event.target.checked)} />
					Erin&apos;s Studio
				</label>
				<label className="checkbox-label">
					<input type="checkbox" checked={filterMoulding} onChange={(event) => setFilterMoulding(event.target.checked)} />
					Moulding
				</label>
			</section>

			<section className="workshop-enterprise-layout">
				<section className="workshop-tree workshop-tree-enterprise" aria-label="Inventory table">
					  <div className="workshop-tree-header workshop-tree-header-enterprise inventory-grid-header">
						<span>Category</span>
						<span>Item</span>
						<span>Location</span>
						<span>Unit</span>
						<span>On Hand</span>
						<span>Reserved</span>
						<span>Available</span>
						<span>Reorder</span>
						<span>Suggested Purchase</span>
						<span>Supplier</span>
						<span>Status</span>
						<span>Last Counted</span>
					</div>

					{filteredItems.map((item) => {
						const recommendation = state.recommendations.find((candidate) => candidate.itemId === item.id)
						return (
							<button
								key={item.id}
								type="button"
								className={`workshop-tree-row workshop-tree-row-enterprise inventory-grid-row ${selectedItemId === item.id ? 'workshop-tree-row-selected' : ''}`}
								onClick={() => setSelectedItemId(item.id)}
							>
								<span>{item.categoryName}</span>
								<span>{item.name}</span>
								<span>{item.locationName}</span>
								<span>{item.unitOfMeasureLabel ?? '--'}</span>
								<span>{item.quantityOnHand}</span>
								<span>{item.quantityReserved}</span>
								<span>{item.quantityAvailable}</span>
								<span>{formatNumber(item.reorderLevel)}</span>
								<span>
									{recommendation?.suggestedPurchaseQuantity !== null && recommendation?.suggestedPurchaseQuantity !== undefined
										? recommendation.suggestedPurchaseQuantity
										: recommendation?.status === 'NEEDS_REVIEW'
											? 'NEEDS_REVIEW'
											: '--'}
								</span>
								<span>{item.preferredSupplierName ?? '--'}</span>
								<span className={`workshop-status-badge workshop-status-${item.status === 'NEEDS_REVIEW' ? 'review' : item.active ? 'ready' : 'default'}`}>
									{item.status}
								</span>
								<span>{item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString() : '--'}</span>
							</button>
						)
					})}
				</section>

				<aside className={selectedItem ? 'workshop-drawer' : 'workshop-drawer workshop-drawer-empty'}>
					{!selectedItem && (
						<div className="workshop-drawer-placeholder">
							<h3>Inventory Detail</h3>
							<p className="subtle">Select an item to view source trace, count history, and recommendations.</p>
						</div>
					)}

					{selectedItem && (
						<div className="workshop-drawer-content">
							<header className="workshop-drawer-header">
								<div>
									<h3>{selectedItem.name}</h3>
									<p className="subtle">{selectedItem.locationName} · {selectedItem.categoryName}</p>
								</div>
							</header>

							<section>
								<h4>Item Details</h4>
								<dl className="workshop-drawer-meta-grid">
									<div><dt>SKU</dt><dd>{selectedItem.sku ?? '--'}</dd></div>
									<div><dt>Unit</dt><dd>{selectedItem.unitOfMeasureLabel ?? '--'}</dd></div>
									<div><dt>Unit Cost</dt><dd>{formatCurrency(selectedItem.unitCost)}</dd></div>
									<div><dt>On Hand</dt><dd>{selectedItem.quantityOnHand}</dd></div>
									<div><dt>Reserved</dt><dd>{selectedItem.quantityReserved}</dd></div>
									<div><dt>Available</dt><dd>{selectedItem.quantityAvailable}</dd></div>
									<div><dt>Reorder</dt><dd>{formatNumber(selectedItem.reorderLevel)}</dd></div>
									<div><dt>Desired</dt><dd>{formatNumber(selectedItem.desiredStock)}</dd></div>
								</dl>
							</section>

							<section>
								<h4>Counting Instructions</h4>
								<p className="subtle">General rule from training guide: open packages are generally not counted as available stock unless item-specific guidance overrides.</p>
							</section>

							<section>
								<h4>Count History</h4>
								<ul className="workshop-drawer-list">
									{state.sessions
										.filter((session) => session.entryIds.some((entryId) => {
											const entry = state.entries.find((candidate) => candidate.id === entryId)
											return entry?.itemId === selectedItem.id
										}))
										.slice(0, 6)
										.map((session) => (
											<li key={session.id}>{session.inventoryDate} · {session.status}</li>
										))}
								</ul>
							</section>

							<section>
								<h4>Adjustments</h4>
								<ul className="workshop-drawer-list">
									{state.adjustments.filter((adjustment) => adjustment.itemId === selectedItem.id).slice(0, 8).map((adjustment) => (
										<li key={adjustment.id}>{adjustment.quantityDelta > 0 ? '+' : ''}{adjustment.quantityDelta} · {new Date(adjustment.occurredAt).toLocaleString()} · {adjustment.reason}</li>
									))}
								</ul>
							</section>

							<section>
								<h4>Supplier / Cost</h4>
								<p className="subtle">{selectedItem.preferredSupplierName ?? '--'} · {formatCurrency(selectedItem.unitCost)}</p>
							</section>

							<section>
								<h4>Affected Production Operations</h4>
								<ul className="workshop-drawer-list">
									{affectedProductionOperations.length > 0
										? affectedProductionOperations.map((operation) => <li key={operation}>{operation}</li>)
										: <li>NEEDS_REVIEW: no confirmed operation link found from current source fields.</li>}
								</ul>
							</section>

							<section>
								<h4>Source Worksheet / Row</h4>
								<p className="subtle">{selectedItem.sourceTrace.worksheetName} row {selectedItem.sourceTrace.rowNumber} ({selectedItem.sourceTrace.sourceRef})</p>
							</section>

							<section>
								<h4>Reserve / Release</h4>
								<div className="button-row">
									<input
										type="number"
										min={1}
										value={reserveAmount}
										onChange={(event) => setReserveAmount(event.target.value)}
										placeholder="Quantity"
									/>
									<button type="button" className="btn" onClick={reserveSelected}>Reserve</button>
									<button type="button" className="btn" onClick={releaseSelected}>Release</button>
								</div>
								{errorMessage && <p className="warning">{errorMessage}</p>}
							</section>
						</div>
					)}
				</aside>
			</section>

			<section className="panel">
				<h3>Count Session</h3>
				{!latestSession && <p className="subtle">No active count session.</p>}
				{latestSession && (
					<>
						<p className="subtle">Session {latestSession.inventoryDate} · {latestSession.status}</p>
						<div className="button-row">
							{latestSession.status === 'IN_PROGRESS' && (
								<button type="button" className="btn" onClick={submitSession}>Submit Count Session</button>
							)}
							{latestSession.status === 'SUBMITTED' && (
								<button type="button" className="btn btn-primary" onClick={approveSession}>Approve Count Session</button>
							)}
						</div>
						<div className="table-wrap">
							<table className="workshop-table">
								<thead>
									<tr>
										<th>Location</th>
										<th>Category</th>
										<th>Item</th>
										<th>Previous</th>
										<th>Counted</th>
										<th>Status</th>
										<th>Notes</th>
										<th>Save</th>
									</tr>
								</thead>
								<tbody>
									{sessionEntries.slice(0, 60).map((entry) => {
										const item = state.items.find((candidate) => candidate.id === entry.itemId)
										return (
											<tr key={entry.id}>
												<td>{entry.locationName}</td>
												<td>{entry.categoryName}</td>
												<td>{item?.name ?? entry.itemId}</td>
												<td>{entry.previousOnHand}</td>
												<td>
													<input
														type="number"
														value={countValues[entry.id] ?? ''}
														onChange={(event) => setCountValues((current) => ({ ...current, [entry.id]: event.target.value }))}
													/>
												</td>
												<td>
													<select
														value={countStatuses[entry.id] ?? 'COUNTED'}
														onChange={(event) => setCountStatuses((current) => ({ ...current, [entry.id]: event.target.value as InventoryCountEntryStatus }))}
													>
														<option value="COUNTED">COUNTED</option>
														<option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
														<option value="DISCREPANCY">DISCREPANCY</option>
													</select>
												</td>
												<td>
													<input
														type="text"
														value={countNotes[entry.id] ?? ''}
														onChange={(event) => setCountNotes((current) => ({ ...current, [entry.id]: event.target.value }))}
													/>
												</td>
												<td>
													<button type="button" className="btn" onClick={() => updateEntry(entry.id)}>Save</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</>
				)}
			</section>

			<section className="panel">
				<h3>Purchase Review Queue</h3>
				<p className="subtle">Recommendations are review-only. No purchase orders are auto-created.</p>
				<div className="table-wrap">
					<table className="workshop-table">
						<thead>
							<tr>
								<th>Item</th>
								<th>Location</th>
								<th>Available</th>
								<th>Desired</th>
								<th>Reorder</th>
								<th>Suggested Purchase</th>
								<th>Status</th>
								<th>Rationale</th>
							</tr>
						</thead>
						<tbody>
							{purchaseQueue.slice(0, 120).map((recommendation) => {
								const item = state.items.find((candidate) => candidate.id === recommendation.itemId)
								return (
									<tr key={recommendation.id}>
										<td>{item?.name ?? recommendation.itemId}</td>
										<td>{item?.locationName ?? recommendation.worksheetName}</td>
										<td>{recommendation.availableQuantity}</td>
										<td>{formatNumber(recommendation.desiredStock)}</td>
										<td>{formatNumber(recommendation.reorderLevel)}</td>
										<td>{formatNumber(recommendation.suggestedPurchaseQuantity)}</td>
										<td>{recommendation.status}</td>
										<td>{recommendation.rationale}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</section>
		</section>
	)
}

export default InventoryPage
