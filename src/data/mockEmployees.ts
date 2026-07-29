import type { Employee } from '../types/employees'

export const mockEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Erin Hanson',
    role: 'PRODUCTION_DIRECTOR',
    skills: ['FILES', 'PRINTED', 'DIBOND', 'STRETCHER_BASE', 'MOUNTED', 'FRAME_MADE', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 480,
    active: true,
  },
  {
    id: 'EMP-002',
    name: 'Daniel Reyes',
    role: 'WORKER',
    skills: ['DIBOND', 'STRETCHER_BASE', 'MOUNTED', 'FRAME_MADE', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 420,
    active: true,
  },
  {
    id: 'EMP-003',
    name: 'Mia Chen',
    role: 'WORKER',
    skills: ['FILES', 'PRINTED', 'STRETCHER_BASE', 'MOUNTED', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 390,
    active: true,
  },
  {
    id: 'EMP-004',
    name: 'Lucas Patel',
    role: 'WORKER',
    skills: ['FILES', 'PRINTED', 'STRETCHER_BASE', 'MOUNTED', 'FRAME_MADE'],
    defaultAvailableMinutes: 360,
    active: true,
  },
  {
    id: 'EMP-005',
    name: 'Sofia Alvarez',
    role: 'WORKER',
    skills: ['PRINTED', 'DIBOND', 'STRETCHER_BASE', 'MOUNTED', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 400,
    active: true,
  },
  {
    id: 'EMP-006',
    name: 'Noah Kim',
    role: 'WORKER',
    skills: ['FILES', 'PRINTED', 'FRAME_MADE', 'FRAMED', 'SHIPPED'],
    defaultAvailableMinutes: 420,
    active: true,
  },
]
