import type { ReviewsRecord } from '../sheets/reviewsSheet'
import type { ApplicationRow } from '../sheets/types'
import type { ApplicantRecord } from './types'

/**
 * Left-joins deduped Applications rows with Reviews rows by email.
 * Applicants with no Reviews row are synthesized at the default stage
 * (CLAUDE.md §6.2, §8.3) rather than requiring a pre-created row.
 */
export function mergeApplicants(
  applications: ApplicationRow[],
  keyColumn: string,
  reviews: ReviewsRecord[],
  defaultStage: string,
): ApplicantRecord[] {
  const reviewsByEmail = new Map(reviews.map((r) => [r.email, r]))
  const records: ApplicantRecord[] = []

  for (const app of applications) {
    const email = (app.values[keyColumn] ?? '').trim().toLowerCase()
    if (!email) continue

    const review = reviewsByEmail.get(email)
    records.push(
      review
        ? {
            email,
            applicationValues: app.values,
            stage: review.stage,
            offeredPosition: review.offeredPosition,
            note: review.note,
            updatedAt: review.updatedAt,
            hasReviewRow: true,
          }
        : {
            email,
            applicationValues: app.values,
            stage: defaultStage,
            offeredPosition: '',
            note: '',
            updatedAt: '',
            hasReviewRow: false,
          },
    )
  }

  return records
}
