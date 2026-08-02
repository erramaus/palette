import type { ProductType } from './production'

export type ThreeDFilePreparationStatus =
  | 'NOT_STARTED'
  | 'CHECKING_EXISTING_FILES'
  | 'ARCHIVE_REQUIRED'
  | 'SLICING_REQUIRED'
  | 'SLICING_IN_PROGRESS'
  | 'RESIZING_REQUIRED'
  | 'FORMATTING_IN_PROGRESS'
  | 'VALIDATION_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'READY_FOR_PRINTER'
  | 'COMPLETE'
  | 'NEEDS_REVIEW'

export type ThreeDScanMethod = 'OLD_PRINT_METHOD' | 'NEW_PRINT_METHOD' | 'UNKNOWN'

export type ThreeDAlignment = 'HORIZ' | 'VERT' | 'SQUARE' | 'PANORAMA'

export type ThreeDFileValidationCode =
  | 'COLOR_FILE_EXISTS'
  | 'DEPTH_SLICES_EXIST'
  | 'EXPECTED_SLICE_COUNT_PRESENT'
  | 'DIMENSIONS_MATCH'
  | 'RESOLUTION_300_DPI'
  | 'CROP_DIMENSIONS_CORRECT'
  | 'ALIGNMENT_MATCHES_ORDER'
  | 'FOLDER_NAMING_CORRECT'
  | 'SIGNATURE_STATUS_RECORDED'
  | 'ARCHIVE_COMPLETED_WHEN_REQUIRED'

export type ThreeDSignatureStatus =
  | 'SIGNATURE_VISIBLE'
  | 'SIGNATURE_REPOSITIONED'
  | 'SIGNATURE_REMOVED_TO_FIT'
  | 'NO_SIGNATURE_PRESENT'
  | 'NEEDS_REVIEW'

export type ThreeDFileCheckpointCategory = 'INITIAL_CHECK' | 'SLICING' | 'FORMATTING' | 'VALIDATION'

export type ThreeDOrderImportClassification =
  | 'THREE_D_PRINT'
  | 'THREE_D_TEXTURED_REPLICA'
  | 'CANVAS'
  | 'PAPER'

export interface ThreeDFileSet {
  id: string
  label: 'MASTER' | 'ORDER_SIZE' | 'ARCHIVE'
  folderName: string
  fileLocation: string
  colorFilePresent: boolean
  depthSlicesPresent: boolean
  sliceCount: number
  widthInches?: number
  heightInches?: number
  resolutionDpi?: number
  archivedAt?: string
}

export interface ThreeDFileCheckpoint {
  id: string
  category: ThreeDFileCheckpointCategory
  label: string
  required: boolean
  completed: boolean
  completedAt?: string
  completedBy?: string
  notes?: string
}

export interface ThreeDFileValidation {
  code: ThreeDFileValidationCode
  label: string
  passed: boolean
  message: string
}

export interface ThreeDFileArchiveRecord {
  id: string
  archiveName: string
  originalLocation: string
  archiveLocation: string
  required: boolean
  completed: boolean
  createdAt: string
  completedAt?: string
  notes?: string
}

export interface ThreeDFilePreparation {
  id: string
  workItemId: string
  productionJobId: string
  artworkId: string
  orderedWidth: number
  orderedHeight: number
  alignment: ThreeDAlignment
  scanDate?: string
  scanMethod: ThreeDScanMethod
  existingFilesFound: boolean
  existingFilesCorrectSize: boolean
  slicingRequired: boolean
  resizingRequired: boolean
  colorFilePresent: boolean
  depthSlicesPresent: boolean
  fileFolderName: string
  completedBy?: string
  completedAt?: string
  status: ThreeDFilePreparationStatus
  notes: string
  validationResults: ThreeDFileValidation[]
  archiveRecord?: ThreeDFileArchiveRecord
  fileSets: ThreeDFileSet[]
  checkpoints: ThreeDFileCheckpoint[]
  expectedSliceCount: number
  processedSliceCount: number
  resolutionDpi: number
  calculatedCropWidth: number
  calculatedCropHeight: number
  signatureStatus: ThreeDSignatureStatus
  signatureNotes?: string
  validationHistory: Array<{
    ranAt: string
    ranBy?: string
    failedCodes: ThreeDFileValidationCode[]
  }>
  importClassification: ThreeDOrderImportClassification
  productType: ProductType
  attentionRequired: boolean
}