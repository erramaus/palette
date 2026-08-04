export class ImportProxyError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly details?: Record<string, unknown>

  constructor(input: { code: string; message: string; statusCode: number; details?: Record<string, unknown> }) {
    super(input.message)
    this.name = 'ImportProxyError'
    this.code = input.code
    this.statusCode = input.statusCode
    this.details = input.details
  }
}

export const isImportProxyError = (error: unknown): error is ImportProxyError => {
  return error instanceof ImportProxyError
}