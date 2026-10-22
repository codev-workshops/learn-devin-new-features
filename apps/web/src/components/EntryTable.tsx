import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { TimesheetEntry } from '../api/types'
import { StatusChip } from './StatusChip'

interface Props {
  entries: TimesheetEntry[]
  showUser?: boolean
  actions?: (entry: TimesheetEntry) => ReactNode
}

export function EntryTable({ entries, showUser = false, actions }: Props) {
  if (!entries.length) return <Typography color="text.secondary">No entries.</Typography>
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          {showUser && <TableCell>Person</TableCell>}
          <TableCell>Project</TableCell>
          <TableCell align="right">Hours</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Status</TableCell>
          {actions && <TableCell align="right">Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.workDate}</TableCell>
            {showUser && <TableCell>{entry.userName}</TableCell>}
            <TableCell>{entry.projectCode}</TableCell>
            <TableCell align="right">{entry.hours.toFixed(2)}</TableCell>
            <TableCell>
              {entry.description}
              {entry.reviewNote && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Review note: {entry.reviewNote}
                </Typography>
              )}
            </TableCell>
            <TableCell>
              <StatusChip status={entry.status} />
            </TableCell>
            {actions && <TableCell align="right">{actions(entry)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
