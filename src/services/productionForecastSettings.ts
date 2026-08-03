import {
  DEFAULT_FORECAST_CONFIG,
  type ForecastConfig,
} from '../types/productionForecasting'

let currentSettings: ForecastConfig = DEFAULT_FORECAST_CONFIG

export const loadProductionForecastSettings = (): ForecastConfig => {
  return currentSettings
}

export const saveProductionForecastSettings = (settings: ForecastConfig): void => {
  currentSettings = settings
}
