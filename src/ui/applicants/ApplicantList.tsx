import { useMemo, useState } from 'react'
import { resolveFields } from '../../data/fields'
import type { ApplicantRecord } from '../../data/types'
import { useStore } from '../../store/StoreContext'
import styles from './ApplicantList.module.css'

type SortKey = 'name' | 'stage' | 'updatedAt'

interface ApplicantListProps {
  initialStage: string | null
  onBack: () => void
  onOpenApplicant: (email: string, queueEmails: string[]) => void
  onPrintQueue: (queueEmails: string[]) => void
}

export function ApplicantList({ initialStage, onBack, onOpenApplicant, onPrintQueue }: ApplicantListProps) {
  const { applicants, stages, fields } = useStore()
  const { nameColumn } = resolveFields(fields)
  const [stageFilter, setStageFilter] = useState<string | null>(initialStage)
  const [sortKey, setSortKey] = useState<SortKey>('stage')

  function displayName(a: ApplicantRecord): string {
    return (nameColumn ? a.applicationValues[nameColumn] : '') || a.email
  }

  const filtered = useMemo(
    () => (stageFilter === null ? applicants : applicants.filter((a) => a.stage === stageFilter)),
    [applicants, stageFilter],
  )

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortKey === 'name') return displayName(a).localeCompare(displayName(b))
      if (sortKey === 'stage') return a.stage.localeCompare(b.stage)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    return copy
  }, [filtered, sortKey, nameColumn])

  const queueEmails = sorted.map((a) => a.email)

  return (
    <div className={styles.list}>
      <button type="button" onClick={onBack}>
        ← Dashboard
      </button>

      <div className={styles.controls}>
        <label>
          Stage
          <select value={stageFilter ?? ''} onChange={(e) => setStageFilter(e.target.value || null)}>
            <option value="">All</option>
            {stages.map((s) => (
              <option key={s.stage} value={s.stage}>
                {s.stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="stage">Stage</option>
            <option value="name">Name</option>
            <option value="updatedAt">Last updated</option>
          </select>
        </label>
      </div>

      <button type="button" onClick={() => onPrintQueue(queueEmails)} disabled={sorted.length === 0}>
        Print packets
      </button>

      {sorted.length === 0 ? (
        <p>No applicants in this view.</p>
      ) : (
        <ul className={styles.rows}>
          {sorted.map((a) => (
            <li key={a.email}>
              <button type="button" onClick={() => onOpenApplicant(a.email, queueEmails)}>
                <span className={styles.name}>{displayName(a)}</span>
                <span className={styles.stage}>{a.stage}</span>
                <span className={styles.position}>{a.offeredPosition}</span>
                <span className={styles.updated}>
                  {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
