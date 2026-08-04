import { ImportProxyError } from './errors'
import type { ImportProxyConfig } from './types'

const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://erramaus.github.io']

const parseAllowedOrigins = (value: string | undefined): string[] => {
  if (!value?.trim()) {
    return [...defaultAllowedOrigins]
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

export const readImportProxyConfig = (env: Record<string, string | undefined> = process.env): ImportProxyConfig => {
  const requireValue = (name: string, value: string | undefined): string => {
    const trimmed = value?.trim()
    if (!trimmed) {
      throw new ImportProxyError({
        code: 'CONFIG_MISSING',
        message: `Missing server configuration: ${name}`,
        statusCode: 500,
        details: { missing: [name] },
      })
    }

    return trimmed
  }

  const baseUrl = requireValue('WEBSITE_IMPORT_BASE_URL', env.WEBSITE_IMPORT_BASE_URL)
  const username = requireValue('WEBSITE_IMPORT_USERNAME', env.WEBSITE_IMPORT_USERNAME)
  const password = requireValue('WEBSITE_IMPORT_PASSWORD', env.WEBSITE_IMPORT_PASSWORD)

  return {
    baseUrl,
    username,
    password,
    allowedOrigins: parseAllowedOrigins(env.WEBSITE_IMPORT_ALLOWED_ORIGINS),
  }
}

export const isOriginAllowed = (origin: string | undefined, allowedOrigins: string[]): boolean => {
  if (!origin) {
    return false
  }

  return allowedOrigins.includes(origin)
}

export const getCorsHeaders = (origin: string | undefined, allowedOrigins: string[]): Record<string, string> => {
  if (!isOriginAllowed(origin, allowedOrigins)) {
    return {}
  }

  const allowedOrigin = origin ?? ''

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '600',
  }
}