import { createEntityId } from '../utils/id'
import { nowIso } from '../utils/time'
import type { ProductionJob, ProductType } from '../types/production'
import type {
  ThreeDAlignment,
  ThreeDFileArchiveRecord,
  ThreeDFileCheckpoint,
  ThreeDFilePreparation,
  ThreeDFilePreparationStatus,
  ThreeDFileValidation,
  ThreeDOrderImportClassification,
  ThreeDScanMethod,
  ThreeDSignatureStatus,
} from '../types/threeDFilePreparation'

const OLD_METHOD_CUTOFF = '2023-09-26'
const ARCHIVE_RANGE_START = '2023-09-26'
const ARCHIVE_RANGE_END = '2024-09-01'
const DEFAULT_SLICE_COUNT = 15
const ORDER_SIZE_BLEED_INCHES = 0.223

const parseLocalDate = (value: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw))
}

const isOnOrAfter = (value: string, compareTo: string): boolean =>
  parseLocalDate(value).getTime() >= parseLocalDate(compareTo).getTime()

const isWithinInclusiveRange = (value: string, start: string, end: string): boolean => {
  const target = parseLocalDate(value).getTime()
  return target >= parseLocalDate(start).getTime() && target <= parseLocalDate(end).getTime()
}

const toThreeDecimals = (value: number): number => Math.round(value * 1000) / 1000

export const isThreeDProductType = (productType: ProductType): boolean =>
  productType === 'TEXTURED_REPLICA_3D' || productType === 'THREE_D_PRINT'

export const mapImportClassificationToProductType = (
  classification: ThreeDOrderImportClassification,
): ProductType => {
  if (classification === 'THREE_D_PRINT') {
    return 'THREE_D_PRINT'
  }
  if (classification === 'THREE_D_TEXTURED_REPLICA') {
    return 'TEXTURED_REPLICA_3D'
  }
  if (classification === 'PAPER') {
    return 'PAPER'
  }
  return 'CANVAS'
}

export const inferThreeDAlignment = (width: number, height: number): ThreeDAlignment => {
  if (Math.abs(width - height) < 0.01) {
    return 'SQUARE'
  }
  if (width / Math.max(height, 1) >= 1.8) {
    return 'PANORAMA'
  }
  return width > height ? 'HORIZ' : 'VERT'
}

export const buildThreeDFolderName = (
  artworkName: string,
  orderedWidth: number,
  orderedHeight: number,
  alignment: ThreeDAlignment,
  date: string,
): string => `${artworkName} ${orderedWidth}x${orderedHeight} ${alignment} ${date}`

export const calculateThreeDCropSize = (
  orderedWidth: number,
  orderedHeight: number,
): { width: number; height: number } => ({
  width: toThreeDecimals(orderedWidth + ORDER_SIZE_BLEED_INCHES),
  height: toThreeDecimals(orderedHeight + ORDER_SIZE_BLEED_INCHES),
})

export const inferThreeDScanMethod = (scanDate?: string): ThreeDScanMethod => {
  if (!scanDate) {
    return 'UNKNOWN'
  }

  return isOnOrAfter(scanDate, OLD_METHOD_CUTOFF) ? 'NEW_PRINT_METHOD' : 'OLD_PRINT_METHOD'
}

export const requiresThreeDArchive = (scanDate?: string): boolean => {
  if (!scanDate) {
    return false
  }

  return isWithinInclusiveRange(scanDate, ARCHIVE_RANGE_START, ARCHIVE_RANGE_END)
}

const baseSlicingChecklist = (): string[] => [
  'Open the correct artwork in Cruse 3D Design Software.',
  'Set the slice display to Black Highest.',
  'Change the gradient display to black and white.',
  'Begin with 15 fixed slices.',
  'Remove invalid slices to the left of the histogram using the documented process.',
  'Return the final set to 15 slices.',
  'Review the texture distribution across the slices.',
  'Save the project.',
  'Export the required depth slices.',
]

const newMethodChecklist = (): string[] => [
  'Open the 3D image group in Depth Factory.',
  'Set Flattening to 1.',
  'Allow adjustment to 2 only when required by the histogram.',
  'Adjust the Shading view as described in the procedure.',
  'Check the last five slices for excess texture.',
  'Ensure the final slice has almost no texture.',
  'Ensure the 11th slice has only a hint of texture.',
  'Confirm the first four slices contain the expected progression of canvas texture.',
  'Add the new leftmost slice using the documented manual-slice procedure.',
  'Export Depth Slices only.',
]

const oldMethodChecklist = (): string[] => [
  'Verify the four rightmost slices have very little texture.',
  'Verify most texture begins around the fifth slice from the right.',
  'Confirm the first four slices contain the expected texture progression.',
  'Delete and recreate the leftmost slice as described.',
  'Export Depth Slices and Shading.',
]

const formattingChecklist = (): string[] => [
  'Move the color file into the artwork 3D Print Files folder.',
  'Process depth slices through the approved Photoshop batch.',
  'Copy processed slices into the 3D Print Files folder.',
  'Copy the color file and slices into a new order-size folder.',
]

const toCheckpoint = (
  category: ThreeDFileCheckpoint['category'],
  label: string,
): ThreeDFileCheckpoint => ({
  id: createEntityId('3d_checkpoint'),
  category,
  label,
  required: true,
  completed: false,
})

export const buildThreeDCheckpoints = (scanMethod: ThreeDScanMethod): ThreeDFileCheckpoint[] => {
  const slicingChecklist = [
    ...baseSlicingChecklist(),
    ...(scanMethod === 'NEW_PRINT_METHOD'
      ? newMethodChecklist()
      : scanMethod === 'OLD_PRINT_METHOD'
        ? oldMethodChecklist()
        : []),
  ]

  return [
    ...[
      'Check whether the artwork already has 3D print files.',
      'Check whether those files are the correct ordered size.',
      'Confirm the color file is present.',
      'Confirm all required depth slices are present.',
      'Record the scan or previous slicing date.',
    ].map((label) => toCheckpoint('INITIAL_CHECK', label)),
    ...slicingChecklist.map((label) => toCheckpoint('SLICING', label)),
    ...formattingChecklist().map((label) => toCheckpoint('FORMATTING', label)),
    ...[
      'Confirm color file exists.',
      'Confirm expected slice count exists.',
      'Confirm dimensions and resolution match the order-size target.',
      'Confirm folder naming convention is correct.',
      'Confirm signature handling is recorded.',
    ].map((label) => toCheckpoint('VALIDATION', label)),
  ]
}

const buildArchiveRecord = (
  artworkName: string,
): ThreeDFileArchiveRecord => ({
  id: createEntityId('3d_archive'),
  archiveName: `Archive - ${artworkName}`,
  originalLocation: '',
  archiveLocation: '',
  required: true,
  completed: false,
  createdAt: nowIso(),
})

export const createThreeDFilePreparation = (input: {
  workItemId: string
  productionJobId: string
  artworkId: string
  artworkName: string
  orderedWidth: number
  orderedHeight: number
  importClassification: ThreeDOrderImportClassification
  productType: ProductType
  alignment?: ThreeDAlignment
  scanDate?: string
  existingFilesFound?: boolean
  existingFilesCorrectSize?: boolean
  colorFilePresent?: boolean
  depthSlicesPresent?: boolean
  notes?: string
}): ThreeDFilePreparation => {
  const alignment = input.alignment ?? inferThreeDAlignment(input.orderedWidth, input.orderedHeight)
  const scanMethod = inferThreeDScanMethod(input.scanDate)
  const crop = calculateThreeDCropSize(input.orderedWidth, input.orderedHeight)
  const existingFilesFound = input.existingFilesFound ?? false
  const existingFilesCorrectSize = input.existingFilesCorrectSize ?? false
  const colorFilePresent = input.colorFilePresent ?? false
  const depthSlicesPresent = input.depthSlicesPresent ?? false
  const slicingRequired = !existingFilesFound || (!existingFilesCorrectSize && !depthSlicesPresent)
  const resizingRequired = existingFilesFound && !existingFilesCorrectSize

  const prep: ThreeDFilePreparation = {
    id: createEntityId('3d_file_prep'),
    workItemId: input.workItemId,
    productionJobId: input.productionJobId,
    artworkId: input.artworkId,
    orderedWidth: input.orderedWidth,
    orderedHeight: input.orderedHeight,
    alignment,
    scanDate: input.scanDate,
    scanMethod,
    existingFilesFound,
    existingFilesCorrectSize,
    slicingRequired,
    resizingRequired,
    colorFilePresent,
    depthSlicesPresent,
    fileFolderName: buildThreeDFolderName(input.artworkName, input.orderedWidth, input.orderedHeight, alignment, nowIso().slice(0, 10)),
    status: 'CHECKING_EXISTING_FILES',
    notes: input.notes ?? '',
    validationResults: [],
    archiveRecord: requiresThreeDArchive(input.scanDate) ? buildArchiveRecord(input.artworkName) : undefined,
    fileSets: [],
    checkpoints: buildThreeDCheckpoints(scanMethod),
    expectedSliceCount: DEFAULT_SLICE_COUNT,
    processedSliceCount: depthSlicesPresent ? DEFAULT_SLICE_COUNT : 0,
    resolutionDpi: 300,
    calculatedCropWidth: crop.width,
    calculatedCropHeight: crop.height,
    signatureStatus: 'NEEDS_REVIEW',
    validationHistory: [],
    importClassification: input.importClassification,
    productType: input.productType,
    attentionRequired: scanMethod === 'UNKNOWN',
  }

  return recalculateThreeDFilePreparation(prep)
}

export const createSeededThreeDFilePreparation = (job: ProductionJob, workItemId: string): ThreeDFilePreparation => {
  const prep = createThreeDFilePreparation({
    workItemId,
    productionJobId: job.id,
    artworkId: `artwork-${job.id}`,
    artworkName: job.artworkTitle,
    orderedWidth: job.width,
    orderedHeight: job.height,
    importClassification: 'THREE_D_TEXTURED_REPLICA',
    productType: job.productType,
    existingFilesFound: job.steps.FILES === 'COMPLETE',
    existingFilesCorrectSize: job.steps.FILES === 'COMPLETE',
    colorFilePresent: job.steps.FILES === 'COMPLETE',
    depthSlicesPresent: job.steps.FILES === 'COMPLETE',
    scanDate: '2024-09-15',
    notes: job.notes,
  })

  const next = {
    ...prep,
    signatureStatus: 'SIGNATURE_VISIBLE' as ThreeDSignatureStatus,
    processedSliceCount: DEFAULT_SLICE_COUNT,
    fileSets: prep.existingFilesFound
      ? [
          {
            id: createEntityId('3d_file_set'),
            label: 'ORDER_SIZE' as const,
            folderName: prep.fileFolderName,
            fileLocation: `3D Print Files/${prep.fileFolderName}`,
            colorFilePresent: true,
            depthSlicesPresent: true,
            sliceCount: DEFAULT_SLICE_COUNT,
            widthInches: prep.calculatedCropWidth,
            heightInches: prep.calculatedCropHeight,
            resolutionDpi: 300,
          },
        ]
      : [],
  }

  return recalculateThreeDFilePreparation({
    ...next,
    completedAt: job.steps.FILES === 'COMPLETE' ? nowIso() : undefined,
    status: job.steps.FILES === 'COMPLETE' ? (job.steps.PRINTED === 'COMPLETE' ? 'COMPLETE' : 'READY_FOR_PRINTER') : 'CHECKING_EXISTING_FILES',
  })
}

export const getThreeDValidationResults = (
  prep: ThreeDFilePreparation,
): ThreeDFileValidation[] => {
  const orderSizeFileSet = prep.fileSets.find((fileSet) => fileSet.label === 'ORDER_SIZE')
  const dimensionsMatch =
    orderSizeFileSet?.widthInches === prep.calculatedCropWidth &&
    orderSizeFileSet?.heightInches === prep.calculatedCropHeight
  const resolutionMatch = orderSizeFileSet?.resolutionDpi === 300 || prep.resolutionDpi === 300
  const folderNamingCorrect = prep.fileFolderName.length > 0 && /\d{4}-\d{2}-\d{2}$/.test(prep.fileFolderName)
  const archiveCompleted = !prep.archiveRecord?.required || Boolean(prep.archiveRecord.completed)

  return [
    {
      code: 'COLOR_FILE_EXISTS',
      label: 'Color file exists',
      passed: prep.colorFilePresent,
      message: prep.colorFilePresent ? 'Color file is present.' : 'Color file is missing.',
    },
    {
      code: 'DEPTH_SLICES_EXIST',
      label: 'Depth slices exist',
      passed: prep.depthSlicesPresent,
      message: prep.depthSlicesPresent ? 'Depth slices are present.' : 'Depth slices are missing.',
    },
    {
      code: 'EXPECTED_SLICE_COUNT_PRESENT',
      label: 'Expected slice count present',
      passed: prep.processedSliceCount === prep.expectedSliceCount,
      message: prep.processedSliceCount === prep.expectedSliceCount
        ? `Expected ${prep.expectedSliceCount} slices are present.`
        : `Expected ${prep.expectedSliceCount} slices, found ${prep.processedSliceCount}.`,
    },
    {
      code: 'DIMENSIONS_MATCH',
      label: 'Color file and slices share identical dimensions',
      passed: Boolean(dimensionsMatch),
      message: dimensionsMatch ? 'Dimensions align with the order-size target.' : 'Dimensions do not match the order-size target.',
    },
    {
      code: 'RESOLUTION_300_DPI',
      label: 'Resolution is 300 DPI',
      passed: resolutionMatch,
      message: resolutionMatch ? 'Resolution is 300 DPI.' : 'Resolution must be 300 DPI.',
    },
    {
      code: 'CROP_DIMENSIONS_CORRECT',
      label: 'Crop dimensions equal ordered dimensions plus 0.223 inches',
      passed: prep.calculatedCropWidth === toThreeDecimals(prep.orderedWidth + ORDER_SIZE_BLEED_INCHES) && prep.calculatedCropHeight === toThreeDecimals(prep.orderedHeight + ORDER_SIZE_BLEED_INCHES),
      message: 'Crop dimensions must equal ordered dimensions plus 0.223 inches.',
    },
    {
      code: 'ALIGNMENT_MATCHES_ORDER',
      label: 'Alignment matches the order',
      passed: prep.alignment.length > 0,
      message: prep.alignment.length > 0 ? `Alignment recorded as ${prep.alignment}.` : 'Alignment is missing.',
    },
    {
      code: 'FOLDER_NAMING_CORRECT',
      label: 'Folder naming convention is correct',
      passed: folderNamingCorrect,
      message: folderNamingCorrect ? 'Folder naming convention is valid.' : 'Folder naming convention must end with the date token.',
    },
    {
      code: 'SIGNATURE_STATUS_RECORDED',
      label: 'Signature status is recorded',
      passed: prep.signatureStatus !== 'NEEDS_REVIEW' && (prep.signatureStatus !== 'SIGNATURE_REMOVED_TO_FIT' || Boolean(prep.signatureNotes?.trim())),
      message: 'Signature handling must be recorded and removal requires a note or approval.',
    },
    {
      code: 'ARCHIVE_COMPLETED_WHEN_REQUIRED',
      label: 'Archive requirement is complete when applicable',
      passed: archiveCompleted,
      message: archiveCompleted ? 'Archive requirement satisfied.' : 'Archive record must be completed before FILES can finish.',
    },
  ]
}

export const isThreeDPreparationReadyForPrinter = (prep: ThreeDFilePreparation): boolean =>
  prep.validationResults.every((result) => result.passed) &&
  (prep.status === 'READY_FOR_PRINTER' || prep.status === 'COMPLETE')

export const getThreeDPreparationAdditionalMinutes = (prep: ThreeDFilePreparation): number => {
  let minutes = 0
  if (prep.slicingRequired) {
    minutes += 135
  }
  if (prep.resizingRequired) {
    minutes += 55
  }
  if (!prep.colorFilePresent || !prep.depthSlicesPresent) {
    minutes += 35
  }
  if (prep.status === 'VALIDATION_FAILED') {
    minutes += 45
  }
  if (prep.scanMethod === 'UNKNOWN') {
    minutes += 20
  }
  return minutes
}

export const getThreeDDirectorOperationType = (prep: ThreeDFilePreparation): string => {
  if (prep.archiveRecord?.required && !prep.archiveRecord.completed) {
    return 'Archive Old 3D Files'
  }
  if (!prep.existingFilesFound || prep.status === 'CHECKING_EXISTING_FILES') {
    return 'Check Existing 3D Files'
  }
  if (prep.slicingRequired || prep.status === 'SLICING_REQUIRED' || prep.status === 'SLICING_IN_PROGRESS') {
    return 'Slice 3D Artwork'
  }
  if (prep.resizingRequired || prep.status === 'RESIZING_REQUIRED' || prep.status === 'FORMATTING_IN_PROGRESS') {
    return 'Resize 3D Print Files'
  }
  return 'Validate 3D File Set'
}

export const recalculateThreeDFilePreparation = (
  prep: ThreeDFilePreparation,
): ThreeDFilePreparation => {
  const slicingRequired = !prep.existingFilesFound || (!prep.existingFilesCorrectSize && !prep.depthSlicesPresent)
  const resizingRequired = prep.existingFilesFound && !prep.existingFilesCorrectSize
  const validationResults = getThreeDValidationResults(prep)
  const scanMethod = inferThreeDScanMethod(prep.scanDate)
  const archiveRequired = requiresThreeDArchive(prep.scanDate)
  const nextArchiveRecord = archiveRequired
    ? prep.archiveRecord ?? buildArchiveRecord(prep.fileFolderName.split(' ').slice(0, -4).join(' ') || prep.fileFolderName)
    : undefined

  let status: ThreeDFilePreparationStatus = prep.status
  let attentionRequired = prep.attentionRequired

  if (scanMethod === 'UNKNOWN') {
    status = 'NEEDS_REVIEW'
    attentionRequired = true
  } else if (archiveRequired && !nextArchiveRecord?.completed) {
    status = 'ARCHIVE_REQUIRED'
  } else if (prep.existingFilesCorrectSize && prep.colorFilePresent && prep.depthSlicesPresent && validationResults.every((result) => result.passed)) {
    status = prep.completedAt ? 'COMPLETE' : 'READY_FOR_PRINTER'
  } else if (prep.slicingRequired) {
    status = prep.checkpoints.some((checkpoint) => checkpoint.category === 'SLICING' && checkpoint.completed)
      ? 'SLICING_IN_PROGRESS'
      : 'SLICING_REQUIRED'
  } else if (prep.resizingRequired) {
    status = 'RESIZING_REQUIRED'
  } else if (validationResults.some((result) => !result.passed)) {
    status = 'VALIDATION_FAILED'
  } else {
    status = 'VALIDATION_REQUIRED'
  }

  return {
    ...prep,
    slicingRequired,
    resizingRequired,
    scanMethod,
    archiveRecord: nextArchiveRecord,
    validationResults,
    status,
    attentionRequired,
  }
}

export const finalizeThreeDValidation = (
  prep: ThreeDFilePreparation,
  actorEmployeeId?: string,
): ThreeDFilePreparation => {
  const recalculated = recalculateThreeDFilePreparation(prep)
  const failedCodes = recalculated.validationResults.filter((result) => !result.passed).map((result) => result.code)
  const ready = failedCodes.length === 0

  return {
    ...recalculated,
    status: ready ? 'READY_FOR_PRINTER' : 'VALIDATION_FAILED',
    completedBy: ready ? actorEmployeeId ?? recalculated.completedBy : recalculated.completedBy,
    completedAt: ready ? nowIso() : recalculated.completedAt,
    validationHistory: [
      {
        ranAt: nowIso(),
        ranBy: actorEmployeeId,
        failedCodes,
      },
      ...recalculated.validationHistory,
    ],
  }
}