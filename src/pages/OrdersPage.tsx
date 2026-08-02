import { useMemo, useState } from 'react'
import { useAppState, type ImportProductionOrderInput } from '../state/AppStateContext'
import type { ThreeDOrderImportClassification } from '../types/threeDFilePreparation'

interface ImportFormState {
	orderNumber: string
	customerName: string
	artworkTitle: string
	classification: ThreeDOrderImportClassification
	orderedWidth: number
	orderedHeight: number
	alignment: 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA'
	dueDate: string
	frameInfo: string
	notes: string
	scanDate: string
	existingFilesFound: boolean
	existingFilesCorrectSize: boolean
	colorFilePresent: boolean
	depthSlicesPresent: boolean
}

const today = new Date().toISOString().slice(0, 10)

const defaultFormState = (): ImportFormState => ({
	orderNumber: `WEB-${Date.now().toString().slice(-4)}`,
	customerName: '',
	artworkTitle: '',
	classification: 'THREE_D_TEXTURED_REPLICA',
	orderedWidth: 24,
	orderedHeight: 30,
	alignment: 'VERT',
	dueDate: today,
	frameInfo: 'Maple Float Frame',
	notes: '',
	scanDate: '',
	existingFilesFound: false,
	existingFilesCorrectSize: false,
	colorFilePresent: false,
	depthSlicesPresent: false,
})

const OrdersPage = () => {
	const { productionJobs, threeDFilePreparations, importProductionOrder } = useAppState()
	const [form, setForm] = useState<ImportFormState>(() => defaultFormState())
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const recentImports = useMemo(
		() => productionJobs.slice(0, 8).map((job) => ({
			job,
			preparation: threeDFilePreparations.find((preparation) => preparation.productionJobId === job.id),
		})),
		[productionJobs, threeDFilePreparations],
	)

	const isThreeDClassification =
		form.classification === 'THREE_D_PRINT' || form.classification === 'THREE_D_TEXTURED_REPLICA'

	const onImport = (): void => {
		if (!form.customerName.trim() || !form.artworkTitle.trim() || !form.orderNumber.trim()) {
			setErrorMessage('Order number, customer, and artwork are required.')
			return
		}

		const input: ImportProductionOrderInput = {
			orderNumber: form.orderNumber.trim(),
			customerName: form.customerName.trim(),
			artworkTitle: form.artworkTitle.trim(),
			classification: form.classification,
			orderedWidth: form.orderedWidth,
			orderedHeight: form.orderedHeight,
			alignment: form.alignment,
			dueDate: form.dueDate,
			frameInfo: form.frameInfo,
			notes: form.notes,
			scanDate: form.scanDate || undefined,
			existingFilesFound: isThreeDClassification ? form.existingFilesFound : undefined,
			existingFilesCorrectSize: isThreeDClassification ? form.existingFilesCorrectSize : undefined,
			colorFilePresent: isThreeDClassification ? form.colorFilePresent : undefined,
			depthSlicesPresent: isThreeDClassification ? form.depthSlicesPresent : undefined,
		}

		importProductionOrder(input)
		setForm(defaultFormState())
		setErrorMessage(null)
	}

	return (
		<section className="page">
			<div className="page-heading">
				<h2>Orders</h2>
				<p>Import orders into production and automatically create 3D file-preparation work when required.</p>
			</div>

			<section className="panel">
				<h3>Import Order</h3>
				<div className="form-grid">
					<label>
						Order number
						<input value={form.orderNumber} onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))} />
					</label>
					<label>
						Customer
						<input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
					</label>
					<label>
						Artwork
						<input value={form.artworkTitle} onChange={(event) => setForm((current) => ({ ...current, artworkTitle: event.target.value }))} />
					</label>
					<label>
						Classification
						<select value={form.classification} onChange={(event) => setForm((current) => ({ ...current, classification: event.target.value as ThreeDOrderImportClassification }))}>
							<option value="THREE_D_TEXTURED_REPLICA">3D Textured Replica</option>
							<option value="THREE_D_PRINT">3D Print</option>
							<option value="CANVAS">Canvas</option>
							<option value="PAPER">Paper</option>
						</select>
					</label>
					<label>
						Ordered width
						<input type="number" min={1} value={form.orderedWidth} onChange={(event) => setForm((current) => ({ ...current, orderedWidth: Number(event.target.value) }))} />
					</label>
					<label>
						Ordered height
						<input type="number" min={1} value={form.orderedHeight} onChange={(event) => setForm((current) => ({ ...current, orderedHeight: Number(event.target.value) }))} />
					</label>
					<label>
						Alignment
						<select value={form.alignment} onChange={(event) => setForm((current) => ({ ...current, alignment: event.target.value as ImportFormState['alignment'] }))}>
							<option value="HORIZ">HORIZ</option>
							<option value="VERT">VERT</option>
							<option value="SQUARE">SQUARE</option>
							<option value="PANORAMA">PANORAMA</option>
						</select>
					</label>
					<label>
						Due date
						<input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
					</label>
					<label>
						Frame / finish info
						<input value={form.frameInfo} onChange={(event) => setForm((current) => ({ ...current, frameInfo: event.target.value }))} />
					</label>
					<label>
						Scan date
						<input type="date" value={form.scanDate} onChange={(event) => setForm((current) => ({ ...current, scanDate: event.target.value }))} />
					</label>
					<label className="work-item-detail-wide-field">
						Import notes
						<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
					</label>
				</div>

				{isThreeDClassification ? (
					<div className="button-row">
						<label className="checkbox-label"><input type="checkbox" checked={form.existingFilesFound} onChange={(event) => setForm((current) => ({ ...current, existingFilesFound: event.target.checked }))} /> Existing 3D files found</label>
						<label className="checkbox-label"><input type="checkbox" checked={form.existingFilesCorrectSize} onChange={(event) => setForm((current) => ({ ...current, existingFilesCorrectSize: event.target.checked }))} /> Existing correct-size files</label>
						<label className="checkbox-label"><input type="checkbox" checked={form.colorFilePresent} onChange={(event) => setForm((current) => ({ ...current, colorFilePresent: event.target.checked }))} /> Color file present</label>
						<label className="checkbox-label"><input type="checkbox" checked={form.depthSlicesPresent} onChange={(event) => setForm((current) => ({ ...current, depthSlicesPresent: event.target.checked }))} /> Depth slices present</label>
					</div>
				) : null}

				<div className="button-row">
					<button type="button" className="btn btn-primary" onClick={onImport}>Import Order</button>
				</div>

				{errorMessage ? <p className="warning">{errorMessage}</p> : null}
			</section>

			<section className="panel">
				<h3>Recent Imported Orders</h3>
				<div className="table-wrap">
					<table className="workshop-table">
						<thead>
							<tr>
								<th>Artwork</th>
								<th>Ordered Size</th>
								<th>Alignment</th>
								<th>3D File Status</th>
								<th>Existing Correct-size Files</th>
								<th>Slicing Required</th>
								<th>Resizing Required</th>
								<th>Review Required</th>
							</tr>
						</thead>
						<tbody>
							{recentImports.map(({ job, preparation }) => (
								<tr key={job.id}>
									<td>{job.artworkTitle}</td>
									<td>{job.width} x {job.height}</td>
									<td>{preparation?.alignment ?? '--'}</td>
									<td>{preparation?.status ?? 'N/A'}</td>
									<td>{preparation ? (preparation.existingFilesCorrectSize ? 'Yes' : 'No') : 'N/A'}</td>
									<td>{preparation ? (preparation.slicingRequired ? 'Yes' : 'No') : 'N/A'}</td>
									<td>{preparation ? (preparation.resizingRequired ? 'Yes' : 'No') : 'N/A'}</td>
									<td>{preparation ? (preparation.attentionRequired ? 'Yes' : 'No') : 'No'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</section>
	)
}

export default OrdersPage
