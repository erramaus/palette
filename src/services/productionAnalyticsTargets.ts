import {
  DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
  type ProductionAnalyticsTargets,
} from '../types/productionAnalytics'

const STORAGE_KEY = 'palette.productionAnalyticsTargets.v1'

const hasWindow = (): boolean => typeof window !== 'undefined'

export const loadProductionAnalyticsTargets = (): ProductionAnalyticsTargets => {
  if (!hasWindow()) {
    return DEFAULT_PRODUCTION_ANALYTICS_TARGETS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PRODUCTION_ANALYTICS_TARGETS
    }

    const parsed = JSON.parse(raw) as Partial<ProductionAnalyticsTargets>
    return {
      ...DEFAULT_PRODUCTION_ANALYTICS_TARGETS,
      ...parsed,
    }
  } catch {
    return DEFAULT_PRODUCTION_ANALYTICS_TARGETS
  }
}

export const saveProductionAnalyticsTargets = (
  targets: ProductionAnalyticsTargets,
): void => {
  if (!hasWindow()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
}
