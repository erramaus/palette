import { useMemo, useState } from 'react'
import {
	ProductionAnalyticsService,
} from '../services'
import { useAppState } from '../state/AppStateContext'
import type {
	ProductionAnalyticsTargets,
	ProductionMetricDefinition,
} from '../types/productionAnalytics'

const formatPercent = (value: number | null): string => (value === null ? '--' : `${Math.round(value)}%`)

const formatMetricValue = (metric: ProductionMetricDefinition): string => {
	const value = metric.trend.currentWeek
	if (value === null) {
		return '--'
	}

	if (metric.benchmark.unit === 'PERCENT') {
		return `${Math.round(value)}%`
	}

	if (metric.benchmark.unit === 'HOURS') {
		return `${Math.round(value * 10) / 10}h`
	}

	if (metric.benchmark.unit === 'DAYS') {
		return `${Math.round(value * 10) / 10}d`
	}

	return `${Math.round(value)}`
}

const trendToneClass = (direction: string): string => {
	if (direction === 'IMPROVING') {
		return 'trend-improving'
	}
	if (direction === 'DECLINING') {
		return 'trend-declining'
	}
	if (direction === 'STABLE') {
		return 'trend-stable'
	}
	return 'trend-unknown'
}

const weekOffsetOptions = [
	{ label: 'Current Week', value: 0 },
	{ label: 'Previous Week', value: -1 },
	{ label: '2 Weeks Ago', value: -2 },
	{ label: '3 Weeks Ago', value: -3 },
]

const ReportsPage = () => {
	const { productionJobs, battlePlans, employees, activityLogs, analyticsTargets, saveAnalyticsTargets, addActivityLog } = useAppState()

	const [weekOffset, setWeekOffset] = useState(0)
	const [comparisonMode, setComparisonMode] = useState<'PREVIOUS_WEEK' | 'ROLLING_4_WEEK' | 'BASELINE_8_WEEK'>('PREVIOUS_WEEK')
	const [excludedMetricKeys, setExcludedMetricKeys] = useState<Record<string, boolean>>({})
	const [acknowledgedQualityKeys, setAcknowledgedQualityKeys] = useState<Record<string, boolean>>({})
	const [targetsDraft, setTargetsDraft] = useState<ProductionAnalyticsTargets>(analyticsTargets)

	const anchorDate = useMemo(() => {
		const date = new Date()
		date.setDate(date.getDate() + weekOffset * 7)
		return date
	}, [weekOffset])

	const analyticsService = useMemo(
		() =>
			new ProductionAnalyticsService({
				productionJobs,
				battlePlans,
				employees,
				activityLogs,
				now: anchorDate,
				targets: targetsDraft,
			}),
		[productionJobs, battlePlans, employees, activityLogs, anchorDate, targetsDraft],
	)

	const analytics = useMemo(() => analyticsService.getWeeklyAnalytics(comparisonMode), [analyticsService, comparisonMode])
	const currentWeek = analytics.currentWeek

	const metricByKey = useMemo(() => {
		const map = new Map<ProductionMetricDefinition['key'], ProductionMetricDefinition>()
		currentWeek.metricDefinitions.forEach((metric) => map.set(metric.key, metric))
		return map
	}, [currentWeek.metricDefinitions])

	const qualityMetric = metricByKey.get('FIRST_PASS_QUALITY')
	const reworkMetric = metricByKey.get('REWORK_RATE')
	const carryForwardMetric = metricByKey.get('CARRY_FORWARD_RATE')
	const leadTimeMetric = metricByKey.get('MEDIAN_LEAD_TIME')
	const capacityMetric = metricByKey.get('CAPACITY_LOAD')

	const carryForwardReasons = useMemo(() => {
		const tasks = battlePlans
			.filter((plan) => {
				const date = new Date(plan.date)
				const weekStart = new Date(currentWeek.weekStartDate)
				const weekEnd = new Date(currentWeek.weekEndDate)
				return date >= weekStart && date <= weekEnd
			})
			.flatMap((plan) => plan.tasks)
			.filter((task) => task.carryForward)

		return tasks.reduce<Record<string, number>>((acc, task) => {
			const reason = task.notes.trim().length > 0 ? task.notes : 'Unspecified'
			acc[reason] = (acc[reason] ?? 0) + task.estimatedMinutes
			return acc
		}, {})
	}, [battlePlans, currentWeek.weekStartDate, currentWeek.weekEndDate])

	const saveTargets = (): void => {
		saveAnalyticsTargets(targetsDraft)
	}

	const generateSnapshotLog = (): void => {
		addActivityLog({
			entityType: 'BattlePlan',
			entityId: currentWeek.id,
			action: 'WEEKLY_SNAPSHOT_GENERATED',
			metadata: {
				weekStartDate: currentWeek.weekStartDate,
				weekEndDate: currentWeek.weekEndDate,
				metricCount: currentWeek.metricDefinitions.length,
			},
		})
	}

	const markMetricExcluded = (metric: ProductionMetricDefinition): void => {
		setExcludedMetricKeys((current) => ({ ...current, [metric.key]: true }))
		addActivityLog({
			entityType: 'BattlePlan',
			entityId: metric.key,
			action: 'METRIC_EXCLUDED_MANUALLY',
			metadata: {
				weekStartDate: currentWeek.weekStartDate,
			},
		})
	}

	const acknowledgeQualityIssue = (metric: ProductionMetricDefinition): void => {
		setAcknowledgedQualityKeys((current) => ({ ...current, [metric.key]: true }))
		addActivityLog({
			entityType: 'BattlePlan',
			entityId: metric.key,
			action: 'DATA_QUALITY_ISSUE_ACKNOWLEDGED',
			metadata: {
				weekStartDate: currentWeek.weekStartDate,
			},
		})
	}

	const visibleMetrics = currentWeek.metricDefinitions.filter((metric) => !excludedMetricKeys[metric.key])

	return (
		<section className="page reports-page">
			<div className="page-heading">
				<h2>Weekly Production Analytics</h2>
				<p>
					Balanced scorecard for output, schedule reliability, quality, lead time, carry-forward,
					capacity, and bottlenecks.
				</p>
			</div>

			<section className="panel reports-controls">
				<div className="form-grid reports-control-grid">
					<label>
						Week Selector
						<select
							value={weekOffset}
							onChange={(event) => setWeekOffset(Number(event.target.value))}
						>
							{weekOffsetOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<label>
						Comparison Selector
						<select
							value={comparisonMode}
							onChange={(event) =>
								setComparisonMode(event.target.value as 'PREVIOUS_WEEK' | 'ROLLING_4_WEEK' | 'BASELINE_8_WEEK')
							}
						>
							<option value="PREVIOUS_WEEK">Previous Week</option>
							<option value="ROLLING_4_WEEK">4-Week Average</option>
							<option value="BASELINE_8_WEEK">8-Week Baseline</option>
						</select>
					</label>

					<label>
						On-Time Target (%)
						<input
							type="number"
							value={targetsDraft.onTimeCompletionRateTarget}
							onChange={(event) =>
								setTargetsDraft((current) => ({
									...current,
									onTimeCompletionRateTarget: Number(event.target.value),
								}))
							}
						/>
					</label>

					<label>
						Schedule Target (%)
						<input
							type="number"
							value={targetsDraft.scheduleAttainmentTarget}
							onChange={(event) =>
								setTargetsDraft((current) => ({
									...current,
									scheduleAttainmentTarget: Number(event.target.value),
								}))
							}
						/>
					</label>
				</div>

				<div className="button-row">
					<button type="button" className="btn" onClick={saveTargets}>
						Save Targets
					</button>
					<button type="button" className="btn" onClick={generateSnapshotLog}>
						Log Weekly Snapshot
					</button>
				</div>

				<p className="subtle">
					Week: {currentWeek.weekStartDate} to {currentWeek.weekEndDate} • Generated at{' '}
					{new Date(currentWeek.generatedAt).toLocaleString()}
				</p>
			</section>

			<section className="panel">
				<h3>1. Weekly Production Scorecard</h3>
				<div className="reports-metric-grid">
					{visibleMetrics.map((metric) => (
						<article key={metric.key} className="reports-metric-card">
							<p>{metric.label}</p>
							<h4>{formatMetricValue(metric)}</h4>
							<p className={`reports-trend ${trendToneClass(metric.trend.direction)}`}>
								{metric.trend.direction} •
								{' '}
								{metric.trend.absoluteChange === null
									? '--'
									: `${metric.trend.absoluteChange > 0 ? '+' : ''}${metric.trend.absoluteChange}`}
							</p>
							<p className="subtle">Benchmark: {metric.benchmark.target}{metric.benchmark.unit === 'PERCENT' ? '%' : ''}</p>
							<div className="reports-metric-actions">
								<button type="button" className="btn" onClick={() => markMetricExcluded(metric)}>
									Exclude Metric
								</button>
								<button
									type="button"
									className="btn"
									disabled={Boolean(acknowledgedQualityKeys[metric.key])}
									onClick={() => acknowledgeQualityIssue(metric)}
								>
									{acknowledgedQualityKeys[metric.key] ? 'Quality Acknowledged' : 'Acknowledge Data Quality'}
								</button>
							</div>
							<p className="subtle">Confidence: {Math.round(metric.dataQuality.confidence * 100)}%</p>
						</article>
					))}
				</div>
			</section>

			<section className="panel">
				<h3>2. Warehouse Operator Comparison</h3>
				<div className="table-wrap">
					<table className="workshop-table">
						<thead>
							<tr>
								<th>Operator</th>
								<th>Std Min Earned</th>
								<th>Schedule Attainment</th>
								<th>First-Pass Quality</th>
								<th>Finished Pieces</th>
								<th>Carry-Forward</th>
								<th>Rework</th>
								<th>Blocked</th>
								<th>Planned vs Completed</th>
							</tr>
						</thead>
						<tbody>
							{currentWeek.operatorScorecards.map((scorecard) => (
								<tr key={scorecard.employeeId}>
									<td>{scorecard.employeeName}</td>
									<td>{scorecard.standardMinutesEarned}</td>
									<td>{formatPercent(scorecard.scheduleAttainment)}</td>
									<td>{formatPercent(scorecard.firstPassQuality)}</td>
									<td>{scorecard.finishedPieces}</td>
									<td>{scorecard.carryForwardMinutes}</td>
									<td>{scorecard.reworkMinutes}</td>
									<td>{scorecard.blockedMinutes}</td>
									<td>
										{scorecard.plannedMinutes} / {scorecard.completedMinutes}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="panel reports-two-col">
				<article>
					<h3>3. Production Director Scorecard</h3>
					<ul className="plain-list">
						<li><span>Department On-Time Completion</span><strong>{formatPercent(currentWeek.directorScorecard.departmentOnTimeCompletion)}</strong></li>
						<li><span>Department Schedule Attainment</span><strong>{formatPercent(currentWeek.directorScorecard.departmentScheduleAttainment)}</strong></li>
						<li><span>Department First-Pass Quality</span><strong>{formatPercent(currentWeek.directorScorecard.departmentFirstPassQuality)}</strong></li>
						<li><span>Finished-Piece Throughput</span><strong>{currentWeek.directorScorecard.finishedPieceThroughput}</strong></li>
						<li><span>Standard Hours Earned</span><strong>{currentWeek.directorScorecard.standardHoursEarned}</strong></li>
						<li><span>Median Lead Time</span><strong>{currentWeek.directorScorecard.medianLeadTimeDays ?? '--'} days</strong></li>
						<li><span>At-Risk / Overdue Backlog</span><strong>{currentWeek.directorScorecard.atRiskBacklog} / {currentWeek.directorScorecard.overdueBacklog}</strong></li>
						<li><span>Bottleneck Stage</span><strong>{currentWeek.directorScorecard.bottleneckStage ?? '--'}</strong></li>
						<li><span>VSD</span><strong>{currentWeek.directorScorecard.vsd ?? '--'}</strong></li>
						<li><span>Particles Handled</span><strong>{currentWeek.directorScorecard.particlesHandled ?? '--'}</strong></li>
					</ul>
				</article>

				<article>
					<h3>4. Stage Bottleneck Report</h3>
					<div className="table-wrap">
						<table className="workshop-table">
							<thead>
								<tr>
									<th>Stage</th>
									<th>Active Pieces</th>
									<th>Std Min Waiting</th>
									<th>Median Age</th>
									<th>Oldest WorkItem</th>
									<th>Above Threshold</th>
								</tr>
							</thead>
							<tbody>
								{currentWeek.stageSnapshots.map((stage) => (
									<tr key={stage.stage}>
										<td>{stage.stage}</td>
										<td>{stage.activePieceCount}</td>
										<td>{stage.totalStandardMinutesWaiting}</td>
										<td>{stage.medianAgeDaysInStage ?? '--'}</td>
										<td>{stage.oldestWorkItemOrderNumber ?? '--'}</td>
										<td>{stage.itemsAboveStageAgeThreshold}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</article>
			</section>

			<section className="panel reports-two-col">
				<article>
					<h3>5. Quality and Rework Report</h3>
					<ul className="plain-list">
						<li><span>First-Pass Quality</span><strong>{qualityMetric ? formatMetricValue(qualityMetric) : '--'}</strong></li>
						<li><span>Rework Rate</span><strong>{reworkMetric ? formatMetricValue(reworkMetric) : '--'}</strong></li>
						<li><span>Carry-Forward Rate</span><strong>{carryForwardMetric ? formatMetricValue(carryForwardMetric) : '--'}</strong></li>
					</ul>
					<p className="subtle">
						Quality confidence is reduced when inspection acceptance flags are unavailable.
					</p>
				</article>

				<article>
					<h3>6. Lead-Time Report</h3>
					<p>
						Median Lead Time: <strong>{leadTimeMetric ? formatMetricValue(leadTimeMetric) : '--'}</strong>
					</p>
					<div className="table-wrap">
						<table className="workshop-table">
							<thead>
								<tr>
									<th>Cohort</th>
									<th>Value</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(leadTimeMetric?.valueByCohort ?? {}).map(([cohort, value]) => (
									<tr key={cohort}>
										<td>{cohort}</td>
										<td>{value === null ? '--' : value}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</article>
			</section>

			<section className="panel reports-two-col">
				<article>
					<h3>7. Carry-Forward Reasons</h3>
					<ul className="plain-list">
						{Object.keys(carryForwardReasons).length > 0 ? (
							Object.entries(carryForwardReasons).map(([reason, minutes]) => (
								<li key={reason}>
									<span>{reason}</span>
									<strong>{minutes} min</strong>
								</li>
							))
						) : (
							<li>
								<span>No carry-forward records this week</span>
								<strong>--</strong>
							</li>
						)}
					</ul>
				</article>

				<article>
					<h3>8. Capacity Report</h3>
					<p>
						Capacity Load: <strong>{capacityMetric ? formatMetricValue(capacityMetric) : '--'}</strong>
					</p>
					<div className="table-wrap">
						<table className="workshop-table">
							<thead>
								<tr>
									<th>Employee</th>
									<th>Required Std Min</th>
									<th>Available Min</th>
									<th>Load</th>
								</tr>
							</thead>
							<tbody>
								{currentWeek.operatorScorecards.map((scorecard) => {
									const employee = employees.find((candidate) => candidate.id === scorecard.employeeId)
									const available = employee?.defaultAvailableMinutes ?? 0
									const load = available > 0 ? (scorecard.plannedMinutes / available) * 100 : null
									return (
										<tr key={scorecard.employeeId}>
											<td>{scorecard.employeeName}</td>
											<td>{scorecard.plannedMinutes}</td>
											<td>{available}</td>
											<td>{formatPercent(load)}</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</article>
			</section>

			<section className="panel">
				<h3>Data Quality</h3>
				<ul className="plain-list">
					{currentWeek.dataQuality.missingData.map((item) => (
						<li key={item}>
							<span>{item}</span>
							<strong>Missing</strong>
						</li>
					))}
				</ul>
			</section>
		</section>
	)
}

export default ReportsPage
