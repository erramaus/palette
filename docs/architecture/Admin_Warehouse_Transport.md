# Admin Warehouse Transport

## Confirmed Mechanism

The warehouse area is a Blazor-based admin shell that uses cookie-backed authentication.

Confirmed cookie names observed in the authenticated browser context:

- `.AspNetCore.Identity.Application` `httpOnly=true`, `secure=true`, `sameSite=Lax`
- `Identity.External` `httpOnly=true`, `secure=true`, `sameSite=Lax`
- `cid` on `admin.erinhanson.com`
- `cid` on `www.erinhanson.com`

`api/Auth/Me` is a read-only auth probe that returns a JSON body like:

```json
{"isAuthenticated":true,"email":"sophia@erinhanson.com"}
```

When unauthenticated, the same endpoint returns:

```json
{"isAuthenticated":false,"email":null}
```

## Confirmed Read-Only Export Transport

The warehouse dashboard and the `Print Warehouse Reps` action use read-only JSON GET endpoints:

- `GET /api/Auth/Me`
- `GET /api/warehouse/warehouse-page-dto`
- `GET /api/warehouse/warehouse-vsd-report`

## Supported Interim Import Path

The supported interim bridge is a manual Excel export workflow:

1. Sign into the Erin Hanson admin site manually.
2. Open the warehouse/new-orders area.
3. Click `Print Warehouse Reps`.
4. Upload the downloaded Excel workbook into Palette Import Center.

This path is read-only on the admin site and does not automate Microsoft Entra login, scrape the site, or store cookies, tokens, or credentials in Palette.

Observed response content types:

- `application/json; charset=utf-8`

The `Print Warehouse Reps` action did not show a form POST, mutation request, popup, or dialog in the observed capture. The transport is a normal HTTP JSON read path.

## Confirmed DTO Shape

`/api/warehouse/warehouse-page-dto` returns a top-level object with:

- `statTable`
- `orders`

`statTable` includes:

- `vsdRolledPrint`
- `vsdStretchedPrint`
- `vsdFramedPrint`
- `vsd3DPrint`
- `vsdOriginal`
- `vsdLastWeekEnding`
- `vsdThisWeekEnding`
- `lastWeeksVSD`
- `thisWeeksVSD`
- `thisWeeksVOS`
- `lastWeeksVOS`
- `lastWeeksNumParts`
- `thisWeeksNumParts`
- `lastWeeksPercOnDeadline`
- `thisWeeksPercOnDeadline`

The `orders` array contains order objects with fields including:

- `id`
- `firstName`
- `lastName`
- `manualEntry`
- `timeCreated`
- `timeDelivered`
- `subTotal`
- `shipping`
- `crateFee`
- `tax`
- `balanceIsZero`
- `company`
- `shippingFirstName`
- `shippingLastName`
- `shipAddress1`
- `shipAddress2`
- `shipCity`
- `shipState`
- `shipZip`
- `shipCountry`
- `email`
- `phone`
- `isGift`
- `giftMessage`
- `orderItems`
- `orderNotes`
- `shippingLabels`

`orderItems` entries include:

- `id`
- `productType`
- `count`
- `deliveryStatus`
- `dueDate`
- `dryDate`
- `timeDelivered`
- `flowType`
- `productName`
- `thumbnailImage`
- `isLimitedPrint`
- `isOpenEdition3D`
- `isPaperPrint`
- `limitedEditionNumber`
- `printHeight`
- `printWidth`
- `origStyleText`
- `printStyleText`
- `frameItemFrameText`
- `girth`
- `shippingAccount`
- `timeWorkComplete`
- `statWeek`
- `selected`

## Login Contract Status

The login page is rendered by the Blazor app shell and does not expose a server-rendered HTML form in the captured page source. Public configuration shows a Microsoft Entra authority at `https://login.microsoftonline.com/` and a client id, which points to external auth bootstrap rather than a simple visible login form. However, I did **not** confirm the exact login POST route, HTTP method, content type, form field names, anti-forgery token name, redirect response, or MFA requirement from accessible browser/devtools captures. That portion remains unresolved and should not be guessed.

What was confirmed about the login/bootstrap surface:

- the unauthenticated page request resolves to the Blazor shell HTML
- `AuthenticationService.js` is loaded by the client app
- `appsettings.json` exposes a Microsoft Entra authority/client id pair
- `api/Auth/Me` accurately reports authenticated vs unauthenticated state

What remains unconfirmed:

- exact login POST endpoint
- whether the login exchange is form POST, OIDC redirect, or another server-side bootstrap
- anti-forgery token source and name
- success/failure redirect behavior
- MFA/external challenge requirements

## Implications for Palette

- A normal server-side read-only transport adapter is viable for the export endpoints.
- No browser automation is required for the export read path.
- The remaining open item is how the session is acquired for the server-side proxy.
- No raw cookies or bearer tokens should be forwarded to Palette.
- No write or mutation request should be issued from Palette.

## Safest Next Step

Keep the transport adapter read-only and server-side. Once the auth login contract is confirmed, add a session bootstrapper that lives entirely in the Azure Function and never exposes secret material to the frontend. Until then, keep the fixture transport active and do not guess the login bootstrap.