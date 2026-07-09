import type { ApplicantRecord } from '../data/types'
import type { FieldRow, PositionRow, StageRow } from '../sheets/types'
import { getDb, type AppConfig } from './db'

export async function loadConfig(): Promise<AppConfig | null> {
  const db = await getDb()
  return (await db.get('config', 'app')) ?? null
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const db = await getDb()
  await db.put('config', config, 'app')
}

export async function loadCachedStages(): Promise<StageRow[]> {
  const db = await getDb()
  return (await db.get('stagesCache', 'all')) ?? []
}

export async function saveCachedStages(stages: StageRow[]): Promise<void> {
  const db = await getDb()
  await db.put('stagesCache', stages, 'all')
}

export async function loadCachedPositions(): Promise<PositionRow[]> {
  const db = await getDb()
  return (await db.get('positionsCache', 'all')) ?? []
}

export async function saveCachedPositions(positions: PositionRow[]): Promise<void> {
  const db = await getDb()
  await db.put('positionsCache', positions, 'all')
}

export async function loadCachedFields(): Promise<FieldRow[]> {
  const db = await getDb()
  return (await db.get('fieldsCache', 'all')) ?? []
}

export async function saveCachedFields(fields: FieldRow[]): Promise<void> {
  const db = await getDb()
  await db.put('fieldsCache', fields, 'all')
}

export async function loadSnapshot(): Promise<ApplicantRecord[]> {
  const db = await getDb()
  return (await db.get('applicantsSnapshot', 'all')) ?? []
}

export async function saveSnapshot(applicants: ApplicantRecord[]): Promise<void> {
  const db = await getDb()
  await db.put('applicantsSnapshot', applicants, 'all')
}
