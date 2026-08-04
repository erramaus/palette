import { describe, expect, it } from 'vitest'
import { ImportProxyError } from '../src/errors'
import { buildWarehouseAdminPreview, createWarehouseAdminTransport } from '../src/warehouseAdminTransport'

const createFetch = (responses: Record<string, { status: number; body: unknown; contentType?: string }>) => {
  return async (input: string | URL | Request) => {
    const url = String(input)
    const response = responses[url]
    if (!response) {
      throw new Error(`Unexpected request: ${url}`)
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        'Content-Type': response.contentType ?? 'application/json; charset=utf-8',
      },
    })
  }
}

const baseUrl = 'https://admin.erinhanson.com'

const pageDto = {
  statTable: {
    vsdRolledPrint: 0,
    vsdStretchedPrint: 0,
    vsdFramedPrint: 0,
    vsd3DPrint: 0,
    vsdOriginal: 0,
    vsdLastWeekEnding: '2026-07-26',
    vsdThisWeekEnding: '2026-08-02',
    lastWeeksVSD: 47006.9,
    thisWeeksVSD: 15760,
    thisWeeksVOS: 13396,
    lastWeeksVOS: 39965.3,
    lastWeeksNumParts: 0,
    thisWeeksNumParts: 0,
    lastWeeksPercOnDeadline: 0,
    thisWeeksPercOnDeadline: 0,
  },
  orders: [
    {
      id: 18764,
      firstName: 'Edward',
      lastName: 'Herring',
      manualEntry: false,
      timeCreated: '2026-07-30T09:07:37Z',
      timeDelivered: null,
      subTotal: 4500,
      shipping: 0,
      crateFee: 0,
      tax: 0,
      balanceIsZero: true,
      company: null,
      shippingFirstName: 'Edward',
      shippingLastName: 'Herring',
      shipAddress1: '123 Example St',
      shipAddress2: null,
      shipCity: 'Laguna Beach',
      shipState: 'CA',
      shipZip: '92651',
      shipCountry: 'US',
      email: 'ed@example.com',
      phone: '555-0000',
      isGift: false,
      giftMessage: null,
      orderItems: [
        {
          id: 'oi-1',
          productType: 'Canvas',
          count: 1,
          deliveryStatus: 'Ship',
          dueDate: '2026-08-13',
          dryDate: null,
          timeDelivered: null,
          flowType: 'Custom - Delivery',
          productName: 'Mt Rainier Peak',
          thumbnailImage: null,
          isLimitedPrint: false,
          isOpenEdition3D: false,
          isPaperPrint: true,
          limitedEditionNumber: null,
          printHeight: 20,
          printWidth: 16,
          origStyleText: 'Paper Print',
          printStyleText: 'Foam Core',
          frameItemFrameText: 'No Frame',
          girth: 0,
          shippingAccount: null,
          timeWorkComplete: null,
          statWeek: null,
          selected: true,
        },
      ],
      orderNotes: [{ note: 'Handle with care.' }],
      shippingLabels: [],
    },
  ],
}

const report = {
  vsdThis: 15760,
  vsdLast: 47006.9,
  vsdPrior: 72068,
  cvsdThis: 13396,
  cvsdLast: 39965.3,
  cvsdPrior: 61121.8,
}

describe('warehouse admin transport', () => {
  it('builds a successful authenticated preview from mocked upstream responses', async () => {
    const transport = createWarehouseAdminTransport({
      baseUrl,
      cookieHeader: 'test-cookie=redacted',
      fetchImpl: createFetch({
        [`${baseUrl}/api/Auth/Me`]: { status: 200, body: { isAuthenticated: true, email: 'sophia@erinhanson.com' } },
        [`${baseUrl}/api/warehouse/warehouse-page-dto`]: { status: 200, body: pageDto },
        [`${baseUrl}/api/warehouse/warehouse-vsd-report`]: { status: 200, body: report },
      }),
    })

    const preview = await buildWarehouseAdminPreview(transport)

    expect(preview.connectionStatus).toBe('CONNECTED')
    expect(preview.normalizedOrderPreviews).toHaveLength(1)
    expect(preview.normalizedOrderPreviews[0].sourceRecordId).toBe('18764')
    expect(JSON.stringify(preview)).not.toContain('test-cookie=redacted')
  })

  it('rejects invalid credentials when auth probe reports unauthenticated', async () => {
    const transport = createWarehouseAdminTransport({
      baseUrl,
      fetchImpl: createFetch({
        [`${baseUrl}/api/Auth/Me`]: { status: 200, body: { isAuthenticated: false, email: null } },
      }),
    })

    await expect(buildWarehouseAdminPreview(transport)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    })
  })

  it('surfaces expired session as an auth failure', async () => {
    const transport = createWarehouseAdminTransport({
      baseUrl,
      fetchImpl: createFetch({
        [`${baseUrl}/api/Auth/Me`]: { status: 200, body: { isAuthenticated: true, email: 'sophia@erinhanson.com' } },
        [`${baseUrl}/api/warehouse/warehouse-page-dto`]: { status: 401, body: { message: 'expired' } },
      }),
    })

    await expect(buildWarehouseAdminPreview(transport)).rejects.toBeInstanceOf(ImportProxyError)
  })

  it('surfaces warehouse export failure', async () => {
    const transport = createWarehouseAdminTransport({
      baseUrl,
      fetchImpl: createFetch({
        [`${baseUrl}/api/Auth/Me`]: { status: 200, body: { isAuthenticated: true, email: 'sophia@erinhanson.com' } },
        [`${baseUrl}/api/warehouse/warehouse-page-dto`]: { status: 200, body: pageDto },
        [`${baseUrl}/api/warehouse/warehouse-vsd-report`]: { status: 500, body: { message: 'fail' } },
      }),
    })

    await expect(buildWarehouseAdminPreview(transport)).rejects.toBeInstanceOf(ImportProxyError)
  })

  it('redacts session material from preview responses', async () => {
    const transport = createWarehouseAdminTransport({
      baseUrl,
      cookieHeader: 'cid=abc; .AspNetCore.Identity.Application=secret',
      fetchImpl: createFetch({
        [`${baseUrl}/api/Auth/Me`]: { status: 200, body: { isAuthenticated: true, email: 'sophia@erinhanson.com' } },
        [`${baseUrl}/api/warehouse/warehouse-page-dto`]: { status: 200, body: pageDto },
        [`${baseUrl}/api/warehouse/warehouse-vsd-report`]: { status: 200, body: report },
      }),
    })

    const preview = await buildWarehouseAdminPreview(transport)

    expect(JSON.stringify(preview)).not.toContain('.AspNetCore.Identity.Application')
    expect(JSON.stringify(preview)).not.toContain('secret')
    expect(JSON.stringify(preview)).not.toContain('cid=abc')
  })
})