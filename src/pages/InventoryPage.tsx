import { useEffect, useMemo, useRef, useState } from 'react'
import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import { useAppState } from '../state/AppStateContext'
import { WarehouseInventoryImportService } from '../services/WarehouseInventoryImportService'
import type {
  InventoryCountEntry,
  InventoryCountEntryStatus,
  InventoryFoundationState,
  InventoryItem,
  InventoryPurchaseRecommendation,
} from '../types/inventory'

const inventoryService = new WarehouseInventoryImportService()

type InventorySortColumn =
  | 'item'
  | 'category'
  | 'location'
  | 'onHand'
  | 'reserved'
  | 'available'
  | 'unit'
  | 'supplier'
  | 'status'
  | 'lastCounted'

type InventorySortDirection = 'asc' | 'desc'

type MaterialForecastBucket =
  | 'Frames'
  | 'Stretchers'
  | 'Bases'
  | 'Dibond'
  | 'Packaging'
  | 'Print Materials'

const formatCurrency = (value: number | null): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
    : '--'

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString() : '--'

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : '--'

const isLowStock = (item: InventoryItem): boolean =>
  item.reorderLevel !== null && item.quantityAvailable <= item.reorderLevel

const toggleSortDirection = (
  currentColumn: InventorySortColumn,
  nextColumn: InventorySortColumn,
  currentDirection: InventorySortDirection,
): InventorySortDirection => {
  if (currentColumn !== nextColumn) {
    return nextColumn === 'item' || nextColumn === 'category' || nextColumn === 'location' ? 'asc' : 'desc'
  }

  return currentDirection === 'asc' ? 'desc' : 'asc'
}

const getItemTokens = (item: InventoryItem): string[] => {
  return [...new Set(
    `${item.name} ${item.description ?? ''} ${item.sku ?? ''}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4),
  )].slice(0, 10)
}

const getRelatedProductionJobs = (item: InventoryItem, haystacks: Array<{ id: string; haystack: string; label: string; dueDate: string }>) => {
  const tokens = getItemTokens(item)
  if (tokens.length === 0) return []

  return haystacks
    .filter((job) => tokens.some((token) => job.haystack.includes(token)))
    .slice(0, 8)
}

const getMaterialBucket = (item: InventoryItem): MaterialForecastBucket | null => {
  const text = `${item.categoryName} ${item.subcategory ?? ''} ${item.name} ${item.description ?? ''} ${item.preferredSupplierName ?? ''}`.toLowerCase()

  if (text.includes('stretcher') || text.includes('strainer')) return 'Stretchers'
  if (text.includes('dibond')) return 'Dibond'
  if (/\bbase\b/.test(text)) return 'Bases'
  if (text.includes('mould') || /\bframe\b/.test(text)) return 'Frames'
  if (text.includes('packag') || text.includes('shipping') || text.includes('crate') || /\bbox\b/.test(text)) return 'Packaging'
  if (text.includes('print') || text.includes('paper') || text.includes('canvas') || text.includes('printer')) return 'Print Materials'

  return null
}

const getInventoryStatusTone = (item: InventoryItem): 'ready' | 'warning' | 'review' | 'muted' => {
  if (!item.active) return 'muted'
  if (item.status === 'NEEDS_REVIEW') return 'review'
  if (isLowStock(item)) return 'warning'
  return 'ready'
}

const getRecommendationPriority = (recommendation: InventoryPurchaseRecommendation, item: InventoryItem | null): string => {
  if (recommendation.status === 'NEEDS_REVIEW') return 'Needs Review'
  if ((item?.quantityAvailable ?? recommendation.availableQuantity) <= 0) return 'Critical'
  if (recommendation.observedShortage > 0) return 'High'
  return 'Routine'
}

const getDirectorApprovalLabel = (recommendation: InventoryPurchaseRecommendation): string => {
  if (recommendation.status === 'NEEDS_REVIEW') return 'Review Source Row'
  if (recommendation.observedShortage > 0) return 'Pending Director'
  return 'Not Required'
}

const InventoryPage = () => {
  const { productionJobs } = useAppState()

  const countWorkspaceRef = useRef<HTMLElement | null>(null)
  const purchaseWorkspaceRef = useRef<HTMLElement | null>(null)
	const drawerRef = useRef<HTMLElement | null>(null)

	const [state, setState] = useState<InventoryFoundationState>(() => {
		const loaded = inventoryService.load()
		const initialized = inventoryService.importFromSeed(loaded)
		inventoryService.save(initialized)
		return initialized
	})

	const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [filterCategory, setFilterCategory] = useState('')
	const [filterLocation, setFilterLocation] = useState('')
	const [filterSupplier, setFilterSupplier] = useState('')
	const [filterLowStock, setFilterLowStock] = useState(false)
	const [filterPurchaseNeeded, setFilterPurchaseNeeded] = useState(false)
	const [filterNeedsReview, setFilterNeedsReview] = useState(false)
	const [sortColumn, setSortColumn] = useState<InventorySortColumn>('available')
	const [sortDirection, setSortDirection] = useState<InventorySortDirection>('desc')
	const [reserveAmount, setReserveAmount] = useState('')
	const [countNotes, setCountNotes] = useState<Record<string, string>>({})
	const [countValues, setCountValues] = useState<Record<string, string>>({})
	const [countStatuses, setCountStatuses] = useState<Record<string, InventoryCountEntryStatus>>({})
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		if (!selectedItemId) return

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				setSelectedItemId(null)
			}
		}

		const handlePointerDown = (event: PointerEvent): void => {
			if (window.innerWidth <= 1180) return
			const target = event.target as HTMLElement | null
			if (!target) return
			if (target.closest('.inventory-row')) return
			if (drawerRef.current?.contains(target)) return
			setSelectedItemId(null)
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('pointerdown', handlePointerDown)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [selectedItemId])

	const activeItems = useMemo(() => state.items.filter((item) => item.active), [state.items])
	const recommendationByItemId = useMemo(
		() => new Map(state.recommendations.map((recommendation) => [recommendation.itemId, recommendation])),
		[state.recommendations],
	)

	const productionJobHaystacks = useMemo(
		() => productionJobs.map((job) => ({
			id: job.id,
			label: `${job.orderNumber} · ${job.artworkTitle}`,
			dueDate: job.dueDate,
			haystack: `${job.orderNumber} ${job.artworkTitle} ${job.notes} ${job.frameInfo}`.toLowerCase(),
		})),
		[productionJobs],
	)

	const filteredItems = useMemo(() => {
		const normalizedSearch = searchQuery.trim().toLowerCase()

		return activeItems.filter((item) => {
			const recommendation = recommendationByItemId.get(item.id)

			if (filterCategory && item.categoryName !== filterCategory) return false
			if (filterLocation && item.locationName !== filterLocation) return false
			if (filterSupplier && item.preferredSupplierName !== filterSupplier) return false
			if (filterLowStock && !isLowStock(item)) return false
			if (filterPurchaseNeeded && (!recommendation || recommendation.observedShortage <= 0)) return false
			if (filterNeedsReview && item.status !== 'NEEDS_REVIEW') return false

			if (normalizedSearch) {
				const haystack = `${item.name} ${item.description ?? ''} ${item.sku ?? ''} ${item.categoryName} ${item.locationName} ${item.preferredSupplierName ?? ''}`.toLowerCase()
				if (!haystack.includes(normalizedSearch)) return false
			}

			return true
		})
	}, [
		activeItems,
		filterCategory,
		filterLocation,
		filterLowStock,
		filterNeedsReview,
		filterPurchaseNeeded,
		filterSupplier,
		recommendationByItemId,
		searchQuery,
	])

	const sortedItems = useMemo(() => {
		const getSortValue = (item: InventoryItem): number | string => {
			switch (sortColumn) {
				case 'item':
					return item.name
				case 'category':
					return item.categoryName
				case 'location':
					return item.locationName
				case 'onHand':
					return item.quantityOnHand
				case 'reserved':
					return item.quantityReserved
				case 'available':
					return item.quantityAvailable
				case 'unit':
					return item.unitOfMeasureLabel ?? ''
				case 'supplier':
					return item.preferredSupplierName ?? ''
				case 'status':
					return item.status
				case 'lastCounted':
					return item.lastCountedAt ? new Date(item.lastCountedAt).getTime() : 0
				default:
					return item.name
			}
		}

		return [...filteredItems].sort((left, right) => {
			const leftValue = getSortValue(left)
			const rightValue = getSortValue(right)

			let comparison = 0
			if (typeof leftValue === 'number' && typeof rightValue === 'number') {
				comparison = leftValue - rightValue
			} else {
				comparison = String(leftValue).localeCompare(String(rightValue))
			}

			return sortDirection === 'asc' ? comparison : -comparison
		})
	}, [filteredItems, sortColumn, sortDirection])

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

	const selectedItemSessionEntries = useMemo(() => {
		if (!selectedItem) return []
		return state.entries.filter((entry) => entry.itemId === selectedItem.id)
	}, [selectedItem, state.entries])

	const purchaseQueue = useMemo(
		() => state.recommendations.filter((recommendation) => recommendation.observedShortage > 0 || recommendation.status === 'NEEDS_REVIEW'),
		[state.recommendations],
	)

	const selectedItemRecommendation = useMemo(
		() => (selectedItem ? recommendationByItemId.get(selectedItem.id) ?? null : null),
		[recommendationByItemId, selectedItem],
	)

	const relatedJobsByItemId = useMemo(() => {
		const related = new Map<string, ReturnType<typeof getRelatedProductionJobs>>()
		activeItems.forEach((item) => {
			related.set(item.id, getRelatedProductionJobs(item, productionJobHaystacks))
		})
		return related
	}, [activeItems, productionJobHaystacks])

	const selectedItemRelatedJobs = useMemo(
		() => (selectedItem ? relatedJobsByItemId.get(selectedItem.id) ?? [] : []),
		[relatedJobsByItemId, selectedItem],
	)

	const countWorkspaceSummary = useMemo(() => {
		const approvedEntryIds = new Set(
			state.sessions
				.filter((session) => session.status === 'APPROVED')
				.flatMap((session) => session.entryIds),
		)

		return {
			draftCounts: sessionEntries.filter((entry) => entry.status === 'DRAFT').length,
			approvedCounts: state.entries.filter((entry) => approvedEntryIds.has(entry.id)).length,
			discrepancies: sessionEntries.filter((entry) => entry.status === 'DISCREPANCY').length,
			needsReview: sessionEntries.filter((entry) => entry.status === 'NEEDS_REVIEW').length,
			approvalQueue: state.sessions.filter((session) => session.status === 'SUBMITTED').length,
		}
	}, [sessionEntries, state.entries, state.sessions])

	const inventoryTotals = useMemo(() => {
		const lowStockCount = activeItems.filter(isLowStock).length
		const reservedQuantity = activeItems.reduce((sum, item) => sum + item.quantityReserved, 0)
		const inventoryValue = activeItems.reduce((sum, item) => sum + (item.unitCost ?? 0) * item.quantityOnHand, 0)
		const healthyCount = activeItems.filter((item) => item.status !== 'NEEDS_REVIEW' && !isLowStock(item)).length
		const healthScore = activeItems.length > 0 ? Math.round((healthyCount / activeItems.length) * 100) : 0

		return {
			lowStockCount,
			reservedQuantity,
			inventoryValue,
			healthScore,
		}
	}, [activeItems])

	const materialForecastRows = useMemo(() => {
		const buckets: MaterialForecastBucket[] = ['Frames', 'Stretchers', 'Bases', 'Dibond', 'Packaging', 'Print Materials']

		return buckets.map((bucket) => {
			const bucketItems = activeItems.filter((item) => getMaterialBucket(item) === bucket)
			const matchedRecommendationShortage = bucketItems.reduce((sum, item) => sum + (recommendationByItemId.get(item.id)?.observedShortage ?? 0), 0)
			const current = bucketItems.reduce((sum, item) => sum + item.quantityOnHand, 0)
			const reserved = bucketItems.reduce((sum, item) => sum + item.quantityReserved, 0)
			const forecastRemaining = bucketItems.reduce((sum, item) => sum + item.quantityAvailable, 0) - matchedRecommendationShortage

			return {
				bucket,
				itemCount: bucketItems.length,
				current,
				reserved,
				forecastRemaining,
			}
		})
	}, [activeItems, recommendationByItemId])

	const selectedItemForecast = useMemo(() => {
		if (!selectedItem) return null

		const bucket = getMaterialBucket(selectedItem)
		if (!bucket) return null

		const recommendation = selectedItemRecommendation
		return {
			bucket,
			current: selectedItem.quantityOnHand,
			reserved: selectedItem.quantityReserved,
			forecastRemaining: selectedItem.quantityAvailable - (recommendation?.observedShortage ?? 0),
		}
	}, [selectedItem, selectedItemRecommendation])

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

	const closeSelectedItem = (): void => {
		setSelectedItemId(null)
	}

	const exportVisibleItems = (): void => {
		const header = ['Item', 'Category', 'Location', 'On Hand', 'Reserved', 'Available', 'Unit', 'Supplier', 'Status', 'Last Counted']
		const rows = sortedItems.map((item) => [
			item.name,
			item.categoryName,
			item.locationName,
			String(item.quantityOnHand),
			String(item.quantityReserved),
			String(item.quantityAvailable),
			item.unitOfMeasureLabel ?? '--',
			item.preferredSupplierName ?? '--',
			item.status,
			formatDate(item.lastCountedAt),
		])

		const csv = [header, ...rows]
			.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
			.join('\n')

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
		const url = window.URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = 'palette-inventory-export.csv'
		document.body.appendChild(anchor)
		anchor.click()
		anchor.remove()
		window.URL.revokeObjectURL(url)
	}

	const jumpToCountWorkspace = (): void => {
		countWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	const jumpToPurchaseWorkspace = (): void => {
		purchaseWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	const handleSort = (column: InventorySortColumn): void => {
		setSortDirection((currentDirection) => toggleSortDirection(sortColumn, column, currentDirection))
		setSortColumn(column)
	}

	const renderSortArrow = (column: InventorySortColumn): string => {
		if (sortColumn !== column) return '↕'
		return sortDirection === 'asc' ? '↑' : '↓'
	}

	const categories = useMemo(() => [...state.categories].sort((left, right) => left.name.localeCompare(right.name)), [state.categories])
	const locations = useMemo(() => [...state.locations].sort((left, right) => left.name.localeCompare(right.name)), [state.locations])
	const suppliers = useMemo(() => [...state.suppliers].sort((left, right) => left.name.localeCompare(right.name)), [state.suppliers])

	return (
		<section className="page inventory-foundation-page inventory-v2-page">
			<header className="inventory-v2-hero">
				<div className="inventory-v2-hero-copy">
					<span className="inventory-v2-eyebrow">Palette UI 2.0 · Warehouse Inventory</span>
					<h2>Manufacturing inventory workspace</h2>
					<p>
						Designed from the actual <strong>{state.workbookName}</strong> foundation with workbook traceability,
						 count-session operations, and review-only purchasing.
					</p>
				</div>
				<div className="inventory-v2-hero-actions">
					<button type="button" className="btn btn-primary inventory-v2-count-cta" onClick={startWarehouseCount}>
						Start Count Session
					</button>
					<button type="button" className="btn" onClick={reimportWorkbook}>
						Reimport Workbook Seed
					</button>
					<span className="inventory-v2-chip">{sortedItems.length} visible items</span>
				</div>
			</header>

			<section className="inventory-summary-grid" aria-label="Inventory summary">
				<InventorySummaryCard
					label="Total Inventory Value"
					value={formatCurrency(inventoryTotals.inventoryValue)}
					detail={`${activeItems.length} active workbook items`}
					tone="accent"
				/>
				<InventorySummaryCard
					label="Items Below Minimum"
					value={String(inventoryTotals.lowStockCount)}
					detail="Available quantity at or below reorder minimum"
					tone={inventoryTotals.lowStockCount > 0 ? 'warning' : 'success'}
				/>
				<InventorySummaryCard
					label="Purchase Recommendations"
					value={String(purchaseQueue.length)}
					detail={`${purchaseQueue.filter((item) => item.observedShortage > 0).length} shortage-driven reviews`}
					tone={purchaseQueue.length > 0 ? 'warning' : 'success'}
				/>
				<InventorySummaryCard
					label="Active Count Session"
					value={latestSession ? latestSession.status.replace('_', ' ') : 'None'}
					detail={latestSession ? `Session date ${latestSession.inventoryDate}` : 'No active warehouse count in progress'}
					tone={latestSession ? 'accent' : 'default'}
				/>
				<InventorySummaryCard
					label="Reserved Materials"
					value={String(inventoryTotals.reservedQuantity)}
					detail={`${activeItems.filter((item) => item.quantityReserved > 0).length} items with held quantity`}
					tone={inventoryTotals.reservedQuantity > 0 ? 'accent' : 'default'}
				/>
				<InventorySummaryCard
					label="Inventory Health"
					value={`${inventoryTotals.healthScore}%`}
					detail="Healthy items are not low-stock and not flagged for review"
					tone={inventoryTotals.healthScore >= 80 ? 'success' : inventoryTotals.healthScore >= 60 ? 'warning' : 'danger'}
				/>
			</section>

			<section className="inventory-toolbar" aria-label="Inventory toolbar">
				<label className="inventory-toolbar-search">
					<span>Search</span>
					<input
						type="search"
						placeholder="Item, SKU, workbook category, supplier"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
					/>
				</label>
				<label>
					<span>Category</span>
					<select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
						<option value="">All</option>
						{categories.map((category) => (
							<option key={category.id} value={category.name}>{category.name}</option>
						))}
					</select>
				</label>
				<label>
					<span>Location</span>
					<select value={filterLocation} onChange={(event) => setFilterLocation(event.target.value)}>
						<option value="">All</option>
						{locations.map((location) => (
							<option key={location.id} value={location.name}>{location.name}</option>
						))}
					</select>
				</label>
				<label>
					<span>Supplier</span>
					<select value={filterSupplier} onChange={(event) => setFilterSupplier(event.target.value)}>
						<option value="">All</option>
						{suppliers.map((supplier) => (
							<option key={supplier.id} value={supplier.name}>{supplier.name}</option>
						))}
					</select>
				</label>
				<button type="button" className={`inventory-toolbar-toggle ${filterLowStock ? 'is-active' : ''}`} onClick={() => setFilterLowStock((current) => !current)}>
					Low Stock
				</button>
				<button type="button" className={`inventory-toolbar-toggle ${filterPurchaseNeeded ? 'is-active' : ''}`} onClick={() => setFilterPurchaseNeeded((current) => !current)}>
					Purchase Needed
				</button>
				<button type="button" className={`inventory-toolbar-toggle ${filterNeedsReview ? 'is-active' : ''}`} onClick={() => setFilterNeedsReview((current) => !current)}>
					Needs Review
				</button>
				<button type="button" className="inventory-toolbar-toggle" onClick={jumpToCountWorkspace}>
					Count Session
				</button>
				<button type="button" className="inventory-toolbar-toggle" onClick={exportVisibleItems}>
					Export
				</button>
			</section>

			<section className={selectedItem ? 'inventory-workspace-layout inventory-workspace-layout-with-drawer' : 'inventory-workspace-layout'}>
				<div className="inventory-workspace-main">
					<section className="inventory-grid-card" aria-label="Inventory grid">
						<div className="inventory-grid-card-header">
							<div>
								<h3>Main Grid</h3>
								<p>Workbook-derived inventory table with inline search and column sorting.</p>
							</div>
							<button type="button" className="inventory-grid-utility" onClick={jumpToPurchaseWorkspace}>
								Open Purchase Review
							</button>
						</div>
						<div className="inventory-grid-scroll">
							<table className="inventory-enterprise-table">
								<thead>
									<tr>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('item')}>Item <span>{renderSortArrow('item')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('category')}>Category <span>{renderSortArrow('category')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('location')}>Location <span>{renderSortArrow('location')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('onHand')}>On Hand <span>{renderSortArrow('onHand')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('reserved')}>Reserved <span>{renderSortArrow('reserved')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('available')}>Available <span>{renderSortArrow('available')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('unit')}>Unit <span>{renderSortArrow('unit')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('supplier')}>Supplier <span>{renderSortArrow('supplier')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('status')}>Status <span>{renderSortArrow('status')}</span></button></th>
										<th><button type="button" className="inventory-sort-button" onClick={() => handleSort('lastCounted')}>Last Counted <span>{renderSortArrow('lastCounted')}</span></button></th>
									</tr>
								</thead>
								<tbody>
									{sortedItems.map((item, index) => {
										const recommendation = recommendationByItemId.get(item.id)
										return (
											<tr
												key={item.id}
												className={`inventory-row inventory-row-${index % 2 === 0 ? 'even' : 'odd'} ${selectedItemId === item.id ? 'inventory-row-selected' : ''}`}
												role="button"
												tabIndex={0}
												onClick={() => setSelectedItemId(item.id)}
												onKeyDown={(event) => {
													if (event.key === 'Enter' || event.key === ' ') {
														event.preventDefault()
														setSelectedItemId(item.id)
													}
												}}
											>
												<td>
													<div className="inventory-item-cell">
														<strong>{item.name}</strong>
														<span>{item.sku ?? item.sourceTrace.sourceRef}</span>
													</div>
												</td>
												<td>{item.categoryName}</td>
												<td>{item.locationName}</td>
												<td>{item.quantityOnHand}</td>
												<td>{item.quantityReserved}</td>
												<td>{item.quantityAvailable}</td>
												<td>{item.unitOfMeasureLabel ?? '--'}</td>
												<td>{item.preferredSupplierName ?? '--'}</td>
												<td>
													<span className={`inventory-pill inventory-pill-${getInventoryStatusTone(item)}`}>
														{item.status === 'ACTIVE' && isLowStock(item) ? 'LOW STOCK' : item.status}
													</span>
													{recommendation?.observedShortage ? <span className="inventory-pill inventory-pill-outline">Purchase {recommendation.observedShortage}</span> : null}
												</td>
												<td>{formatDate(item.lastCountedAt)}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</section>

					<div className="inventory-secondary-grid">
						<section className="inventory-workspace-card" ref={countWorkspaceRef}>
							<div className="inventory-section-header">
								<div>
									<h3>Count Session</h3>
									<p>Dedicated warehouse count workspace with session progress, approval routing, and discrepancy handling.</p>
								</div>
								<div className="inventory-section-actions">
									<button type="button" className="btn btn-primary inventory-v2-count-cta" onClick={startWarehouseCount}>
										Start Count Session
									</button>
									{latestSession?.status === 'IN_PROGRESS' ? (
										<button type="button" className="btn" onClick={submitSession}>Submit Count Session</button>
									) : null}
									{latestSession?.status === 'SUBMITTED' ? (
										<button type="button" className="btn" onClick={approveSession}>Approve Count Session</button>
									) : null}
								</div>
							</div>

							<div className="inventory-count-summary-grid">
								<div className="inventory-mini-stat"><span>Current Session</span><strong>{latestSession ? latestSession.inventoryDate : 'None'}</strong></div>
								<div className="inventory-mini-stat"><span>Draft Counts</span><strong>{countWorkspaceSummary.draftCounts}</strong></div>
								<div className="inventory-mini-stat"><span>Approved Counts</span><strong>{countWorkspaceSummary.approvedCounts}</strong></div>
								<div className="inventory-mini-stat"><span>Discrepancies</span><strong>{countWorkspaceSummary.discrepancies}</strong></div>
								<div className="inventory-mini-stat"><span>Needs Review</span><strong>{countWorkspaceSummary.needsReview}</strong></div>
								<div className="inventory-mini-stat"><span>Approval Queue</span><strong>{countWorkspaceSummary.approvalQueue}</strong></div>
							</div>

							{!latestSession ? (
								<p className="inventory-empty-state">No active count session. Start a warehouse count to populate draft counts and the approval queue.</p>
							) : (
								<div className="inventory-grid-scroll inventory-grid-scroll-short">
									<table className="inventory-enterprise-table inventory-enterprise-table-compact">
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
											{sessionEntries.slice(0, 60).map((entry: InventoryCountEntry) => {
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
																<option value="NEEDS_REVIEW">NEEDS REVIEW</option>
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
														<td><button type="button" className="btn" onClick={() => updateEntry(entry.id)}>Save</button></td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							)}
						</section>

						<section className="inventory-workspace-card" ref={purchaseWorkspaceRef}>
							<div className="inventory-section-header">
								<div>
									<h3>Purchase Review</h3>
									<p>Suggested purchases and shortages for director review only. No purchase orders are created here.</p>
								</div>
							</div>
							<div className="inventory-grid-scroll inventory-grid-scroll-short">
								<table className="inventory-enterprise-table inventory-enterprise-table-compact">
									<thead>
										<tr>
											<th>Suggested Purchases</th>
											<th>Shortages</th>
											<th>Supplier</th>
											<th>Estimated Cost</th>
											<th>Priority</th>
											<th>Required By</th>
											<th>Director Approval</th>
										</tr>
									</thead>
									<tbody>
										{purchaseQueue.slice(0, 120).map((recommendation) => {
											const item = state.items.find((candidate) => candidate.id === recommendation.itemId) ?? null
											const relatedJobs = item ? relatedJobsByItemId.get(item.id) ?? [] : []
											const estimatedCost = recommendation.suggestedPurchaseQuantity !== null && item?.unitCost !== null
												? recommendation.suggestedPurchaseQuantity * (item?.unitCost ?? 0)
												: null
											return (
												<tr key={recommendation.id}>
													<td>
														<div className="inventory-item-cell">
															<strong>{item?.name ?? recommendation.itemId}</strong>
															<span>{item?.locationName ?? recommendation.worksheetName}</span>
														</div>
													</td>
													<td>{recommendation.observedShortage}</td>
													<td>{item?.preferredSupplierName ?? '--'}</td>
													<td>{formatCurrency(estimatedCost)}</td>
													<td><span className="inventory-pill inventory-pill-outline">{getRecommendationPriority(recommendation, item)}</span></td>
													<td>{relatedJobs[0]?.dueDate ? formatDate(relatedJobs[0].dueDate) : '--'}</td>
													<td>{getDirectorApprovalLabel(recommendation)}</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						</section>

						<section className="inventory-workspace-card">
							<div className="inventory-section-header">
								<div>
									<h3>Material Forecast</h3>
									<p>Presentation summary of workbook inventory buckets against current and reserved balances.</p>
								</div>
							</div>
							<div className="inventory-grid-scroll inventory-grid-scroll-short">
								<table className="inventory-enterprise-table inventory-enterprise-table-compact">
									<thead>
										<tr>
											<th>Material Group</th>
											<th>Current</th>
											<th>Reserved</th>
											<th>Forecast Remaining</th>
										</tr>
									</thead>
									<tbody>
										{materialForecastRows.map((row) => (
											<tr key={row.bucket}>
												<td>
													<div className="inventory-item-cell">
														<strong>{row.bucket}</strong>
														<span>{row.itemCount} matched inventory items</span>
													</div>
												</td>
												<td>{row.current}</td>
												<td>{row.reserved}</td>
												<td>{row.forecastRemaining}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					</div>
				</div>

				{selectedItem ? (
					<aside ref={drawerRef} className="inventory-detail-drawer" aria-label="Inventory detail drawer">
						<div className="inventory-detail-stack">
							<header className="inventory-detail-header">
								<div>
									<span className="inventory-v2-eyebrow">Workbook Item Detail</span>
									<h3>{selectedItem.name}</h3>
									<p>{selectedItem.locationName} · {selectedItem.categoryName}</p>
								</div>
								<div className="inventory-detail-header-actions">
									<span className={`inventory-pill inventory-pill-${getInventoryStatusTone(selectedItem)}`}>
										{selectedItem.status === 'ACTIVE' && isLowStock(selectedItem) ? 'LOW STOCK' : selectedItem.status}
									</span>
									<button type="button" className="inventory-detail-close" onClick={closeSelectedItem} aria-label="Close inventory detail drawer">
										×
									</button>
								</div>
							</header>

							<section className="inventory-detail-card">
								<h4>General Information</h4>
								<dl className="inventory-meta-grid">
									<div><dt>SKU</dt><dd>{selectedItem.sku ?? '--'}</dd></div>
									<div><dt>Unit</dt><dd>{selectedItem.unitOfMeasureLabel ?? '--'}</dd></div>
									<div><dt>Supplier</dt><dd>{selectedItem.preferredSupplierName ?? '--'}</dd></div>
									<div><dt>Unit Cost</dt><dd>{formatCurrency(selectedItem.unitCost)}</dd></div>
									<div><dt>On Hand</dt><dd>{selectedItem.quantityOnHand}</dd></div>
									<div><dt>Reserved</dt><dd>{selectedItem.quantityReserved}</dd></div>
									<div><dt>Available</dt><dd>{selectedItem.quantityAvailable}</dd></div>
									<div><dt>Last Counted</dt><dd>{formatDate(selectedItem.lastCountedAt)}</dd></div>
								</dl>
							</section>

							<section className="inventory-detail-card">
								<h4>Inventory History</h4>
								<ul className="inventory-detail-list">
									{selectedItemSessionEntries.slice(0, 6).map((entry) => (
										<li key={entry.id}>{entry.worksheetName} · previous {entry.previousOnHand} · {entry.status}</li>
									))}
									{state.adjustments.filter((adjustment) => adjustment.itemId === selectedItem.id).slice(0, 6).map((adjustment) => (
										<li key={adjustment.id}>{adjustment.quantityDelta > 0 ? '+' : ''}{adjustment.quantityDelta} · {formatDateTime(adjustment.occurredAt)} · {adjustment.reason}</li>
									))}
									{selectedItemSessionEntries.length === 0 && state.adjustments.every((adjustment) => adjustment.itemId !== selectedItem.id) ? (
										<li>No recorded count or adjustment history for this item yet.</li>
									) : null}
								</ul>
							</section>

							<section className="inventory-detail-card">
								<h4>Reservations</h4>
								<p className="inventory-detail-copy">Current reserved quantity: <strong>{selectedItem.quantityReserved}</strong></p>
								<div className="inventory-reservation-row">
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
								{errorMessage ? <p className="warning">{errorMessage}</p> : null}
							</section>

							<section className="inventory-detail-card">
								<h4>Material Forecast</h4>
								{selectedItemForecast ? (
									<div className="inventory-forecast-inline">
										<div><span>Bucket</span><strong>{selectedItemForecast.bucket}</strong></div>
										<div><span>Current</span><strong>{selectedItemForecast.current}</strong></div>
										<div><span>Reserved</span><strong>{selectedItemForecast.reserved}</strong></div>
										<div><span>Forecast Remaining</span><strong>{selectedItemForecast.forecastRemaining}</strong></div>
									</div>
								) : (
									<p className="inventory-detail-copy">NEEDS_REVIEW: this workbook item does not have a confident presentation bucket for forecast grouping.</p>
								)}
							</section>

							<section className="inventory-detail-card">
								<h4>Affected Production Orders</h4>
								<ul className="inventory-detail-list">
									{selectedItemRelatedJobs.length > 0 ? selectedItemRelatedJobs.map((job) => (
										<li key={job.id}>{job.label} · due {formatDate(job.dueDate)}</li>
									)) : <li>NEEDS_REVIEW: no confirmed production-order link found from current source fields.</li>}
								</ul>
							</section>

							<section className="inventory-detail-card">
								<h4>Purchase History</h4>
								<ul className="inventory-detail-list">
									{state.receipts.filter((receipt) => receipt.itemId === selectedItem.id).slice(0, 6).map((receipt) => (
										<li key={receipt.id}>{receipt.quantityReceived} received · {formatDateTime(receipt.receivedAt)} · {receipt.notes ?? 'No notes'}</li>
									))}
									{state.receipts.every((receipt) => receipt.itemId !== selectedItem.id) ? <li>No purchase receipt history recorded.</li> : null}
								</ul>
							</section>

							<section className="inventory-detail-card">
								<h4>Workbook Traceability</h4>
								<dl className="inventory-meta-grid inventory-meta-grid-tight">
									<div><dt>Workbook</dt><dd>{selectedItem.sourceTrace.workbookName}</dd></div>
									<div><dt>Worksheet</dt><dd>{selectedItem.sourceTrace.worksheetName}</dd></div>
									<div><dt>Row</dt><dd>{selectedItem.sourceTrace.rowNumber}</dd></div>
									<div><dt>Source Ref</dt><dd>{selectedItem.sourceTrace.sourceRef}</dd></div>
								</dl>
								<p className="inventory-trace-summary">{Object.keys(selectedItem.sourceTrace.sourceFormulas).length} source formulas · {Object.keys(selectedItem.sourceTrace.styleRefs).length} source cell references</p>
							</section>
						</div>
					</aside>
				) : null}
			</section>
		</section>
	)
}

export default InventoryPage
