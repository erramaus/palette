import { useState } from 'react'
import {
	loadProductionForecastSettings,
	saveProductionForecastSettings,
} from '../services/productionForecastSettings'
import { useAppState } from '../state/AppStateContext'
import type { ForecastConfig } from '../types/productionForecasting'

const SettingsPage = () => {
	const { addActivityLog } = useAppState()
	const [settings, setSettings] = useState<ForecastConfig>(() => loadProductionForecastSettings())

	const save = (): void => {
		saveProductionForecastSettings(settings)
		addActivityLog({
			entityType: 'BattlePlan',
			entityId: 'PRODUCTION_FORECAST_SETTINGS',
			action: 'FORECAST_CONFIG_CHANGED',
			metadata: {
				minimumHistoricalSampleCount: settings.minimumHistoricalSampleCount,
				conservativePercentile: settings.conservativePercentile,
				forecastBufferHours: settings.forecastBufferHours,
			},
		})
	}

	return (
		<section className="page">
			<div className="page-heading">
				<h2>Settings</h2>
				<p>Predictive forecasting controls for baseline depth, confidence, queue weighting, and risk buffers.</p>
			</div>

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
		</section>
	)
}

export default SettingsPage
