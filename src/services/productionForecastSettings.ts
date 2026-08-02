import {
  DEFAULT_FORECAST_CONFIG,
  type ForecastConfig,
} from '../types/productionForecasting'

const STORAGE_KEY = 'palette.productionForecastSettings.v1'

const hasWindow = (): boolean => typeof window !== 'undefined'

export const loadProductionForecastSettings = (): ForecastConfig => {
  if (!hasWindow()) {
    return DEFAULT_FORECAST_CONFIG
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_FORECAST_CONFIG
    }

    const parsed = JSON.parse(raw) as Partial<ForecastConfig>
    return {
      ...DEFAULT_FORECAST_CONFIG,
      ...parsed,
    }
  } catch {
    return DEFAULT_FORECAST_CONFIG
  }
}

export const saveProductionForecastSettings = (settings: ForecastConfig): void => {
  if (!hasWindow()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
