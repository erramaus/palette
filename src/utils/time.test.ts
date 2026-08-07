import { describe, expect, it } from 'vitest'
import { formatDateOnly } from './time'

describe('formatDateOnly', () => {
  it('preserves the calendar day for ISO date-only values', () => {
    expect(formatDateOnly('2026-08-11')).toBe(new Date(2026, 7, 11).toLocaleDateString())
  })
})