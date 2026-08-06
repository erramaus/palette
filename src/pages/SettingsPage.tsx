import { useEffect, useState, type ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import type { ForecastConfig } from '../types/productionForecasting'
import type { PersistenceRecordSummary } from '../services/persistence'

interface PendingBackup {
	serialized: string
	summary: PersistenceRecordSummary
}

const downloadJson = (contents: string, fileName: string): void => {
	const blob = new Blob([contents], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = fileName
	anchor.click()
	URL.revokeObjectURL(url)
}

const SettingsPage = () => {
  const location = useLocation()
	const {
		employees,
		forecastSettings,
		saveForecastSettings,
		persistenceStatus,
		persistenceWarning,
		exportPersistenceBackup,
		inspectPersistenceBackup,
		restorePersistenceBackup,
		resetLocalPersistence,
	} = useAppState()
	const [settings, setSettings] = useState<ForecastConfig>(forecastSettings)
	const [pendingBackup, setPendingBackup] = useState<PendingBackup | null>(null)
	const [restoreConfirmed, setRestoreConfirmed] = useState(false)
	const [backupMessage, setBackupMessage] = useState<string | null>(null)

	useEffect(() => {
		const params = new URLSearchParams(location.search)
		if (params.get('section') === 'employees') {
			window.requestAnimationFrame(() => {
				document.getElementById('employees')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			})
		}
	}, [location.search])

	useEffect(() => {
		setSettings(forecastSettings)
	}, [forecastSettings])

	const save = (): void => {
		saveForecastSettings(settings)
	}

	const exportBackup = (): void => {
		downloadJson(exportPersistenceBackup(), `palette-backup-${new Date().toISOString().slice(0, 10)}.json`)
		setBackupMessage('Backup exported.')
	}

	const selectBackup = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
		const file = event.target.files?.[0]
		if (!file) return
		try {
			const serialized = await file.text()
			const { summary } = inspectPersistenceBackup(serialized)
			setPendingBackup({ serialized, summary })
			setRestoreConfirmed(false)
			setBackupMessage(null)
		} catch (error) {
			setPendingBackup(null)
			setBackupMessage(error instanceof Error ? error.message : 'Backup could not be validated.')
		} finally {
			event.target.value = ''
		}
	}

	const restoreBackup = (): void => {
		if (!pendingBackup || !restoreConfirmed) return
		const result = restorePersistenceBackup(pendingBackup.serialized)
		downloadJson(result.preRestoreBackup, `palette-pre-restore-${new Date().toISOString().replaceAll(':', '-')}.json`)
		setSettings(forecastSettings)
		setPendingBackup(null)
		setRestoreConfirmed(false)
		setBackupMessage('Backup restored. A pre-restore backup was downloaded automatically.')
	}

	const reset = (): void => {
		if (!window.confirm('Reset local production data to the application defaults? Export a backup first if this data is needed.')) return
		resetLocalPersistence()
		setSettings(forecastSettings)
		setPendingBackup(null)
		setBackupMessage('Local production data was reset.')
	}

	return (
		<section className="page">
			<div className="page-heading">
				<div>
					<h2>Settings</h2>
					<p>Predictive forecasting controls for baseline depth, confidence, queue weighting, and risk buffers.</p>
				</div>
				<span className={`persistence-status persistence-status-${persistenceStatus.toLowerCase().replaceAll(' ', '-')}`}>
					{persistenceStatus}
				</span>
			</div>

			{persistenceWarning ? <p className="warning" role="alert">Recovery required: {persistenceWarning}</p> : null}

			<section id="employees" className="panel">
				<h3>Employees</h3>
				<p className="subtle">{employees.filter((employee) => employee.active).length} active employees are available in the current app state.</p>
				<div className="dashboard-employee-grid">
					{employees.filter((employee) => employee.active).slice(0, 6).map((employee) => (
						<article key={employee.id} className="dashboard-employee-card">
							<div>
								<h4>{employee.name}</h4>
								<p className="subtle">{employee.role.replaceAll('_', ' ')}</p>
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="panel">
				<h3>Forecast Configuration</h3>
				<div className="form-grid">
					<label>
						Minimum historical sample count
						<input
							type="number"
							min={1}
							value={settings.minimumHistoricalSampleCount}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									minimumHistoricalSampleCount: Math.max(1, Number(event.target.value)),
								}))
							}
						/>
					</label>

					<label>
						Confidence high threshold
						<input
							type="number"
							min={0}
							max={1}
							step={0.05}
							value={settings.confidenceHighThreshold}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									confidenceHighThreshold: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Confidence medium threshold
						<input
							type="number"
							min={0}
							max={1}
							step={0.05}
							value={settings.confidenceMediumThreshold}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									confidenceMediumThreshold: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Forecast buffer (hours)
						<input
							type="number"
							min={0}
							value={settings.forecastBufferHours}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									forecastBufferHours: Math.max(0, Number(event.target.value)),
								}))
							}
						/>
					</label>

					<label>
						Conservative estimate percentile
						<select
							value={settings.conservativePercentile}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									conservativePercentile: Number(event.target.value) as ForecastConfig['conservativePercentile'],
								}))
							}
						>
							<option value={75}>75</option>
							<option value={80}>80</option>
							<option value={85}>85</option>
							<option value={90}>90</option>
							<option value={95}>95</option>
						</select>
					</label>

					<label>
						Employee performance weighting
						<input
							type="number"
							min={0}
							max={1}
							step={0.05}
							value={settings.employeePerformanceWeight}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									employeePerformanceWeight: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Stage queue weighting
						<input
							type="number"
							min={0}
							max={2}
							step={0.05}
							value={settings.stageQueueWeight}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									stageQueueWeight: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Rework adjustment
						<input
							type="number"
							min={0}
							max={1}
							step={0.05}
							value={settings.reworkAdjustment}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									reworkAdjustment: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Carry-forward warning threshold (minutes)
						<input
							type="number"
							min={0}
							value={settings.carryForwardWarningThresholdMinutes}
							onChange={(event) =>
								setSettings((current) => ({
									...current,
									carryForwardWarningThresholdMinutes: Math.max(0, Number(event.target.value)),
								}))
							}
						/>
					</label>
				</div>

				<div className="button-row">
					<button type="button" className="btn btn-primary" onClick={save}>
						Save Forecast Settings
					</button>
				</div>
			</section>

			<section className="panel">
				<h3>Local Data</h3>
				<p className="subtle">Export a portable snapshot or restore validated production data.</p>
				<div className="button-row">
					<button type="button" className="btn" onClick={exportBackup}>Export Backup</button>
					<label className="btn persistence-file-button">
						Import Backup
						<input type="file" accept="application/json,.json" onChange={selectBackup} />
					</label>
					<button type="button" className="btn" onClick={reset}>Reset Local Data</button>
				</div>

				{pendingBackup ? (
					<div className="persistence-restore-summary">
						<h4>Records to restore</h4>
						<dl>
							{Object.entries(pendingBackup.summary).map(([label, count]) => (
								<div key={label}><dt>{label.replace(/([A-Z])/g, ' $1')}</dt><dd>{count}</dd></div>
							))}
						</dl>
						<label className="checkbox-label">
							<input type="checkbox" checked={restoreConfirmed} onChange={(event) => setRestoreConfirmed(event.target.checked)} />
							Replace current local production data
						</label>
						<button type="button" className="btn btn-primary" disabled={!restoreConfirmed} onClick={restoreBackup}>Confirm Restore</button>
					</div>
				) : null}
				{backupMessage ? <p className="subtle" role="status">{backupMessage}</p> : null}
			</section>
		</section>
	)
}

export default SettingsPage
