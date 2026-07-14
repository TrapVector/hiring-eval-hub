import type { FieldRole, FieldRow, StageRow } from '../sheets/types'

/** Default pipeline seeded on first run (CLAUDE.md §6.3): first stage is the default action queue. */
export function defaultStages(): StageRow[] {
  return [
    { stage: 'To review', isActionQueue: true },
    { stage: 'Reviewing', isActionQueue: false },
    { stage: 'Shortlisted', isActionQueue: false },
    { stage: 'Interview', isActionQueue: false },
    { stage: 'Offer', isActionQueue: false },
    { stage: 'Hired', isActionQueue: false },
    { stage: 'Rejected', isActionQueue: false },
  ]
}

/**
 * Best-guess Fields config from detected Applications headers (§6.3):
 * the first email-looking column becomes the key, the first name-looking
 * column becomes the name; everything else is a plain visible short field
 * for the user to adjust in the wizard.
 */
export function guessFields(header: string[]): FieldRow[] {
  let keyAssigned = false
  let nameAssigned = false

  return header.map((column, i) => {
    const trimmed = column.trim()
    let role: FieldRole = ''
    if (!keyAssigned && /email/i.test(trimmed)) {
      role = 'key'
      keyAssigned = true
    } else if (!nameAssigned && /name/i.test(trimmed)) {
      role = 'name'
      nameAssigned = true
    }
    return { column: trimmed, role, show: true, order: i, keyInfo: false }
  })
}
