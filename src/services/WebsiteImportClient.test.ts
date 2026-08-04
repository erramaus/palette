import { describe, expect, it } from 'vitest'
import { createFixtureWebsiteImportClient } from './WebsiteImportClient'

describe('WebsiteImportClient', () => {
  it('returns the fixture preview without exposing secrets', async () => {
    const client = createFixtureWebsiteImportClient()
    const preview = await client.fetchPreview()

    expect(preview.connectionStatus).toBe('CONNECTED')
    expect(preview.normalizedOrderPreviews).toHaveLength(2)
    expect(JSON.stringify(preview)).not.toContain('password')
    expect(JSON.stringify(preview)).not.toContain('cookie')
    expect(JSON.stringify(preview)).not.toContain('token')
  })
})