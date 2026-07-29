export const colors = {
  primary: '#1E2A4A',
  lightBlue: '#78C4F4',
  purple: '#7861FF',
  orange: '#F4A261',
  magenta: '#F062BB',
  lightGray: '#F5F7FA',
  darkGray: '#64748B',
  white: '#FFFFFF',
  text: '#20262F',
  line: '#D4DBE7',
  waiting: '#F5F7FA',
  complete: '#1E2A4A',
  notApplicable: '#CBD5E1',
} as const

export type ThemeColorName = keyof typeof colors
