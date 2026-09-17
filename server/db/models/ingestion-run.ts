import type { ObjectId } from 'mongodb'

// Mirrors docs/ai/data-model.md `ingestion_runs` collection. Plain TS types
// (not Zod-validated) since this is written by the pipeline itself, not
// parsed from an external/untrusted source.
export type IngestionRunStatus = 'running' | 'succeeded' | 'failed' | 'flagged_suspicious'

export interface IngestionRunCounts {
  discovered: number
  fetched: number
  normalized: number
  validated: number
  deduped: number
  published: number
  failed: number
}

export interface IngestionRunError {
  url?: string
  message: string
  stage: string
}

export interface IngestionRunDoc {
  _id?: ObjectId
  sourceId: string
  startedAt: Date
  finishedAt: Date | null
  status: IngestionRunStatus
  counts: IngestionRunCounts
  errors: IngestionRunError[]
}

export function emptyCounts(): IngestionRunCounts {
  return {
    discovered: 0,
    fetched: 0,
    normalized: 0,
    validated: 0,
    deduped: 0,
    published: 0,
    failed: 0
  }
}
