import { ImportProxyError } from './errors'
import type { ImportProxyConfig, ReadOnlyUpstreamSession, WarehouseOrderSourceRecord } from './types'

export interface UpstreamAuthenticator {
  authenticate: (config: ImportProxyConfig) => Promise<ReadOnlyUpstreamSession>
}

export interface WarehouseOrderSource {
  fetchWarehouseOrders: (session: ReadOnlyUpstreamSession) => Promise<WarehouseOrderSourceRecord[]>
}

export class MockUpstreamAuthenticator implements UpstreamAuthenticator {
  async authenticate(config: ImportProxyConfig): Promise<ReadOnlyUpstreamSession> {
    if (!config.baseUrl.trim()) {
      throw new ImportProxyError({
        code: 'UPSTREAM_BASE_URL_MISSING',
        message: 'The upstream base URL is missing.',
        statusCode: 500,
      })
    }

    return {
      transportMode: 'fixture',
      upstreamBaseUrl: config.baseUrl.trim(),
      authenticatedAt: new Date().toISOString(),
    }
  }
}

export class FixtureWarehouseOrderSource implements WarehouseOrderSource {
  private readonly records: WarehouseOrderSourceRecord[]

  constructor(records: WarehouseOrderSourceRecord[]) {
    this.records = records
  }

  async fetchWarehouseOrders(_session: ReadOnlyUpstreamSession): Promise<WarehouseOrderSourceRecord[]> {
    return this.records.map((record) => ({
      ...record,
      originalSourceFields: record.originalSourceFields ? { ...record.originalSourceFields } : undefined,
    }))
  }
}