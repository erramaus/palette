export const CSW_APPROVAL_CHOICES = [
  'Approved',
  'Approved with Changes',
  'Disapproved',
] as const

export type CswApprovalChoice = typeof CSW_APPROVAL_CHOICES[number]

export interface ThreeSectionCswContent {
  situation: string
  data: string
  solution: string
}