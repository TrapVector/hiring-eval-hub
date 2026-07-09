import type { ReviewsRow } from '../sheets/types'

export interface ApplicantRecord {
  email: string
  applicationValues: Record<string, string>
  stage: string
  offeredPosition: string
  note: string
  updatedAt: string
  /** Whether a Reviews row already existed, vs. this being a synthesized default-stage record. */
  hasReviewRow: boolean
}

export interface QueuedEdit {
  email: string
  changes: Partial<Pick<ReviewsRow, 'stage' | 'note' | 'offeredPosition'>>
  ts: number
}
