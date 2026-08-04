import { readImportProxyConfig, getCorsHeaders, isOriginAllowed } from './config'
import { isImportProxyError } from './errors'
import { normalizeWarehouseOrderRecord } from './validation'
import type {
  HttpResponseEnvelope,
  PreviewWarning,
  WarehouseOrdersPreviewRequest,
  WarehouseOrdersPreviewResponseBody,
} from './types'
import type { UpstreamAuthenticator, WarehouseOrderSource } from './upstream'

export interface WarehouseOrdersPreviewDependencies {
  readConfig?: typeof readImportProxyConfig
  authenticator: UpstreamAuthenticator
  source: WarehouseOrderSource
  now?: () => string
}

const fixtureWarning = (): PreviewWarning => ({
  code: 'FIXTURE_TRANSPORT_ACTIVE',
  message: 'Preview is backed by fixture transport until the upstream login mechanism is confirmed.',
})

const methodNotAllowed = (): HttpResponseEnvelope => ({
  status: 405,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Allow: 'GET, OPTIONS',
  },
  body: {
    connectionStatus: 'UNAVAILABLE',
    fetchedAt: null,
    normalizedOrderPreviews: [],
    warnings: [],
    validationErrors: [],
    sourceRecordIds: [],
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and OPTIONS are allowed for the warehouse order preview endpoint.',
    },
  },
})

const buildErrorResponse = (
  error: unknown,
  headers: Record<string, string>,
  now: () => string,
): HttpResponseEnvelope => {
  if (isImportProxyError(error)) {
    return {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      },
      body: {
        connectionStatus: 'UNAVAILABLE',
        fetchedAt: null,
        normalizedOrderPreviews: [],
        warnings: [],
        validationErrors: [],
        sourceRecordIds: [],
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    }
  }

  return {
    status: 500,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
    body: {
      connectionStatus: 'UNAVAILABLE',
      fetchedAt: null,
      normalizedOrderPreviews: [],
      warnings: [],
      validationErrors: [],
      sourceRecordIds: [],
      error: {
        code: 'UNEXPECTED_PROXY_FAILURE',
        message: error instanceof Error ? error.message : 'An unexpected import proxy failure occurred.',
        details: { occurredAt: now() },
      },
    },
  }
}

const buildSuccessResponse = (
  body: WarehouseOrdersPreviewResponseBody,
  headers: Record<string, string>,
): HttpResponseEnvelope => ({
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  },
  body,
})

export const createWarehouseOrdersPreviewHandler = (dependencies: WarehouseOrdersPreviewDependencies) => {
  const now = dependencies.now ?? (() => new Date().toISOString())

  return async (request: WarehouseOrdersPreviewRequest): Promise<HttpResponseEnvelope> => {
    const configReader = dependencies.readConfig ?? readImportProxyConfig
    const config = configReader()
    const origin = request.headers.Origin ?? request.headers.origin
    const corsHeaders = getCorsHeaders(origin, config.allowedOrigins)

    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      return {
        status: 403,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          connectionStatus: 'UNAVAILABLE',
          fetchedAt: null,
          normalizedOrderPreviews: [],
          warnings: [],
          validationErrors: [],
          sourceRecordIds: [],
          error: {
            code: 'CORS_ORIGIN_NOT_ALLOWED',
            message: 'The request origin is not on the import proxy allowlist.',
          },
        },
      }
    }

    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          ...corsHeaders,
        },
        body: {
          connectionStatus: 'CONNECTED',
          fetchedAt: now(),
          normalizedOrderPreviews: [],
          warnings: [],
          validationErrors: [],
          sourceRecordIds: [],
        },
      }
    }

    if (request.method !== 'GET') {
      return methodNotAllowed()
    }

    try {
      const session = await dependencies.authenticator.authenticate(config)
      const sourceRecords = await dependencies.source.fetchWarehouseOrders(session)

      const normalizationOutcomes = sourceRecords.map((record) => normalizeWarehouseOrderRecord(record))
      const normalizedOrderPreviews = normalizationOutcomes.flatMap((outcome) => (outcome.preview ? [outcome.preview] : []))
      const validationErrors = normalizationOutcomes.flatMap((outcome) => outcome.validationErrors)
      const warnings: PreviewWarning[] = [fixtureWarning()]
      const connectionStatus = warnings.length > 0 || validationErrors.length > 0 ? 'DEGRADED' : 'CONNECTED'

      return buildSuccessResponse(
        {
          connectionStatus,
          fetchedAt: now(),
          normalizedOrderPreviews,
          warnings,
          validationErrors,
          sourceRecordIds: sourceRecords.map((record) => record.sourceRecordId),
        },
        corsHeaders,
      )
    } catch (error) {
      return buildErrorResponse(error, corsHeaders, now)
    }
  }
}