import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import { useAppState } from '../state/AppStateContext'
import { WarehouseInventoryImportService } from '../services/WarehouseInventoryImportService'
import { downloadPurchaseOrderPdf, printPurchaseOrderDocument } from '../utils/purchaseOrderPrintDocument'
import type {
  InventoryCountEntry,
  InventoryCountEntryStatus,
	InventoryCswDocument,
  InventoryFoundationState,
  InventoryItem,
  InventoryPurchaseRecommendation,
	PurchaseOrderDraft,
} from '../types/inventory'

const inventoryService = new WarehouseInventoryImportService()
const PURCHASE_ORDER_REQUESTER = 'Dave Scott, Production Director'

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

type ReviewedRecommendationTab = 'APPROVED' | 'REJECTED'

type InventoryWorkspaceTab =
	| 'INVENTORY'
	| 'COUNT_SESSIONS'
	| 'PURCHASE_RECOMMENDATIONS'
	| 'PURCHASE_ORDERS'
	| 'CSWS'
	| 'RECEIVING_HISTORY'

type PrintableDocumentBlock =
	| { type: 'paragraph'; text: string; emphasis?: boolean }
	| { type: 'table'; heading?: string; headers: string[]; rows: string[][] }
	| { type: 'bullets'; heading: string; items: string[] }
	| { type: 'approval'; statement: string; selectedDecision: string; signatureName: string | null; date: string | null }

interface PrintableDocumentSection {
	heading: string
	blocks: PrintableDocumentBlock[]
}

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

const formatPurchaseOrderStatus = (status: PurchaseOrderDraft['approvalStatus']): string => {
	switch (status) {
		case 'DRAFT': return 'Draft'
		case 'AWAITING_CSW_APPROVAL': return 'Awaiting Approval'
		case 'APPROVED': return 'Approved'
		case 'ORDERED': return 'Ordered'
		case 'PARTIALLY_RECEIVED': return 'Partially Received'
		case 'RECEIVED': return 'Received'
		case 'CANCELLED': return 'Cancelled'
	}
}

const escapeHtml = (value: string): string => value
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#039;')

const printDocument = (title: string, sections: PrintableDocumentSection[]): void => {
	const printWindow = window.open('', '_blank')
	if (!printWindow) return
	printWindow.opener = null
	const renderBlock = (block: PrintableDocumentBlock): string => {
		switch (block.type) {
			case 'paragraph':
				return `<p${block.emphasis ? ' class="executive-summary"' : ''}>${escapeHtml(block.text)}</p>`
			case 'table':
				return `${block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : ''}<table><thead><tr>${block.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
			case 'bullets':
				return `<h3>${escapeHtml(block.heading)}</h3><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
			case 'approval': {
				const choices = ['Approved', 'Approved with Changes', 'Disapproved']
				return `<p>${escapeHtml(block.statement)}</p><div class="decisions">${choices.map((choice) => `<span>${block.selectedDecision === choice ? '[X]' : '[ ]'} ${escapeHtml(choice)}</span>`).join('')}</div><div class="signature"><span>Signature<br><strong>${escapeHtml(block.signatureName ? 'Recorded electronically' : '________________________')}</strong></span><span>Printed name<br><strong>${escapeHtml(block.signatureName ?? '________________________')}</strong></span><span>Date<br><strong>${escapeHtml(block.date ? formatDate(block.date) : '________________')}</strong></span></div>`
			}
		}
	}
	printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#17243a;margin:40px;max-width:900px}h1{font-size:24px;margin:0 0 24px}h2{font-size:15px;border-bottom:2px solid #263b59;padding-bottom:6px;margin-top:24px}h3{font-size:12px;margin:18px 0 7px}p,li,td,th{font-size:10px;line-height:1.45}.executive-summary{border-left:4px solid #263b59;background:#edf2f8;padding:12px;font-size:12px;font-weight:bold}table{width:100%;border-collapse:collapse;margin:7px 0 12px}th,td{border-bottom:1px solid #d9e0e9;padding:6px;text-align:left}th{background:#f1f4f8;text-transform:uppercase;font-size:9px}.decisions{display:flex;gap:24px;margin:14px 0;font-size:11px;font-weight:bold}.signature{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;font-size:9px;text-transform:uppercase}.signature strong{display:block;border-bottom:1px solid #77879b;padding:8px 0 5px;font-size:10px;text-transform:none}@media print{body{margin:20px}}</style></head><body><h1>${escapeHtml(title)}</h1>${sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.blocks.map(renderBlock).join('')}</section>`).join('')}</body></html>`)
	printWindow.document.close()
	printWindow.focus()
	printWindow.print()
}

const downloadDocumentPdf = async (
	filename: string,
	title: string,
	sections: PrintableDocumentSection[],
): Promise<void> => {
	const { jsPDF } = await import('jspdf')
	const pdf = new jsPDF()
	const left = 16
	const pageWidth = pdf.internal.pageSize.getWidth() - (left * 2)
	let y = 18
	const ensureSpace = (height: number): void => {
		if (y + height <= 282) return
		pdf.addPage()
		y = 18
	}
	const writeText = (text: string, options: { bold?: boolean; size?: number; indent?: number } = {}): void => {
		const indent = options.indent ?? 0
		pdf.setFontSize(options.size ?? 9)
		pdf.setFont('helvetica', options.bold ? 'bold' : 'normal')
		const wrappedLines = pdf.splitTextToSize(text, pageWidth - indent) as string[]
		ensureSpace((wrappedLines.length * 5) + 2)
		pdf.text(wrappedLines, left + indent, y)
		y += (wrappedLines.length * 5) + 2
	}
	const writeTable = (block: Extract<PrintableDocumentBlock, { type: 'table' }>): void => {
		if (block.heading) writeText(block.heading, { bold: true, size: 10 })
		const columnWidth = pageWidth / block.headers.length
		const drawRow = (row: string[], header: boolean): void => {
			const wrappedCells = row.map((cell) => pdf.splitTextToSize(cell, columnWidth - 4) as string[])
			const rowHeight = Math.max(...wrappedCells.map((cell) => cell.length), 1) * 4 + 4
			ensureSpace(rowHeight)
			if (header) pdf.setFillColor(241, 244, 248)
			wrappedCells.forEach((cell, index) => {
				pdf.setDrawColor(217, 224, 233)
				pdf.rect(left + (index * columnWidth), y, columnWidth, rowHeight, header ? 'FD' : 'S')
				pdf.setFontSize(7.5)
				pdf.setFont('helvetica', header ? 'bold' : 'normal')
				pdf.text(cell, left + (index * columnWidth) + 2, y + 4)
			})
			y += rowHeight
		}
		drawRow(block.headers, true)
		block.rows.forEach((row) => drawRow(row, false))
		y += 4
	}

	pdf.setFontSize(18)
	pdf.text(title, left, y)
	y += 12

	for (const section of sections) {
		if (y > 270) {
			pdf.addPage()
			y = 18
		}
		pdf.setFontSize(12)
		pdf.setFont('helvetica', 'bold')
		pdf.text(section.heading, left, y)
		y += 7

		for (const block of section.blocks) {
			switch (block.type) {
				case 'paragraph':
					writeText(block.text, { bold: block.emphasis, size: block.emphasis ? 10 : 9 })
					break
				case 'table':
					writeTable(block)
					break
				case 'bullets':
					writeText(block.heading, { bold: true, size: 10 })
					block.items.forEach((item) => writeText(`- ${item}`, { indent: 3 }))
					break
				case 'approval':
					writeText(block.statement)
					writeText(['Approved', 'Approved with Changes', 'Disapproved'].map((choice) => `${block.selectedDecision === choice ? '[X]' : '[ ]'} ${choice}`).join('    '), { bold: true })
					writeText(`Signature: ${block.signatureName ? 'Recorded electronically' : '________________'}    Printed name: ${block.signatureName ?? '________________'}    Date: ${block.date ? formatDate(block.date) : '________________'}`)
					break
			}
		}
		y += 4
	}

	const blob = pdf.output('blob')
	const url = window.URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = filename
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
	window.requestAnimationFrame(() => window.URL.revokeObjectURL(url))
}

const getCswDocument = (document: InventoryCswDocument): PrintableDocumentSection[] => [
	{ heading: 'Situation', blocks: [{ type: 'paragraph', text: document.situation }] },
	{
		heading: 'Data',
		blocks: [
			{ type: 'paragraph', text: getCswExecutiveSummary(document), emphasis: true },
			{ type: 'table', heading: 'Totals', headers: ['Measure', 'Total'], rows: [
				['Recommended purchase value', formatCurrency(document.totalRecommendedPurchaseValue)],
				['Purchase lines', String(document.recommendedItemCount)],
				['Attached purchase orders', String(document.purchaseOrderReferences.length)],
				['Items needing review', String(document.needsReviewCount)],
			] },
			{ type: 'table', heading: 'Supplier Totals', headers: ['Supplier', 'Lines', 'Total'], rows: document.suppliers.map((supplier) => [supplier.supplier, String(supplier.lineItemCount), formatCurrency(supplier.total)]) },
			{ type: 'bullets', heading: 'Highest-Priority Purchases', items: document.highestPriorityPurchases.map((purchase) => `${purchase.item} - ${purchase.reason}; ${purchase.supplier}; Qty ${purchase.quantity}; ${formatCurrency(purchase.subtotal)}`) },
			{ type: 'table', heading: 'Attached Purchase Orders', headers: ['Purchase Order', 'Supplier', 'Lines', 'Total'], rows: document.purchaseOrderReferences.map((purchaseOrder) => [purchaseOrder.number, purchaseOrder.supplier, String(purchaseOrder.lineItemCount), formatCurrency(purchaseOrder.total)]) },
			{ type: 'paragraph', text: 'Detailed item lists are provided in the attached purchase orders and are not repeated in this CSW.' },
		],
	},
	{ heading: 'Solution', blocks: [{ type: 'approval', statement: getCswSolutionStatement(document), selectedDecision: getCswDecisionLabel(document), signatureName: document.approvalSignatureName, date: document.approvalDate }] },
]

const getCswExecutiveSummary = (document: InventoryCswDocument): string =>
	`Approval is requested for ${document.recommendedItemCount} purchase line(s) totaling ${formatCurrency(document.totalRecommendedPurchaseValue)} across ${document.suppliers.length} supplier(s) and ${document.purchaseOrderReferences.length} attached purchase order(s).`

const getCswSolutionStatement = (document: InventoryCswDocument): string => document.solution.split('\n')[0]

const getCswDecisionLabel = (document: InventoryCswDocument): string => {
	switch (document.approvalStatus) {
		case 'APPROVED': return 'Approved'
		case 'APPROVED_WITH_MODIFICATIONS': return 'Approved with Changes'
		case 'DISAPPROVED': return 'Disapproved'
		default: return 'Pending decision'
	}
}

const formatSessionStatusLabel = (status: string): string => {
	switch (status) {
		case 'IN_PROGRESS':
			return 'In Progress'
		case 'PAUSED':
			return 'Paused'
		case 'COMPLETED':
		case 'APPROVED':
			return 'Completed'
		case 'CANCELLED':
			return 'Cancelled'
		default:
			return status.replace(/_/g, ' ')
	}
}

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

const hasValidPersistedInventoryShape = (candidate: InventoryFoundationState | null): boolean => {
	if (!candidate) return true
	return Array.isArray((candidate as Partial<InventoryFoundationState>).items)
		&& Array.isArray((candidate as Partial<InventoryFoundationState>).recommendations)
		&& Array.isArray((candidate as Partial<InventoryFoundationState>).purchaseOrders)
		&& Array.isArray((candidate as Partial<InventoryFoundationState>).cswDocuments)
}

const initializeInventoryState = (): { state: InventoryFoundationState; loadError: string | null } => {
	try {
		const loaded = inventoryService.load()
		const hasInvalidShape = !hasValidPersistedInventoryShape(loaded)
		const initialized = inventoryService.importFromSeed(loaded)
		inventoryService.save(initialized)
		return {
			state: initialized,
			loadError: hasInvalidShape
				? 'Saved inventory data was in an outdated format. A fresh inventory snapshot was loaded instead.'
				: null,
		}
	} catch {
		const fallback = inventoryService.importFromSeed(null)
		inventoryService.save(fallback)
		return {
			state: fallback,
			loadError: 'Saved inventory data could not be loaded. A fresh inventory snapshot was loaded instead.',
		}
	}
}

const InventoryPage = () => {
	const location = useLocation()
  const { productionJobs } = useAppState()

  const countWorkspaceRef = useRef<HTMLElement | null>(null)
  const purchaseWorkspaceRef = useRef<HTMLElement | null>(null)
	const recommendationsListRef = useRef<HTMLElement | null>(null)
	const poDraftWorkspaceRef = useRef<HTMLElement | null>(null)
	const cswWorkspaceRef = useRef<HTMLElement | null>(null)
	const receivingHistoryRef = useRef<HTMLElement | null>(null)
	const drawerRef = useRef<HTMLElement | null>(null)

	const [initialization] = useState(initializeInventoryState)
	const [state, setState] = useState<InventoryFoundationState>(initialization.state)
	const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(initialization.loadError)
	const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<InventoryWorkspaceTab>('INVENTORY')

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
	const [recommendationQuantities, setRecommendationQuantities] = useState<Record<string, string>>({})
	const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string>>({})
	const [receiptQuantities, setReceiptQuantities] = useState<Record<string, string>>({})
	const [receiptNotes, setReceiptNotes] = useState<Record<string, string>>({})
	const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string | null>(null)
	const [receivingPurchaseOrderId, setReceivingPurchaseOrderId] = useState<string | null>(null)
	const [selectedCswDocumentId, setSelectedCswDocumentId] = useState<string | null>(null)
	const [reviewedRecommendationTab, setReviewedRecommendationTab] = useState<ReviewedRecommendationTab>('APPROVED')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		const params = new URLSearchParams(location.search)
		if (params.get('filter') === 'shortages') {
			setFilterPurchaseNeeded(true)
			setActiveWorkspaceTab('PURCHASE_RECOMMENDATIONS')
			window.requestAnimationFrame(() => {
				purchaseWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			})
		}

		if (params.get('section') === 'needs-review') {
			setFilterNeedsReview(true)
			setActiveWorkspaceTab('PURCHASE_RECOMMENDATIONS')
		}

		if (params.get('section') === 'po-drafts') {
			setActiveWorkspaceTab('PURCHASE_ORDERS')
			window.requestAnimationFrame(() => {
				poDraftWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			})
		}

		if (params.get('section') === 'csw') {
			setActiveWorkspaceTab('CSWS')
			const selectedCswId = params.get('csw')
			if (selectedCswId) setSelectedCswDocumentId(selectedCswId)
			window.requestAnimationFrame(() => {
				cswWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			})
		}

		const selectedItemFromQuery = params.get('item')
		if (selectedItemFromQuery) {
			setSelectedItemId(selectedItemFromQuery)
		}
	}, [location.search])

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

	const latestSession = useMemo(() => state.sessions[0] ?? null, [state.sessions])

	const activeSession = useMemo(
		() => state.sessions.find((session) => session.status === 'IN_PROGRESS' || session.status === 'PAUSED') ?? null,
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

	const purchaseOrders = useMemo(() => state.purchaseOrders, [state.purchaseOrders])
	const latestCswDocument = useMemo(() => state.cswDocuments[0] ?? null, [state.cswDocuments])
	const selectedPurchaseOrder = useMemo(
		() => purchaseOrders.find((purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId) ?? null,
		[purchaseOrders, selectedPurchaseOrderId],
	)
	const selectedCswDocument = useMemo(
		() => state.cswDocuments.find((document) => document.id === selectedCswDocumentId) ?? latestCswDocument,
		[latestCswDocument, selectedCswDocumentId, state.cswDocuments],
	)
	const approvedRecommendations = useMemo(
		() => state.recommendations.filter((recommendation) => recommendation.approvalStatus === 'APPROVED' || recommendation.approvalStatus === 'APPROVED_WITH_MODIFICATIONS'),
		[state.recommendations],
	)
	const rejectedRecommendations = useMemo(
		() => state.recommendations.filter((recommendation) => recommendation.approvalStatus === 'REJECTED'),
		[state.recommendations],
	)
	const reviewedRecommendations = reviewedRecommendationTab === 'APPROVED' ? approvedRecommendations : rejectedRecommendations

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
				.filter((session) => session.status === 'COMPLETED' || session.status === 'APPROVED')
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

	const approveRecommendation = (recommendation: InventoryPurchaseRecommendation): void => {
		const quantityRaw = recommendationQuantities[recommendation.id]
		const quantity = quantityRaw === undefined || quantityRaw.trim() === '' ? recommendation.suggestedPurchaseQuantity : Number(quantityRaw)
		saveState(inventoryService.approveRecommendation(state, recommendation.id, {
			approvedBy: 'Inventory Director',
			quantity: typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : null,
			reason: recommendationReasons[recommendation.id] ?? null,
		}))
	}

	const rejectRecommendation = (recommendation: InventoryPurchaseRecommendation): void => {
		saveState(inventoryService.rejectRecommendation(state, recommendation.id, {
			rejectedBy: 'Inventory Director',
			reason: recommendationReasons[recommendation.id] ?? null,
		}))
	}

	const createPurchaseOrders = (): void => {
		saveState(inventoryService.createPurchaseOrderDrafts(state, PURCHASE_ORDER_REQUESTER))
	}

	const generateCsw = (): void => {
		const nextState = inventoryService.createPurchaseOrderDrafts(state, PURCHASE_ORDER_REQUESTER)
		saveState(inventoryService.generateCswDocument(nextState, 'Inventory Director'))
	}

	const approveCsw = (): void => {
		if (!selectedCswDocument) return
		saveState(inventoryService.approveCswDocument(state, selectedCswDocument.id, { approvedBy: 'Inventory Director' }))
	}

	const approveCswWithChanges = (): void => {
		if (!selectedCswDocument) return
		saveState(inventoryService.approveCswDocument(state, selectedCswDocument.id, {
			approvedBy: 'Inventory Director',
			withChanges: true,
		}))
	}

	const rejectCsw = (): void => {
		if (!selectedCswDocument) return
		saveState(inventoryService.rejectCswDocument(state, selectedCswDocument.id, { rejectedBy: 'Inventory Director' }))
	}

	const markOrdered = (purchaseOrderId: string): void => {
		saveState(inventoryService.markPurchaseOrderOrdered(state, purchaseOrderId, { orderedBy: 'Inventory Director' }))
	}

	const recordReceipt = (purchaseOrder: PurchaseOrderDraft, lineId: string): void => {
		const quantityRaw = receiptQuantities[lineId]
		const quantity = Number(quantityRaw)
		if (!Number.isFinite(quantity) || quantity <= 0) return

		saveState(inventoryService.recordReceipt(state, {
			purchaseOrderId: purchaseOrder.id,
			lineId,
			quantityReceived: quantity,
			receivedBy: 'Inventory Receiver',
			notes: receiptNotes[lineId] ?? null,
		}))
	}

	const reimportWorkbook = (): void => {
		saveState(inventoryService.importFromSeed(state))
		setLoadErrorMessage(null)
	}

	const startWarehouseCount = (): void => {
		saveState(inventoryService.startWarehouseCount(state))
	}

	const saveSessionDrafts = (currentState: InventoryFoundationState): InventoryFoundationState => {
		if (!activeSession) return currentState

		return sessionEntries.reduce((nextState, entry) => {
			const hasLocalChanges = entry.id in countValues || entry.id in countStatuses || entry.id in countNotes
			if (!hasLocalChanges) return nextState

			const quantityRaw = countValues[entry.id]
			const quantity = quantityRaw === undefined
				? entry.countedQuantity
				: quantityRaw.trim() === ''
					? null
					: Number(quantityRaw)

			return inventoryService.updateCountEntry(nextState, entry.id, {
				countedQuantity: quantity,
				status: countStatuses[entry.id] ?? (entry.status === 'DRAFT' ? 'COUNTED' : entry.status),
				countNotes: countNotes[entry.id] ?? entry.countNotes ?? '',
			})
		}, currentState)
	}

	const pauseSession = (): void => {
		if (!activeSession || activeSession.status !== 'IN_PROGRESS') return
		const stateWithDrafts = saveSessionDrafts(state)
		saveState(inventoryService.pauseCountSession(stateWithDrafts, activeSession.id))
	}

	const resumeSession = (): void => {
		if (!activeSession || activeSession.status !== 'PAUSED') return
		saveState(inventoryService.resumeCountSession(state, activeSession.id))
	}

	const completeSession = (): void => {
		if (!activeSession) return
		const stateWithDrafts = saveSessionDrafts(state)
		saveState(inventoryService.completeCountSession(stateWithDrafts, activeSession.id))
	}

	const cancelSession = (): void => {
		if (!activeSession) return
		const stateWithDrafts = saveSessionDrafts(state)
		saveState(inventoryService.cancelCountSession(stateWithDrafts, activeSession.id))
	}

	const resetSession = (): void => {
		if (!activeSession) return
		const confirmed = window.confirm('Reset this count session? This clears draft counts only and cannot be undone.')
		if (!confirmed) return
		saveState(inventoryService.resetCountSession(state, activeSession.id))
		const entryIds = new Set(activeSession.entryIds)
		setCountValues((current) => Object.fromEntries(Object.entries(current).filter(([entryId]) => !entryIds.has(entryId))))
		setCountStatuses((current) => Object.fromEntries(Object.entries(current).filter(([entryId]) => !entryIds.has(entryId))))
		setCountNotes((current) => Object.fromEntries(Object.entries(current).filter(([entryId]) => !entryIds.has(entryId))))
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

	const jumpToPurchaseWorkspace = (): void => {
		setActiveWorkspaceTab('PURCHASE_RECOMMENDATIONS')
	}

	const openRecommendations = (): void => {
		setActiveWorkspaceTab('PURCHASE_RECOMMENDATIONS')
	}

	const openPurchaseOrders = (): void => {
		setActiveWorkspaceTab('PURCHASE_ORDERS')
	}

	const openCswDocuments = (): void => {
		setActiveWorkspaceTab('CSWS')
	}

	const openReceivingHistory = (): void => {
		setActiveWorkspaceTab('RECEIVING_HISTORY')
	}

	const openPurchaseOrder = (purchaseOrderId: string): void => {
		setSelectedPurchaseOrderId(purchaseOrderId)
		setReceivingPurchaseOrderId(null)
	}

	const openReferencedPurchaseOrder = (purchaseOrderId: string): void => {
		openPurchaseOrder(purchaseOrderId)
		setActiveWorkspaceTab('PURCHASE_ORDERS')
	}

	const printPurchaseOrder = (purchaseOrder: PurchaseOrderDraft): void => {
		const relatedCsw = state.cswDocuments.find((document) => document.sourcePurchaseOrderIds.includes(purchaseOrder.id)) ?? null
		printPurchaseOrderDocument({
			purchaseOrder,
			relatedCsw,
			inventoryCountDate: relatedCsw?.inventoryDate ?? latestSession?.inventoryDate ?? null,
		})
	}

	const downloadPurchaseOrder = async (purchaseOrder: PurchaseOrderDraft): Promise<void> => {
		const relatedCsw = state.cswDocuments.find((document) => document.sourcePurchaseOrderIds.includes(purchaseOrder.id)) ?? null
		await downloadPurchaseOrderPdf({
			purchaseOrder,
			relatedCsw,
			inventoryCountDate: relatedCsw?.inventoryDate ?? latestSession?.inventoryDate ?? null,
		})
	}

	const printCsw = (document: InventoryCswDocument): void => {
		printDocument(document.title, getCswDocument(document))
	}

	const downloadCsw = async (document: InventoryCswDocument): Promise<void> => {
		await downloadDocumentPdf(`palette-csw-${document.inventoryDate}.pdf`, document.title, getCswDocument(document))
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
			{loadErrorMessage ? (
				<section className="panel">
					<p className="warning">{loadErrorMessage}</p>
				</section>
			) : null}

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
					{activeWorkspaceTab === 'COUNT_SESSIONS' && !activeSession ? (
							<button type="button" className="btn btn-primary inventory-v2-count-cta" onClick={startWarehouseCount}>
								Start Count Session
							</button>
						) : null}
					{activeWorkspaceTab === 'INVENTORY' ? <button type="button" className="btn" onClick={reimportWorkbook}>
						Reimport Workbook Seed
					</button> : null}
					{activeWorkspaceTab === 'INVENTORY' ? <span className="inventory-v2-chip">{sortedItems.length} visible items</span> : null}
				</div>
			</header>

			<nav className="inventory-workspace-tabs" role="tablist" aria-label="Inventory workspaces">
				<button id="inventory-tab" aria-controls="inventory-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'INVENTORY'} className={activeWorkspaceTab === 'INVENTORY' ? 'is-active' : ''} onClick={() => setActiveWorkspaceTab('INVENTORY')}>Inventory</button>
				<button id="count-sessions-tab" aria-controls="count-sessions-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'COUNT_SESSIONS'} className={activeWorkspaceTab === 'COUNT_SESSIONS' ? 'is-active' : ''} onClick={() => setActiveWorkspaceTab('COUNT_SESSIONS')}>Count Sessions</button>
				<button id="purchase-recommendations-tab" aria-controls="purchase-recommendations-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'PURCHASE_RECOMMENDATIONS'} className={activeWorkspaceTab === 'PURCHASE_RECOMMENDATIONS' ? 'is-active' : ''} onClick={openRecommendations}>Purchase Recommendations</button>
				<button id="purchase-orders-tab" aria-controls="purchase-orders-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'PURCHASE_ORDERS'} className={activeWorkspaceTab === 'PURCHASE_ORDERS' ? 'is-active' : ''} onClick={openPurchaseOrders}>Purchase Orders</button>
				<button id="csws-tab" aria-controls="csws-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'CSWS'} className={activeWorkspaceTab === 'CSWS' ? 'is-active' : ''} onClick={openCswDocuments}>CSWs</button>
				<button id="receiving-history-tab" aria-controls="receiving-history-panel" type="button" role="tab" aria-selected={activeWorkspaceTab === 'RECEIVING_HISTORY'} className={activeWorkspaceTab === 'RECEIVING_HISTORY' ? 'is-active' : ''} onClick={openReceivingHistory}>Receiving History</button>
			</nav>

			<section className="inventory-summary-grid" aria-label="Inventory summary" hidden={activeWorkspaceTab !== 'INVENTORY'}>
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
					value={latestSession ? formatSessionStatusLabel(latestSession.status) : 'None'}
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

			<section className="inventory-toolbar" aria-label="Inventory toolbar" hidden={activeWorkspaceTab !== 'INVENTORY'}>
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
				<button type="button" className="inventory-toolbar-toggle" onClick={exportVisibleItems}>
					Export
				</button>
			</section>

			<section className={selectedItem && activeWorkspaceTab === 'INVENTORY' ? 'inventory-workspace-layout inventory-workspace-layout-with-drawer' : 'inventory-workspace-layout'}>
				<div className="inventory-workspace-main">
					<section id="inventory-panel" role="tabpanel" aria-labelledby="inventory-tab" className="inventory-grid-card" hidden={activeWorkspaceTab !== 'INVENTORY'}>
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
						<section id="count-sessions-panel" role="tabpanel" aria-labelledby="count-sessions-tab" className="inventory-workspace-card inventory-tab-panel" ref={countWorkspaceRef} hidden={activeWorkspaceTab !== 'COUNT_SESSIONS'}>
							<div className="inventory-section-header">
								<div>
									<h3>Count Sessions</h3>
									<p>Dedicated warehouse count workspace with session progress, approval routing, and discrepancy handling.</p>
								</div>
								<div className="inventory-section-actions">
									{!activeSession ? (
										<button type="button" className="btn btn-primary inventory-v2-count-cta" onClick={startWarehouseCount}>
											Start Count Session
										</button>
									) : null}
									{activeSession?.status === 'IN_PROGRESS' ? (
										<>
											<button type="button" className="btn" onClick={pauseSession}>Pause Count Session</button>
											<button type="button" className="btn" onClick={completeSession}>Complete Count Session</button>
											<button type="button" className="btn" onClick={cancelSession}>Cancel Count Session</button>
											<button type="button" className="btn" onClick={resetSession}>Reset Count Session</button>
										</>
									) : null}
									{activeSession?.status === 'PAUSED' ? (
										<>
											<button type="button" className="btn" onClick={resumeSession}>Resume Count Session</button>
											<button type="button" className="btn" onClick={cancelSession}>Cancel Count Session</button>
											<button type="button" className="btn" onClick={resetSession}>Reset Count Session</button>
										</>
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

							{!activeSession ? (
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
												const countsEditable = activeSession.status === 'IN_PROGRESS'
												return (
													<tr key={entry.id}>
														<td>{entry.locationName}</td>
														<td>{entry.categoryName}</td>
														<td>{item?.name ?? entry.itemId}</td>
														<td>{entry.previousOnHand}</td>
														<td>
															<input
																type="number"
																value={countValues[entry.id] ?? (entry.countedQuantity === null ? '' : String(entry.countedQuantity))}
																disabled={!countsEditable}
																onChange={(event) => setCountValues((current) => ({ ...current, [entry.id]: event.target.value }))}
															/>
														</td>
														<td>
															<select
																value={countStatuses[entry.id] ?? (entry.status === 'DRAFT' ? 'COUNTED' : entry.status)}
																disabled={!countsEditable}
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
																value={countNotes[entry.id] ?? entry.countNotes ?? ''}
																disabled={!countsEditable}
																onChange={(event) => setCountNotes((current) => ({ ...current, [entry.id]: event.target.value }))}
															/>
														</td>
														<td><button type="button" className="btn" disabled={!countsEditable} onClick={() => updateEntry(entry.id)}>Save</button></td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							)}
						</section>

						<section className="inventory-workspace-card inventory-tab-panel" ref={purchaseWorkspaceRef} hidden={activeWorkspaceTab === 'INVENTORY' || activeWorkspaceTab === 'COUNT_SESSIONS'}>
							<section id="purchase-recommendations-panel" role="tabpanel" ref={recommendationsListRef} className="inventory-section-destination inventory-purchasing-section" tabIndex={-1} aria-labelledby="purchase-recommendations-tab" hidden={activeWorkspaceTab !== 'PURCHASE_RECOMMENDATIONS'}>
								<div className="inventory-section-header">
									<div><h3 id="open-recommendations-heading">Recommendations</h3><p>Review open inventory requirements and completed decisions.</p></div>
									<button type="button" className="btn" onClick={createPurchaseOrders}>Create Purchase Orders</button>
								</div>
								<h4 className="inventory-subsection-title">Open Recommendations</h4>
							<div className="inventory-grid-scroll inventory-grid-scroll-short">
								<table className="inventory-enterprise-table inventory-enterprise-table-compact">
									<thead>
										<tr>
											<th>Item</th>
											<th>Qty</th>
											<th>Shortages</th>
											<th>Supplier</th>
											<th>Estimated Cost</th>
											<th>Priority</th>
											<th>Required By</th>
											<th>Status</th>
											<th>Approve / Reject</th>
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
													<td>
														<input
															type="number"
															min={0}
															value={recommendationQuantities[recommendation.id] ?? recommendation.suggestedPurchaseQuantity ?? ''}
															onChange={(event) => setRecommendationQuantities((current) => ({ ...current, [recommendation.id]: event.target.value }))}
														/>
													</td>
													<td>{recommendation.observedShortage}</td>
													<td>{item?.preferredSupplierName ?? '--'}</td>
													<td>{formatCurrency(estimatedCost)}</td>
													<td><span className="inventory-pill inventory-pill-outline">{getRecommendationPriority(recommendation, item)}</span></td>
													<td>{relatedJobs[0]?.dueDate ? formatDate(relatedJobs[0].dueDate) : '--'}</td>
													<td>{recommendation.approvalStatus}/{recommendation.status}</td>
													<td>
														<div className="inventory-section-actions">
															<button type="button" className="btn" onClick={() => approveRecommendation(recommendation)}>Approve</button>
															<button type="button" className="btn" onClick={() => rejectRecommendation(recommendation)}>Reject</button>
														</div>
														<label style={{ display: 'block', marginTop: '0.5rem' }}>
															<span>Reason</span>
															<input
																type="text"
																value={recommendationReasons[recommendation.id] ?? ''}
																onChange={(event) => setRecommendationReasons((current) => ({ ...current, [recommendation.id]: event.target.value }))}
															/>
														</label>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
								<div className="inventory-reviewed-recommendations">
								<div className="inventory-section-header">
									<div>
										<h3>Reviewed Recommendations</h3>
										<p>Completed recommendation decisions separated by outcome.</p>
									</div>
									<div className="inventory-review-tabs" role="tablist" aria-label="Reviewed recommendation status">
										<button type="button" role="tab" aria-selected={reviewedRecommendationTab === 'APPROVED'} className={reviewedRecommendationTab === 'APPROVED' ? 'is-active' : ''} onClick={() => setReviewedRecommendationTab('APPROVED')}>Approved ({approvedRecommendations.length})</button>
										<button type="button" role="tab" aria-selected={reviewedRecommendationTab === 'REJECTED'} className={reviewedRecommendationTab === 'REJECTED' ? 'is-active' : ''} onClick={() => setReviewedRecommendationTab('REJECTED')}>Rejected ({rejectedRecommendations.length})</button>
									</div>
								</div>
								{reviewedRecommendations.length > 0 ? (
									<div className="inventory-grid-scroll inventory-grid-scroll-short">
										<table className="inventory-enterprise-table inventory-enterprise-table-compact">
											<thead><tr><th>Item</th><th>Supplier</th><th>Quantity</th><th>Decision</th><th>Reason</th></tr></thead>
											<tbody>{reviewedRecommendations.map((recommendation) => (
												<tr key={recommendation.id}>
													<td>{recommendation.item}</td>
													<td>{recommendation.supplier ?? '--'}</td>
													<td>{recommendation.reviewedQuantity ?? recommendation.suggestedPurchaseQuantity ?? '--'}</td>
													<td>{recommendation.approvalStatus.replace(/_/g, ' ')}</td>
													<td>{recommendation.reviewedReason ?? '--'}</td>
												</tr>
											))}</tbody>
										</table>
									</div>
								) : <p className="inventory-empty-state">No {reviewedRecommendationTab.toLowerCase()} recommendations yet.</p>}
								</div>
							</section>

							<section id="purchase-orders-panel" role="tabpanel" aria-labelledby="purchase-orders-tab" className="inventory-purchasing-section inventory-section-destination" ref={poDraftWorkspaceRef} tabIndex={-1} hidden={activeWorkspaceTab !== 'PURCHASE_ORDERS'}>
								<div className="inventory-section-header">
									<div>
										<h3>Purchase Orders</h3>
										<p>Open an order to review details, print, download, mark it ordered, or receive items.</p>
									</div>
								</div>
								{purchaseOrders.length > 0 ? <div className="inventory-grid-scroll inventory-grid-scroll-short">
									<table className="inventory-enterprise-table inventory-enterprise-table-compact">
										<thead>
											<tr>
												<th>Purchase Order</th>
												<th>Supplier</th>
												<th>Lines</th>
												<th>Total</th>
												<th>Status</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{purchaseOrders.map((purchaseOrder) => (
												<tr key={purchaseOrder.id}>
													<td>{purchaseOrder.poDraftNumber}</td>
													<td>{purchaseOrder.supplier}</td>
													<td>{purchaseOrder.lines.length}</td>
													<td>{formatCurrency(purchaseOrder.total)}</td>
													<td><span className="inventory-pill inventory-pill-outline">{formatPurchaseOrderStatus(purchaseOrder.approvalStatus)}</span></td>
													<td><button type="button" className="btn" onClick={() => openPurchaseOrder(purchaseOrder.id)}>Open</button></td>
												</tr>
											))}
										</tbody>
									</table>
								</div> : <p className="inventory-empty-state">No purchase orders have been created.</p>}
								{selectedPurchaseOrder ? (
									<article className="inventory-document-detail inventory-purchase-order-detail" aria-label={`${selectedPurchaseOrder.poDraftNumber} details`}>
										<div className="inventory-section-header">
											<div><span className="inventory-v2-eyebrow">Open Purchase Order</span><h4>{selectedPurchaseOrder.poDraftNumber}</h4><p>{selectedPurchaseOrder.supplier} | {selectedPurchaseOrder.lines.length} lines | {formatCurrency(selectedPurchaseOrder.total)}</p></div>
											<div className="inventory-section-actions">
												<button type="button" className="btn" onClick={() => printPurchaseOrder(selectedPurchaseOrder)}>Print</button>
												<button type="button" className="btn btn-primary" onClick={() => void downloadPurchaseOrder(selectedPurchaseOrder)}>Download PDF</button>
												<button type="button" className="btn" disabled={selectedPurchaseOrder.approvalStatus !== 'APPROVED'} onClick={() => markOrdered(selectedPurchaseOrder.id)}>Mark Ordered</button>
												<button type="button" className="btn" disabled={selectedPurchaseOrder.approvalStatus !== 'ORDERED' && selectedPurchaseOrder.approvalStatus !== 'PARTIALLY_RECEIVED'} onClick={() => setReceivingPurchaseOrderId(selectedPurchaseOrder.id)}>Receive Items</button>
											</div>
										</div>
										<dl className="inventory-meta-grid"><div><dt>Requested By</dt><dd>{selectedPurchaseOrder.requestedBy}</dd></div><div><dt>Created</dt><dd>{formatDateTime(selectedPurchaseOrder.dateCreated)}</dd></div><div><dt>Status</dt><dd>{formatPurchaseOrderStatus(selectedPurchaseOrder.approvalStatus)}</dd></div><div><dt>Account</dt><dd>{selectedPurchaseOrder.accountLabel}</dd></div></dl>
										<div className="inventory-grid-scroll inventory-grid-scroll-short inventory-document-lines">
											<table className="inventory-enterprise-table inventory-enterprise-table-compact">
												<thead><tr><th>Item</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
												<tbody>{selectedPurchaseOrder.lines.map((line) => (
													<tr key={line.id}><td>{line.sourceItemSnapshot ?? line.description ?? line.inventoryItemId}</td><td>{line.sku ?? '--'}</td><td>{line.quantityOrdered}</td><td>{formatCurrency(line.unitPrice)}</td><td>{formatCurrency(line.subtotal)}</td></tr>
												))}</tbody>
											</table>
										</div>
										{receivingPurchaseOrderId === selectedPurchaseOrder.id ? (
											<div className="inventory-receive-items">
												<h4>Receive Items</h4>
												{selectedPurchaseOrder.lines.filter((line) => line.quantityRemaining > 0).map((line) => (
													<div className="inventory-receive-line" key={line.id}>
														<div><strong>{line.sourceItemSnapshot ?? line.description ?? line.inventoryItemId}</strong><span>{line.quantityRemaining} remaining</span></div>
														<input type="number" min={1} max={line.quantityRemaining} value={receiptQuantities[line.id] ?? ''} onChange={(event) => setReceiptQuantities((current) => ({ ...current, [line.id]: event.target.value }))} placeholder="Quantity" />
														<input type="text" value={receiptNotes[line.id] ?? ''} onChange={(event) => setReceiptNotes((current) => ({ ...current, [line.id]: event.target.value }))} placeholder="Receiving notes" />
														<button type="button" className="btn btn-primary" onClick={() => recordReceipt(selectedPurchaseOrder, line.id)}>Receive</button>
													</div>
												))}
											</div>
										) : null}
									</article>
								) : null}
							</section>

							<section id="csws-panel" role="tabpanel" aria-labelledby="csws-tab" className="inventory-purchasing-section inventory-section-destination" ref={cswWorkspaceRef} tabIndex={-1} hidden={activeWorkspaceTab !== 'CSWS'}>
								<div className="inventory-section-header">
									<div>
										<h3>CSWs</h3>
										<p>Generated Completed Staff Work records sourced from inventory purchase recommendations.</p>
									</div>
									<div className="inventory-section-actions">
										<button type="button" className="btn btn-primary" onClick={generateCsw}>Generate CSW</button>
									</div>
								</div>
								{state.cswDocuments.length > 0 ? (
									<>
										<div className="inventory-document-list">
											{state.cswDocuments.map((document) => (
												<button type="button" key={document.id} className={selectedCswDocument?.id === document.id ? 'inventory-document-list-item is-active' : 'inventory-document-list-item'} onClick={() => setSelectedCswDocumentId(document.id)}>
													<span>{document.subject}</span><strong>{document.approvalStatus}</strong><small>{formatDateTime(document.date)}</small>
												</button>
											))}
										</div>
										{selectedCswDocument ? <>
										<div className="inventory-section-actions inventory-document-actions">
											<button type="button" className="btn" onClick={() => printCsw(selectedCswDocument)}>Print CSW</button>
											<button type="button" className="btn btn-primary" onClick={() => void downloadCsw(selectedCswDocument)}>Download PDF</button>
										</div>
										<dl className="inventory-meta-grid">
											<div><dt>To</dt><dd>{selectedCswDocument.to}</dd></div>
											<div><dt>From</dt><dd>{selectedCswDocument.from}</dd></div>
											<div><dt>Date</dt><dd>{formatDateTime(selectedCswDocument.date)}</dd></div>
											<div><dt>Subject</dt><dd>{selectedCswDocument.subject}</dd></div>
										</dl>
										<div className="inventory-csw-sections inventory-csw-executive">
											<section>
												<h4>1. Situation</h4>
												<p className="inventory-csw-situation">{selectedCswDocument.situation}</p>
											</section>
											<section>
												<h4>2. Data</h4>
												<div className="inventory-csw-summary">
													<span>Executive Summary</span>
													<strong>{getCswExecutiveSummary(selectedCswDocument)}</strong>
												</div>
												<div className="inventory-csw-totals" aria-label="CSW totals">
													<div><span>Recommended value</span><strong>{formatCurrency(selectedCswDocument.totalRecommendedPurchaseValue)}</strong></div>
													<div><span>Purchase lines</span><strong>{selectedCswDocument.recommendedItemCount}</strong></div>
													<div><span>Attached POs</span><strong>{selectedCswDocument.purchaseOrderReferences.length}</strong></div>
													<div><span>Needs review</span><strong>{selectedCswDocument.needsReviewCount}</strong></div>
												</div>
												<div className="inventory-csw-data-block">
													<h5>Supplier Totals</h5>
													<div className="inventory-grid-scroll">
														<table className="inventory-csw-table">
															<thead><tr><th>Supplier</th><th>Lines</th><th>Total</th></tr></thead>
															<tbody>{selectedCswDocument.suppliers.map((supplier) => <tr key={supplier.supplier}><td>{supplier.supplier}</td><td>{supplier.lineItemCount}</td><td>{formatCurrency(supplier.total)}</td></tr>)}</tbody>
														</table>
													</div>
												</div>
												<div className="inventory-csw-data-block">
													<h5>Highest-Priority Purchases</h5>
													<ul className="inventory-csw-priority-list">{selectedCswDocument.highestPriorityPurchases.map((purchase) => <li key={`${purchase.supplier}-${purchase.item}`}><strong>{purchase.item}</strong><span>{purchase.reason} · {purchase.supplier} · Qty {purchase.quantity} · {formatCurrency(purchase.subtotal)}</span></li>)}</ul>
												</div>
												<div className="inventory-csw-data-block">
													<h5>Attached Purchase Orders</h5>
													<div className="inventory-grid-scroll">
														<table className="inventory-csw-table">
															<thead><tr><th>Purchase Order</th><th>Supplier</th><th>Lines</th><th>Total</th></tr></thead>
															<tbody>{selectedCswDocument.purchaseOrderReferences.map((purchaseOrder) => <tr key={purchaseOrder.id}><td><button type="button" className="inventory-csw-po-link" onClick={() => openReferencedPurchaseOrder(purchaseOrder.id)}>{purchaseOrder.number}</button></td><td>{purchaseOrder.supplier}</td><td>{purchaseOrder.lineItemCount}</td><td>{formatCurrency(purchaseOrder.total)}</td></tr>)}</tbody>
														</table>
													</div>
													<p className="inventory-csw-appendix-note">Detailed item lists are provided in the attached purchase orders and are not repeated in this CSW.</p>
												</div>
											</section>
											<section>
												<h4>3. Solution</h4>
												<p className="inventory-csw-approval-statement">{getCswSolutionStatement(selectedCswDocument)}</p>
												<div className="inventory-csw-decisions" aria-label="CSW approval decision">
													<button type="button" className={selectedCswDocument.approvalStatus === 'APPROVED' ? 'is-selected' : ''} onClick={approveCsw}>Approved</button>
													<button type="button" className={selectedCswDocument.approvalStatus === 'APPROVED_WITH_MODIFICATIONS' ? 'is-selected' : ''} onClick={approveCswWithChanges}>Approved with Changes</button>
													<button type="button" className={selectedCswDocument.approvalStatus === 'DISAPPROVED' ? 'is-selected' : ''} onClick={rejectCsw}>Disapproved</button>
												</div>
												<dl className="inventory-csw-signature">
													<div><dt>Signature</dt><dd>{selectedCswDocument.approvalSignatureName ? 'Recorded electronically' : '________________________'}</dd></div>
													<div><dt>Printed name</dt><dd>{selectedCswDocument.approvalSignatureName ?? '________________________'}</dd></div>
													<div><dt>Date</dt><dd>{selectedCswDocument.approvalDate ? formatDate(selectedCswDocument.approvalDate) : '________________'}</dd></div>
												</dl>
												<p className="inventory-csw-current-decision">Current decision: <strong>{getCswDecisionLabel(selectedCswDocument)}</strong></p>
											</section>
										</div>
										</> : null}
									</>
								) : (
									<p className="inventory-empty-state">No CSWs have been generated.</p>
								)}
							</section>

							<section id="receiving-history-panel" role="tabpanel" aria-labelledby="receiving-history-tab" className="inventory-purchasing-section inventory-section-destination" ref={receivingHistoryRef} tabIndex={-1} hidden={activeWorkspaceTab !== 'RECEIVING_HISTORY'}>
								<div className="inventory-section-header">
									<div><h3>Receiving History</h3><p>Completed item receipts recorded from opened purchase orders.</p></div>
								</div>
								{state.receipts.length > 0 ? (
									<div className="inventory-grid-scroll inventory-grid-scroll-short">
										<table className="inventory-enterprise-table inventory-enterprise-table-compact">
											<thead><tr><th>Received</th><th>Purchase Order</th><th>Item</th><th>Quantity</th><th>Remaining</th><th>Notes</th></tr></thead>
											<tbody>{state.receipts.map((receipt) => {
												const purchaseOrder = purchaseOrders.find((candidate) => candidate.id === receipt.purchaseOrderId)
												const item = state.items.find((candidate) => candidate.id === receipt.itemId)
												return <tr key={receipt.id}><td>{formatDateTime(receipt.receivedAt)}</td><td>{purchaseOrder?.poDraftNumber ?? '--'}</td><td>{item?.name ?? receipt.itemId}</td><td>{receipt.quantityReceived}</td><td>{receipt.quantityRemaining ?? '--'}</td><td>{receipt.notes ?? '--'}</td></tr>
											})}</tbody>
										</table>
									</div>
								) : <p className="inventory-empty-state">No items have been received yet.</p>}
							</section>
						</section>

						<section className="inventory-workspace-card" hidden={activeWorkspaceTab !== 'INVENTORY'}>
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

				{selectedItem && activeWorkspaceTab === 'INVENTORY' ? (
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
