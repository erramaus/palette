import { readImportProxyConfig } from './config'
import { MockUpstreamAuthenticator, FixtureWarehouseOrderSource } from './upstream'
import { warehouseOrderRecordsFixture } from './fixtures/warehouseOrderRecords.fixture'
import { createWarehouseOrdersPreviewHandler } from './handler'
import type { WarehouseOrdersPreviewRequest, HttpResponseEnvelope } from './types'

export interface AzureFunctionHttpRequest {
  method?: string
  headers: Record<string, string | undefined>
}

export interface AzureFunctionHttpResponse {
  status: number
  headers?: Record<string, string>
  jsonBody: unknown
}

const handleRequest = createWarehouseOrdersPreviewHandler({
  readConfig: readImportProxyConfig,
  authenticator: new MockUpstreamAuthenticator(),
  source: new FixtureWarehouseOrderSource(warehouseOrderRecordsFixture),
})

export const warehouseOrdersPreview = async (request: AzureFunctionHttpRequest): Promise<AzureFunctionHttpResponse> => {
  const handlerRequest: WarehouseOrdersPreviewRequest = {
    method: request.method ?? 'GET',
    headers: request.headers,
  }

  const response: HttpResponseEnvelope = await handleRequest(handlerRequest)

  return {
    status: response.status,
    headers: response.headers,
    jsonBody: response.body,
  }
}