import {
  DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
  type ProductionAnalyticsTargets,
} from '../types/productionAnalytics'

let currentTargets: ProductionAnalyticsTargets = DEFAULT_PRODUCTION_ANALYTICS_TARGETS

export const loadProductionAnalyticsTargets = (): ProductionAnalyticsTargets => {
  return currentTargets
}

export const saveProductionAnalyticsTargets = (
  targets: ProductionAnalyticsTargets,
): void => {
  currentTargets = targets
}
