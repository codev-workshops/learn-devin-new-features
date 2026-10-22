import { Chip } from '@mui/material'
import type { EntryStatus } from '../api/types'

const COLORS = { draft: 'default', submitted: 'info', approved: 'success', rejected: 'error' } as const

export function StatusChip({ status }: { status: EntryStatus }) {
  return <Chip size="small" label={status} color={COLORS[status]} variant="outlined" />
}
