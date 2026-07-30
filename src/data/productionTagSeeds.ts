import { BaseStyle, FrameStyle, PackagingMethod, ProductionMeasurementRule, ShippingBox } from '../models'
import type { PackagingMethodCode } from '../types/entities'

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')

const frameAllowances: Array<{ name: string; increaseInches: number }> = [
  { name: 'EH', increaseInches: 1.5625 },
  { name: 'Black', increaseInches: 1.4375 },
  { name: 'Silver', increaseInches: 1.3125 },
  { name: 'KoF', increaseInches: 6 },
  { name: 'White', increaseInches: 1.3125 },
  { name: 'Gold', increaseInches: 1.3125 },
  { name: 'Stretched', increaseInches: 0 },
  { name: 'None', increaseInches: 0 },
  { name: 'Silver EH', increaseInches: 1.5625 },
  { name: 'Gold Plein Air', increaseInches: 7.625 },
  { name: 'Black & Gold Plein Air', increaseInches: 5.875 },
  { name: 'Silver Plein Air', increaseInches: 7.625 },
  { name: 'Gold EH A', increaseInches: 1.6875 },
  { name: 'B&G Plein Air', increaseInches: 5.875 },
  { name: 'Gold Plein', increaseInches: 7.625 },
  { name: 'Black & Gold Plein', increaseInches: 5.875 },
  { name: 'Silver Plein', increaseInches: 7.625 },
  { name: 'B&G Plein', increaseInches: 5.875 },
  { name: 'Metro', increaseInches: 1.5625 },
  { name: 'B&G Plein Faux', increaseInches: 6.9375 },
  { name: 'Silver Plein Faux', increaseInches: 8.5 },
  { name: 'Gold Plein Faux', increaseInches: 9 },
  { name: 'Gold REH', increaseInches: 1.3125 },
  { name: 'Silver REH', increaseInches: 1.3125 },
  { name: 'Rolled', increaseInches: 0 },
  { name: 'Light Gold', increaseInches: 1.4375 },
  { name: 'Red Gold', increaseInches: 1.3125 },
  { name: 'Gold REH NEW', increaseInches: 1.5625 },
  { name: 'Picture White', increaseInches: 2.6875 },
  { name: 'Picture Black', increaseInches: 2.6875 },
  { name: 'Picture Rolled', increaseInches: 0 },
]

const baseAdjustments: Array<{ name: string; adjustmentInches: number }> = [
  { name: 'Gold EH A', adjustmentInches: -0.75 },
  { name: 'Silver EH', adjustmentInches: -0.75 },
  { name: 'Gold', adjustmentInches: -0.5 },
  { name: 'Silver', adjustmentInches: -0.5 },
  { name: 'White', adjustmentInches: -0.5 },
  { name: 'Black', adjustmentInches: -0.25 },
  { name: 'B&G Plein Faux', adjustmentInches: 1.0625 },
  { name: 'Silver Plein Faux', adjustmentInches: 1.0625 },
  { name: 'Gold Plein Faux', adjustmentInches: 1.0625 },
  { name: 'None', adjustmentInches: -0.0625 },
  { name: 'Gold REH', adjustmentInches: -1.5 },
  { name: 'Silver REH', adjustmentInches: -1.5 },
  { name: 'Light Gold', adjustmentInches: -0.25 },
  { name: 'Red Gold', adjustmentInches: -0.5 },
  { name: 'Gold REH NEW', adjustmentInches: -0.75 },
]

const packagingMethodSeed: Array<{
  code: PackagingMethodCode
  label: string
  requiresShippingBoxLookup: boolean
  usesCalculatedDimensions: boolean
}> = [
  {
    code: 'STANDARD_BOX',
    label: 'Standard Box Code',
    requiresShippingBoxLookup: true,
    usesCalculatedDimensions: false,
  },
  { code: 'CNC', label: 'CNC', requiresShippingBoxLookup: false, usesCalculatedDimensions: true },
  { code: 'CRATE', label: 'CRATE', requiresShippingBoxLookup: false, usesCalculatedDimensions: false },
  { code: 'GALLERY', label: 'GALLERY', requiresShippingBoxLookup: false, usesCalculatedDimensions: false },
  { code: 'PICKUP', label: 'PICKUP', requiresShippingBoxLookup: false, usesCalculatedDimensions: false },
  {
    code: 'DELIVERY',
    label: 'DELIVERY',
    requiresShippingBoxLookup: false,
    usesCalculatedDimensions: false,
  },
]

const shippingBoxSeed = [
  { code: 'S-4553', description: '30 x 24 x 5', dimensionsDisplay: '30 x 24 x 5', faceCutDisplay: '30 x 24 x 1.5' },
  { code: 'S-4947', description: '36 x 24 x 5', dimensionsDisplay: '36 x 24 x 5', faceCutDisplay: '36 x 24 x 1.5' },
  { code: 'S-4554', description: '36 x 30 x 5', dimensionsDisplay: '36 x 30 x 5', faceCutDisplay: '36 x 30 x 1.5' },
  { code: 'S-4679', description: '42 x 36 x 6', dimensionsDisplay: '42 x 36 x 6', faceCutDisplay: '36 x 42' },
  { code: 'S-11214', description: '44 x 35 x 6', dimensionsDisplay: '44 x 35 x 6', faceCutDisplay: '44 x 35' },
  { code: 'S-4929', description: '45 x 40 x 5', dimensionsDisplay: '45 x 40 x 5', faceCutDisplay: '40 x 45 x 1.5' },
  {
    code: 'S-11251',
    description: 'variable 38-72 x 48 x 6',
    dimensionsDisplay: '38-72 x 48 x 6',
    variableLengthRange: '38-72',
  },
  { code: 'S-14048', description: '25 x 3 x 3', dimensionsDisplay: '25 x 3 x 3' },
  { code: 'S-14049', description: '37 x 3 x 3', dimensionsDisplay: '37 x 3 x 3' },
  { code: 'S-3938', description: '44 x 2 x 2', dimensionsDisplay: '44 x 2 x 2' },
  { code: 'S-6241', description: '57 x 3 x 3', dimensionsDisplay: '57 x 3 x 3' },
  { code: 'S-5574', description: '61 x 3 x 3', dimensionsDisplay: '61 x 3 x 3' },
  { code: 'S-17584', description: '44 x 35 x 5', dimensionsDisplay: '44 x 35 x 5' },
  { code: 'S-17587', description: '60 x 39 x 6', dimensionsDisplay: '60 x 39 x 6' },
  { code: 'S-16375', description: '52 x 36 x 4', dimensionsDisplay: '52 x 36 x 4' },
  { code: 'S-9920', description: '56 x 45 x 5', dimensionsDisplay: '56 x 45 x 5' },
  { code: 'S-11306', description: '60 x 46 x 6', dimensionsDisplay: '60 x 46 x 6' },
  { code: 'S-15176', description: '37 x 29 x 5', dimensionsDisplay: '37 x 29 x 5' },
  { code: 'S-17581', description: '30 x 24 x 6', dimensionsDisplay: '30 x 24 x 6' },
]

export const productionTagFrameStyles = frameAllowances.map(
  (frameStyle) =>
    new FrameStyle({
      name: frameStyle.name,
      normalizedKey: normalizeKey(frameStyle.name),
      increaseInches: frameStyle.increaseInches,
      appliesToPaperAsPicture: !frameStyle.name.toLowerCase().startsWith('picture '),
    }),
)

export const productionTagBaseStyles = baseAdjustments.map(
  (baseStyle) =>
    new BaseStyle({
      name: baseStyle.name,
      normalizedKey: normalizeKey(baseStyle.name),
      adjustmentInches: baseStyle.adjustmentInches,
    }),
)

export const productionTagPackagingMethods = packagingMethodSeed.map(
  (method) =>
    new PackagingMethod({
      code: method.code,
      label: method.label,
      requiresShippingBoxLookup: method.requiresShippingBoxLookup,
      usesCalculatedDimensions: method.usesCalculatedDimensions,
    }),
)

export const productionTagShippingBoxes = shippingBoxSeed.map(
  (shippingBox) =>
    new ShippingBox({
      code: shippingBox.code,
      description: shippingBox.description,
      dimensionsDisplay: shippingBox.dimensionsDisplay,
      faceCutDisplay: shippingBox.faceCutDisplay,
      variableLengthRange: shippingBox.variableLengthRange,
    }),
)

export const productionMeasurementRules = [
  ...productionTagFrameStyles.map(
    (frameStyle) =>
      new ProductionMeasurementRule({
        ruleType: 'FRAME_INCREASE',
        targetKey: frameStyle.normalizedKey,
        adjustment: frameStyle.increaseInches,
        unit: 'INCHES',
        active: true,
      }),
  ),
  ...productionTagBaseStyles.map(
    (baseStyle) =>
      new ProductionMeasurementRule({
        ruleType: 'BASE_ADJUSTMENT',
        targetKey: baseStyle.normalizedKey,
        adjustment: baseStyle.adjustmentInches,
        unit: 'INCHES',
        active: true,
      }),
  ),
]
