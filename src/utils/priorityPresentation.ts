export type PriorityDisplayTone = 'critical' | 'rush' | 'high' | 'normal' | 'low' | 'backlog'

export interface PriorityPresentation {
  label: 'Critical' | 'Rush' | 'High' | 'Normal' | 'Low' | 'Backlog'
  tone: PriorityDisplayTone
  internalCode: string
  tooltip: string
}

const toPriorityCode = (priority: number): string => `P${priority}`

export const getPriorityPresentation = (priority: number): PriorityPresentation => {
  const internalCode = toPriorityCode(priority)

  if (priority >= 100) {
    return {
      label: 'Critical',
      tone: 'critical',
      internalCode,
      tooltip: `Internal Priority: ${internalCode}`,
    }
  }

  if (priority >= 90) {
    return {
      label: 'Rush',
      tone: 'rush',
      internalCode,
      tooltip: `Internal Priority: ${internalCode}`,
    }
  }

  if (priority >= 80) {
    return {
      label: 'High',
      tone: 'high',
      internalCode,
      tooltip: `Internal Priority: ${internalCode}`,
    }
  }

  if (priority >= 70) {
    return {
      label: 'Normal',
      tone: 'normal',
      internalCode,
      tooltip: `Internal Priority: ${internalCode}`,
    }
  }

  if (priority >= 60) {
    return {
      label: 'Low',
      tone: 'low',
      internalCode,
      tooltip: `Internal Priority: ${internalCode}`,
    }
  }

  return {
    label: 'Backlog',
    tone: 'backlog',
    internalCode,
    tooltip: `Internal Priority: ${internalCode}`,
  }
}
