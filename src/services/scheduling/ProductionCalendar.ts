export interface CalendarBreak {
  start: string
  finish: string
}

export interface WorkCenterCalendar {
  id: string
  name: string
  capacity: number
  unavailableDates?: string[]
}

export interface ProductionCalendar {
  workingDays: number[]
  workdayStart: string
  workdayFinish: string
  breaks: CalendarBreak[]
  holidays: string[]
  workCenters: WorkCenterCalendar[]
}