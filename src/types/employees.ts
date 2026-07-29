import type { ProductionStepName } from './production'

export type EmployeeRole = 'PRODUCTION_DIRECTOR' | 'WORKER' | 'ADMIN'

export interface Employee {
  id: string
  name: string
  role: EmployeeRole
  skills: ProductionStepName[]
  defaultAvailableMinutes: number
  active: boolean
}
