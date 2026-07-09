import type { FieldRow } from '../sheets/types'

export interface ResolvedFields {
  keyColumn: string | null
  nameColumn: string | null
  longColumns: string[]
  /** Fields with show=true, in display order. */
  visible: FieldRow[]
}

export function resolveFields(fields: FieldRow[]): ResolvedFields {
  const keyColumn = fields.find((f) => f.role === 'key')?.column ?? null
  const nameColumn = fields.find((f) => f.role === 'name')?.column ?? null
  const longColumns = fields.filter((f) => f.role === 'long').map((f) => f.column)
  const visible = fields.filter((f) => f.show).sort((a, b) => orderValue(a) - orderValue(b))

  return { keyColumn, nameColumn, longColumns, visible }
}

function orderValue(field: FieldRow): number {
  return field.order ?? Number.MAX_SAFE_INTEGER
}
