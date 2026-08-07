import type { jsPDF as JsPdfDocument } from 'jspdf'
import type { InventoryCswDocument, PurchaseOrderDraft } from '../types/inventory'

interface CompanyDocumentDetails {
  address?: string | null
  email?: string | null
  phone?: string | null
}

interface SupplierDocumentDetails {
  address?: string | null
  contact?: string | null
  email?: string | null
  phone?: string | null
}

export interface PurchaseOrderDocumentContext {
  purchaseOrder: PurchaseOrderDraft
  relatedCsw: InventoryCswDocument | null
  inventoryCountDate: string | null
  companyDetails?: CompanyDocumentDetails
  supplierDetails?: SupplierDocumentDetails
  shipping?: number | null
  tax?: number | null
}

const PREPARED_BY_NAME = 'Dave Scott'
const PREPARED_BY_TITLE = 'Production Director'
const REQUIRED_REQUESTER = `${PREPARED_BY_NAME}, ${PREPARED_BY_TITLE}`

const formatCurrency = (value: number | null): string => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  : ''

const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString() : ''
const formatDateTime = (value: string): string => new Date(value).toLocaleString()
const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
const displayHtml = (value?: string | null): string => value?.trim() ? escapeHtml(value) : '&nbsp;'

const formatStatus = (status: PurchaseOrderDraft['approvalStatus']): string => status
  .toLowerCase()
  .split('_')
  .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
  .join(' ')

const getRequestedBy = (purchaseOrder: PurchaseOrderDraft): string =>
  purchaseOrder.requestedBy === 'Inventory Director' ? REQUIRED_REQUESTER : purchaseOrder.requestedBy

const getDeliveryLocation = (purchaseOrder: PurchaseOrderDraft): string => {
  const locations = [...new Set(purchaseOrder.lines.map((line) => line.sourceWorksheet).filter(Boolean))]
  return locations.join(', ')
}

const getOrderNotes = (purchaseOrder: PurchaseOrderDraft): string => {
  const notes = [purchaseOrder.notes, ...purchaseOrder.orderNotes].filter((note): note is string => Boolean(note?.trim()))
  return notes.join(' | ')
}

const getApproval = (purchaseOrder: PurchaseOrderDraft): { approvedBy: string; approvedAt: string } => {
  const approval = purchaseOrder.approvalHistory.find((entry) => entry.status === 'APPROVED')
  return {
    approvedBy: approval?.changedBy ?? '',
    approvedAt: approval?.changedAt ?? '',
  }
}

const getSubtotal = (purchaseOrder: PurchaseOrderDraft): number => purchaseOrder.lines
  .reduce((sum, line) => sum + (line.subtotal ?? 0), 0)

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.requestAnimationFrame(() => window.URL.revokeObjectURL(url))
}

const printStyles = `
@page { size: letter; margin: .45in .48in .72in; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 8.75pt; line-height: 1.35; }
.po-header { display: grid; grid-template-columns: 1fr 2.15in; gap: .3in; align-items: start; border-bottom: 2.5px solid #111; padding-bottom: 11px; }
.brand-row { display: flex; align-items: center; gap: 9px; }
.brand-mark { display: grid; grid-template-columns: repeat(2, 8px); gap: 2px; transform: skew(-7deg); }
.brand-mark i { display: block; width: 8px; height: 11px; background: #111; }
.brand-mark i:nth-child(2), .brand-mark i:nth-child(3) { background: #777; }
.brand-name { font-size: 15pt; font-weight: 800; letter-spacing: .08em; }
.company-name { margin-top: 7px; font-size: 10pt; font-weight: 700; }
.company-subname { font-weight: 700; }
.company-contact { min-height: 1.35em; color: #333; }
.po-title { text-align: right; }
.po-title h1 { margin: 0; font-size: 18pt; line-height: 1; letter-spacing: .035em; white-space: nowrap; }
.po-number-label { margin-top: 10px; font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.po-number { font-size: 13pt; font-weight: 800; }
.po-meta { margin-top: 4px; font-size: 8pt; }
.information-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .32in; margin-top: 15px; }
.section-title { margin: 0 0 6px; border-bottom: 1.5px solid #111; padding-bottom: 3px; font-size: 8pt; letter-spacing: .09em; text-transform: uppercase; }
.detail-grid { display: grid; grid-template-columns: 78px 1fr; gap: 3px 8px; margin: 0; }
.detail-grid dt { font-weight: 700; }
.detail-grid dd { min-height: 1.35em; margin: 0; }
.line-items { width: 100%; margin-top: 16px; border-collapse: collapse; table-layout: fixed; }
.line-items thead { display: table-header-group; }
.line-items tr { break-inside: avoid; page-break-inside: avoid; }
.line-items th { border: 1px solid #555; border-bottom: 1.5px solid #111; padding: 6px 4px; background: #e8e8e8; font-size: 6.8pt; letter-spacing: .03em; text-align: left; text-transform: uppercase; }
.line-items td { border-inline: 1px solid #aaa; border-bottom: 1px solid #aaa; padding: 6px 4px; vertical-align: top; overflow-wrap: anywhere; }
.line-items .line-number { text-align: center; }
.line-items .quantity { text-align: right; }
.line-items .currency { text-align: right; white-space: nowrap; }
.item-description { display: block; margin-top: 2px; color: #444; font-size: 7.5pt; }
.line-items th:nth-child(1) { width: 6%; text-align: center; }
.line-items th:nth-child(2) { width: 30%; }
.line-items th:nth-child(3) { width: 12%; }
.line-items th:nth-child(4) { width: 7%; text-align: right; }
.line-items th:nth-child(5) { width: 13%; }
.line-items th:nth-child(6), .line-items th:nth-child(7) { width: 16%; text-align: right; }
.summary-row { display: grid; grid-template-columns: 1fr 2.25in; gap: 24px; margin-top: 13px; break-inside: avoid; }
.totals { width: 100%; border-collapse: collapse; }
.totals th, .totals td { padding: 3px 0 3px 12px; text-align: right; }
.totals th { font-weight: 400; }
.totals td { white-space: nowrap; }
.totals .grand th, .totals .grand td { border-top: 2px solid #111; padding-top: 6px; font-size: 10.5pt; font-weight: 800; }
.approval { margin-top: 18px; break-inside: avoid; }
.approval-grid { display: grid; grid-template-columns: 1fr 1.35fr; gap: .45in; }
.prepared-name { font-size: 10pt; font-weight: 700; }
.prepared-title { margin-top: 2px; }
.signature-row { display: grid; grid-template-columns: 68px 1fr; align-items: end; margin-bottom: 8px; }
.signature-row span:first-child { font-weight: 700; }
.signature-line { min-height: 17px; border-bottom: 1px solid #111; }
.vendor-notes { margin-top: 16px; break-inside: avoid; }
.notes-line { height: 18px; border-bottom: 1px solid #aaa; }
.page-footer { position: fixed; right: 0; bottom: -.53in; left: 0; display: grid; grid-template-columns: 1.2fr 1fr auto; gap: 8px; border-top: 1px solid #777; padding-top: 5px; color: #333; font-size: 6.5pt; }
.page-footer span:nth-child(2) { text-align: center; }
.page-number:after { content: "Page " counter(page) " of " counter(pages); }
`

export const printPurchaseOrderDocument = (context: PurchaseOrderDocumentContext): void => {
  const { companyDetails, purchaseOrder, relatedCsw, supplierDetails, shipping, tax } = context
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const generatedAt = new Date().toISOString()
  const approval = getApproval(purchaseOrder)
  const orderNotes = getOrderNotes(purchaseOrder)
  const lineRows = purchaseOrder.lines.map((line, index) => `<tr>
    <td class="line-number">${index + 1}</td>
    <td><strong>${displayHtml(line.sourceItemSnapshot ?? line.inventoryItemId)}</strong>${line.description?.trim() ? `<span class="item-description">${escapeHtml(line.description)}</span>` : ''}</td>
    <td>${displayHtml(line.sku)}</td>
    <td class="quantity">${line.quantityOrdered}</td>
    <td>${displayHtml(line.sizePackage)}</td>
    <td class="currency">${escapeHtml(formatCurrency(line.unitPrice))}</td>
    <td class="currency">${escapeHtml(formatCurrency(line.subtotal))}</td>
  </tr>`).join('')
  const chargeRows = [
    typeof tax === 'number' ? `<tr><th>Tax</th><td>${escapeHtml(formatCurrency(tax))}</td></tr>` : '',
    typeof shipping === 'number' ? `<tr><th>Shipping</th><td>${escapeHtml(formatCurrency(shipping))}</td></tr>` : '',
  ].join('')

  printWindow.opener = null
  printWindow.document.write(`<!doctype html>
<html><head><title>${escapeHtml(purchaseOrder.poDraftNumber)}</title><style>${printStyles}</style></head><body>
<header class="po-header">
  <div><div class="brand-row"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span class="brand-name">PALETTE</span></div><div class="company-name">Palette Enterprise</div><div class="company-subname">Erin Hanson Gallery</div><div class="company-contact">${displayHtml(companyDetails?.address)}</div><div class="company-contact">Phone: ${displayHtml(companyDetails?.phone)}</div><div class="company-contact">Email: ${displayHtml(companyDetails?.email)}</div></div>
  <div class="po-title"><h1>PURCHASE ORDER</h1><div class="po-number-label">PO Number</div><div class="po-number">${escapeHtml(purchaseOrder.poDraftNumber)}</div><div class="po-meta">${escapeHtml(formatDate(purchaseOrder.dateCreated))} &nbsp;|&nbsp; ${escapeHtml(formatStatus(purchaseOrder.approvalStatus))}</div></div>
</header>
<div class="information-grid">
  <section><h2 class="section-title">Supplier Information</h2><dl class="detail-grid"><dt>Supplier</dt><dd>${displayHtml(purchaseOrder.supplier)}</dd><dt>Contact</dt><dd>${displayHtml(supplierDetails?.contact)}</dd><dt>Address</dt><dd>${displayHtml(supplierDetails?.address)}</dd><dt>Email</dt><dd>${displayHtml(supplierDetails?.email)}</dd><dt>Phone</dt><dd>${displayHtml(supplierDetails?.phone)}</dd></dl></section>
  <section><h2 class="section-title">Order Information</h2><dl class="detail-grid"><dt>Requested by</dt><dd>${displayHtml(getRequestedBy(purchaseOrder))}</dd><dt>Account</dt><dd>${displayHtml(purchaseOrder.accountLabel)}</dd><dt>Deliver to</dt><dd>${displayHtml(getDeliveryLocation(purchaseOrder))}</dd><dt>Order notes</dt><dd>${displayHtml(orderNotes)}</dd></dl></section>
</div>
<table class="line-items"><thead><tr><th>Line #</th><th>Item</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Extended Price</th></tr></thead><tbody>${lineRows}</tbody></table>
<div class="summary-row"><div></div><table class="totals"><tr><th>Subtotal</th><td>${escapeHtml(formatCurrency(getSubtotal(purchaseOrder)))}</td></tr>${chargeRows}<tr class="grand"><th>Grand Total</th><td>${escapeHtml(formatCurrency(purchaseOrder.total))}</td></tr></table></div>
<section class="approval"><h2 class="section-title">Approval</h2><div class="approval-grid"><div><div>Prepared By:</div><div class="prepared-name">${PREPARED_BY_NAME}</div><div class="prepared-title">${PREPARED_BY_TITLE}</div></div><div><div class="signature-row"><span>Approved By:</span><span class="signature-line">${displayHtml(approval.approvedBy)}</span></div><div class="signature-row"><span>Signature:</span><span class="signature-line"></span></div><div class="signature-row"><span>Date:</span><span class="signature-line">${displayHtml(formatDate(approval.approvedAt))}</span></div></div></div></section>
<section class="vendor-notes"><h2 class="section-title">Notes</h2><div class="notes-line"></div><div class="notes-line"></div></section>
<footer class="page-footer"><span>Generated by Palette Enterprise ERP<br>Related CSW Number: ${displayHtml(relatedCsw?.referenceNumber)}</span><span>Generated ${escapeHtml(formatDateTime(generatedAt))}</span><span class="page-number"></span></footer>
</body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const drawPdfFieldRows = (
  pdf: JsPdfDocument,
  rows: Array<[string, string]>,
  x: number,
  startY: number,
  width: number,
): number => {
  let y = startY
  for (const [label, value] of rows) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text(label, x, y)
    pdf.setFont('helvetica', 'normal')
    const valueLines = pdf.splitTextToSize(value, width - 27) as string[]
    if (valueLines.length > 0) pdf.text(valueLines, x + 25, y)
    y += Math.max(4, valueLines.length * 3.2)
  }
  return y
}

export const downloadPurchaseOrderPdf = async (context: PurchaseOrderDocumentContext): Promise<void> => {
  const { companyDetails, purchaseOrder, relatedCsw, shipping, supplierDetails, tax } = context
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const left = 13
  const right = 13
  const contentWidth = pageWidth - left - right
  const footerY = pageHeight - 10
  const generatedAt = new Date().toISOString()
  const approval = getApproval(purchaseOrder)
  let y = 13

  const drawCompanyIdentity = (compact = false): void => {
    pdf.setFillColor(0, 0, 0)
    pdf.rect(left, y, 3, 4.5, 'F')
    pdf.setFillColor(120, 120, 120)
    pdf.rect(left + 3.6, y, 3, 4.5, 'F')
    pdf.rect(left, y + 5.1, 3, 4.5, 'F')
    pdf.setFillColor(0, 0, 0)
    pdf.rect(left + 3.6, y + 5.1, 3, 4.5, 'F')
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(compact ? 11 : 14)
    pdf.text('PALETTE', left + 10, y + 7)
  }

  const drawFirstPageHeader = (): void => {
    drawCompanyIdentity()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('Palette Enterprise', left, y + 14)
    pdf.text('Erin Hanson Gallery', left, y + 18)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    const companyLines = [companyDetails?.address ?? '', companyDetails?.phone ? `Phone: ${companyDetails.phone}` : 'Phone:', companyDetails?.email ? `Email: ${companyDetails.email}` : 'Email:']
    companyLines.forEach((line, index) => pdf.text(line, left, y + 22 + index * 3.2))
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(17)
    pdf.text('PURCHASE ORDER', pageWidth - right, y + 3, { align: 'right' })
    pdf.setFontSize(6.5)
    pdf.text('PO NUMBER', pageWidth - right, y + 10, { align: 'right' })
    pdf.setFontSize(12)
    pdf.text(purchaseOrder.poDraftNumber, pageWidth - right, y + 15, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text(`${formatDate(purchaseOrder.dateCreated)} | ${formatStatus(purchaseOrder.approvalStatus)}`, pageWidth - right, y + 20, { align: 'right' })
    y += 33
    pdf.setLineWidth(0.8)
    pdf.line(left, y, pageWidth - right, y)
    y += 7
  }

  const drawContinuationHeader = (): void => {
    drawCompanyIdentity(true)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(`PURCHASE ORDER  |  ${purchaseOrder.poDraftNumber}`, pageWidth - right, y + 6, { align: 'right' })
    y += 13
    pdf.setLineWidth(0.4)
    pdf.line(left, y, pageWidth - right, y)
    y += 5
  }

  const drawSectionHeading = (heading: string, x: number, width: number): void => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.text(heading.toUpperCase(), x, y)
    pdf.setLineWidth(0.3)
    pdf.line(x, y + 1.5, x + width, y + 1.5)
    y += 6
  }

  const columns = [11, 53, 23, 13, 21, 30, contentWidth - 151]
  const headers = ['Line #', 'Item', 'SKU', 'Qty', 'Unit', 'Unit Price', 'Extended Price']
  const drawTableHeader = (): void => {
    pdf.setFillColor(232, 232, 232)
    pdf.setDrawColor(70, 70, 70)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.3)
    let x = left
    headers.forEach((header, index) => {
      pdf.rect(x, y, columns[index], 7, 'FD')
      const rightAligned = index === 3 || index >= 5
      pdf.text(header.toUpperCase(), rightAligned ? x + columns[index] - 1.5 : x + 1.5, y + 4.5, { align: rightAligned ? 'right' : 'left' })
      x += columns[index]
    })
    y += 7
  }

  const addItemPage = (): void => {
    pdf.addPage('letter')
    y = 13
    drawContinuationHeader()
    drawTableHeader()
  }

  drawFirstPageHeader()
  const detailsTop = y
  const detailsWidth = (contentWidth - 10) / 2
  drawSectionHeading('Supplier Information', left, detailsWidth)
  const supplierBottom = drawPdfFieldRows(pdf, [
    ['Supplier', purchaseOrder.supplier],
    ['Contact', supplierDetails?.contact ?? ''],
    ['Address', supplierDetails?.address ?? ''],
    ['Email', supplierDetails?.email ?? ''],
    ['Phone', supplierDetails?.phone ?? ''],
  ], left, y, detailsWidth)
  y = detailsTop
  const orderX = left + detailsWidth + 10
  drawSectionHeading('Order Information', orderX, detailsWidth)
  const orderBottom = drawPdfFieldRows(pdf, [
    ['Requested by', getRequestedBy(purchaseOrder)],
    ['Account', purchaseOrder.accountLabel],
    ['Deliver to', getDeliveryLocation(purchaseOrder)],
    ['Order notes', getOrderNotes(purchaseOrder)],
  ], orderX, y, detailsWidth)
  y = Math.max(supplierBottom, orderBottom) + 5

  drawTableHeader()
  purchaseOrder.lines.forEach((line, index) => {
    const item = line.description?.trim()
      ? `${line.sourceItemSnapshot ?? line.inventoryItemId}\n${line.description}`
      : line.sourceItemSnapshot ?? line.inventoryItemId
    const cells = [String(index + 1), item, line.sku ?? '', String(line.quantityOrdered), line.sizePackage ?? '', formatCurrency(line.unitPrice), formatCurrency(line.subtotal)]
    const wrappedCells = cells.map((cell, cellIndex) => pdf.splitTextToSize(cell, columns[cellIndex] - 3) as string[])
    const rowHeight = Math.max(...wrappedCells.map((cell) => cell.length), 1) * 3.2 + 3.5
    if (y + rowHeight > footerY - 4) addItemPage()
    let x = left
    wrappedCells.forEach((cell, cellIndex) => {
      const rightAligned = cellIndex === 3 || cellIndex >= 5
      const centered = cellIndex === 0
      pdf.setDrawColor(155, 155, 155)
      pdf.rect(x, y, columns[cellIndex], rowHeight)
      pdf.setFont('helvetica', cellIndex === 1 ? 'bold' : 'normal')
      pdf.setFontSize(6.7)
      pdf.text(cell, rightAligned ? x + columns[cellIndex] - 1.5 : centered ? x + columns[cellIndex] / 2 : x + 1.5, y + 3.8, { align: rightAligned ? 'right' : centered ? 'center' : 'left' })
      x += columns[cellIndex]
    })
    y += rowHeight
  })

  if (y + 76 > footerY) {
    pdf.addPage('letter')
    y = 13
    drawContinuationHeader()
  }
  y += 6
  const totalsX = pageWidth - right - 68
  const totalRows: Array<[string, number, boolean]> = [
    ['Subtotal', getSubtotal(purchaseOrder), false],
    ...(typeof tax === 'number' ? [['Tax', tax, false] as [string, number, boolean]] : []),
    ...(typeof shipping === 'number' ? [['Shipping', shipping, false] as [string, number, boolean]] : []),
    ['Grand Total', purchaseOrder.total, true],
  ]
  totalRows.forEach(([label, value, grand]) => {
    if (grand) {
      pdf.setLineWidth(0.7)
      pdf.line(totalsX, y - 3.5, pageWidth - right, y - 3.5)
    }
    pdf.setFont('helvetica', grand ? 'bold' : 'normal')
    pdf.setFontSize(grand ? 10 : 8)
    pdf.text(label, totalsX, y)
    pdf.text(formatCurrency(value), pageWidth - right, y, { align: 'right' })
    y += grand ? 9 : 5
  })

  drawSectionHeading('Approval', left, contentWidth)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Prepared By:', left, y)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(PREPARED_BY_NAME, left, y + 5)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text(PREPARED_BY_TITLE, left, y + 9)
  const approvalX = left + 83
  const approvalWidth = contentWidth - 83
  const approvalRows: Array<[string, string]> = [['Approved By:', approval.approvedBy], ['Signature:', ''], ['Date:', formatDate(approval.approvedAt)]]
  approvalRows.forEach(([label, value], index) => {
    const rowY = y + index * 6
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text(label, approvalX, rowY)
    pdf.setFont('helvetica', 'normal')
    if (value) pdf.text(value, approvalX + 23, rowY)
    pdf.setLineWidth(0.25)
    pdf.line(approvalX + 23, rowY + 1, approvalX + approvalWidth, rowY + 1)
  })
  y += 22

  drawSectionHeading('Notes', left, contentWidth)
  pdf.setDrawColor(160, 160, 160)
  pdf.setLineWidth(0.2)
  pdf.line(left, y + 4, pageWidth - right, y + 4)
  pdf.line(left, y + 10, pageWidth - right, y + 10)

  const pageCount = pdf.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber)
    pdf.setDrawColor(100, 100, 100)
    pdf.setLineWidth(0.2)
    pdf.line(left, footerY - 4, pageWidth - right, footerY - 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.2)
    pdf.text(`Generated by Palette Enterprise ERP | Related CSW Number: ${relatedCsw?.referenceNumber ?? ''}`, left, footerY)
    pdf.text(`Generated ${formatDateTime(generatedAt)}`, pageWidth / 2, footerY + 3, { align: 'center' })
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - right, footerY, { align: 'right' })
  }

  triggerBlobDownload(pdf.output('blob'), `${purchaseOrder.poDraftNumber}.pdf`)
}