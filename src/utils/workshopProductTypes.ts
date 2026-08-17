import type { WorkshopListRow } from '../services/WorkshopListService'

export type WorkshopProductType = 'PRINTS' | 'CANVAS_PRINTS' | 'THREE_D_PRINTS' | 'ORIGINALS'

export const WORKSHOP_PRODUCT_TYPES: readonly WorkshopProductType[] = [
  'PRINTS',
  'CANVAS_PRINTS',
  'THREE_D_PRINTS',
  'ORIGINALS',
]

export const WORKSHOP_PRODUCT_TYPE_LABELS: Record<WorkshopProductType, string> = {
  PRINTS: 'Prints',
  CANVAS_PRINTS: 'Canvas Prints',
  THREE_D_PRINTS: '3D Prints',
  ORIGINALS: 'Originals',
}

export const canonicalWorkshopProductType = (value: string): WorkshopProductType => {
  if (value === 'PAPER') return 'PRINTS'
  if (value === 'CANVAS' || value === 'GALLERY_INVENTORY') return 'CANVAS_PRINTS'
  if (value === 'THREE_D_PRINT' || value === 'TEXTURED_REPLICA_3D') return 'THREE_D_PRINTS'
  return 'ORIGINALS'
}

export const filterWorkshopRowsByProductType = (
  rows: WorkshopListRow[],
  productType: WorkshopProductType | null,
): WorkshopListRow[] => productType
  ? rows.filter((row) => canonicalWorkshopProductType(row.workItemType) === productType)
  : [...rows]

export const countWorkshopRowsByProductType = (
  rows: WorkshopListRow[],
): Record<'ALL' | WorkshopProductType, number> => {
  const counts: Record<'ALL' | WorkshopProductType, number> = {
    ALL: rows.length,
    PRINTS: 0,
    CANVAS_PRINTS: 0,
    THREE_D_PRINTS: 0,
    ORIGINALS: 0,
  }
  for (const row of rows) counts[canonicalWorkshopProductType(row.workItemType)] += 1
  return counts
}