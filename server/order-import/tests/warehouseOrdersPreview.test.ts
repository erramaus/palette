import { describe, expect, it } from 'vitest'
import { readImportProxyConfig, getCorsHeaders, isOriginAllowed } from '../src/config'
import { ImportProxyError } from '../src/errors'
import { createWarehouseOrdersPreviewHandler } from '../src/handler'
import { FixtureWarehouseOrderSource, MockUpstreamAuthenticator } from '../src/upstream'
import type { WarehouseOrderSourceRecord, WarehouseOrdersPreviewRequest } from '../src/types'

const validEnv = {
  WEBSITE_IMPORT_BASE_URL: 'https://admin.erinhanson.com',
  WEBSITE_IMPORT_USERNAME: 'server-user',
  WEBSITE_IMPORT_PASSWORD: 'server-password',
}

const makeRequest = (method: string, origin = 'http://localhost:5173'): WarehouseOrdersPreviewRequest => ({
  method,
  headers: {
    origin,
  },
})

describe('import proxy config and CORS', () => {
  it('rejects missing server configuration', () => {
    expect(() => readImportProxyConfig({})).toThrow(ImportProxyError)
    expect(() => readImportProxyConfig({})).toThrow('Missing server configuration')
  })

  it('allows only configured frontend origins', () => {
    const config = readImportProxyConfig({ ...validEnv })

    expect(isOriginAllowed('http://localhost:5173', config.allowedOrigins)).toBe(true)
    expect(isOriginAllowed('https://erramaus.github.io', config.allowedOrigins)).toBe(true)
    expect(isOriginAllowed('https://example.com', config.allowedOrigins)).toBe(false)
    expect(getCorsHeaders('https://example.com', config.allowedOrigins)).toEqual({})
  })
})

describe('warehouse orders preview handler', () => {
  it('surfaces upstream authentication failure', async () => {
    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: {
        async authenticate() {
          throw new ImportProxyError({
            code: 'UPSTREAM_AUTH_FAILED',
            message: 'Upstream authentication failed.',
            statusCode: 502,
          })
        },
      },
      source: new FixtureWarehouseOrderSource([]),
    })

    const response = await handler(makeRequest('GET'))
    expect(response.status).toBe(502)
    expect(JSON.stringify(response.body)).not.toContain('server-password')
    expect(JSON.stringify(response.body)).toContain('UPSTREAM_AUTH_FAILED')
  })

  it('surfaces upstream fetch failure', async () => {
    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: new MockUpstreamAuthenticator(),
      source: {
        async fetchWarehouseOrders() {
          throw new ImportProxyError({
            code: 'UPSTREAM_FETCH_FAILED',
            message: 'Unable to fetch warehouse orders.',
            statusCode: 502,
          })
        },
      },
    })

    const response = await handler(makeRequest('GET'))
    expect(response.status).toBe(502)
    expect(JSON.stringify(response.body)).toContain('UPSTREAM_FETCH_FAILED')
  })

  it('rejects non-GET mutations', async () => {
    let fetched = false
    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: new MockUpstreamAuthenticator(),
      source: {
        async fetchWarehouseOrders() {
          fetched = true
          return []
        },
      },
    })

    const response = await handler(makeRequest('POST'))
    expect(response.status).toBe(405)
    expect(fetched).toBe(false)
  })

  it('normalizes valid source orders', async () => {
    const sourceRecords: WarehouseOrderSourceRecord[] = [
      {
        sourceRecordId: 'warehouse-order-2001',
        orderNumber: 'EHG-2001',
        customer: 'Erin Hanson Gallery',
        artwork: 'Golden Light',
        productType: 'Canvas',
        size: '24 x 30',
        orientation: 'VERT',
        frame: 'Walnut Float Frame',
        dueDate: '2026-08-12',
        fulfillmentMethod: 'Ship',
        shippingDestination: 'Laguna Beach, CA',
        notes: 'Call on delivery.',
        redNotes: 'Rush',
        originalSourceFields: {
          orderNumber: 'EHG-2001',
          customer: 'Erin Hanson Gallery',
          artwork: 'Golden Light',
          privateMemo: 'should not surface',
          password: 'should not surface',
        },
      },
    ]

    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: new MockUpstreamAuthenticator(),
      source: new FixtureWarehouseOrderSource(sourceRecords),
    })

    const response = await handler(makeRequest('GET'))
    expect(response.status).toBe(200)
    const body = response.body
    expect(body.connectionStatus).toBe('DEGRADED')
    expect(body.normalizedOrderPreviews).toHaveLength(1)
    expect(body.normalizedOrderPreviews[0].sourceRecordId).toBe('warehouse-order-2001')
    expect(JSON.stringify(body)).not.toContain('password')
    expect(JSON.stringify(body)).not.toContain('privateMemo')
  })

  it('returns validation errors for malformed source orders', async () => {
    const sourceRecords: WarehouseOrderSourceRecord[] = [
      {
        sourceRecordId: 'warehouse-order-bad-2002',
        orderNumber: null,
        customer: 'Missing Order Number',
        artwork: 'Broken Source Row',
        productType: 'Canvas',
        size: '16 x 20',
        orientation: 'VERT',
        frame: 'Maple Float Frame',
        dueDate: '2026-08-11',
        fulfillmentMethod: 'Ship',
        shippingDestination: 'Laguna Beach, CA',
        notes: '',
        redNotes: '',
      },
    ]

    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: new MockUpstreamAuthenticator(),
      source: new FixtureWarehouseOrderSource(sourceRecords),
    })

    const response = await handler(makeRequest('GET'))
    expect(response.status).toBe(200)
    expect(response.body.normalizedOrderPreviews).toHaveLength(0)
    expect(response.body.validationErrors.length).toBeGreaterThan(0)
    expect(response.body.validationErrors[0].message).toContain('orderNumber')
  })

  it('keeps a read-only preview boundary', async () => {
    const handler = createWarehouseOrdersPreviewHandler({
      readConfig: () => readImportProxyConfig({ ...validEnv }),
      authenticator: new MockUpstreamAuthenticator(),
      source: new FixtureWarehouseOrderSource([]),
    })

    const response = await handler(makeRequest('OPTIONS'))
    expect(response.status).toBe(204)
    expect(response.headers['Access-Control-Allow-Methods']).toContain('GET')
  })
})