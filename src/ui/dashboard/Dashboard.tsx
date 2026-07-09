import { resolveFields } from '../../data/fields'
import { useStore } from '../../store/StoreContext'
import styles from './Dashboard.module.css'

interface DashboardProps {
  onOpenStage: (stage: string | null) => void
}

export function Dashboard({ onOpenStage }: DashboardProps) {
  const { applicants, stages, fields, isSyncing } = useStore()
  const { nameColumn } = resolveFields(fields)

  if (stages.length === 0) {
    return <p>{isSyncing ? 'Loading…' : 'No pipeline stages configured yet.'}</p>
  }

  const countsByStage = new Map<string, number>()
  for (const a of applicants) {
    countsByStage.set(a.stage, (countsByStage.get(a.stage) ?? 0) + 1)
  }

  const actionQueues = stages.filter((s) => s.isActionQueue)

  return (
    <div className={styles.dashboard}>
      <section>
        <h2>Pipeline</h2>
        <ul className={styles.summary}>
          {stages.map((s) => (
            <li key={s.stage}>
              <button type="button" onClick={() => onOpenStage(s.stage)}>
                {s.stage}: {countsByStage.get(s.stage) ?? 0}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => onOpenStage(null)}>
          View all applicants ({applicants.length})
        </button>
      </section>

      {actionQueues.map((s) => {
        const queueApplicants = applicants.filter((a) => a.stage === s.stage)
        return (
          <section key={s.stage}>
            <h2>
              {s.stage} ({queueApplicants.length})
            </h2>
            {queueApplicants.length === 0 ? (
              <p>Nothing here.</p>
            ) : (
              <>
                <ul className={styles.worklist}>
                  {queueApplicants.slice(0, 8).map((a) => (
                    <li key={a.email}>{nameColumn ? a.applicationValues[nameColumn] || a.email : a.email}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => onOpenStage(s.stage)}>
                  Open queue
                </button>
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
