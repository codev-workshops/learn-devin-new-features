import { useState } from 'react'
import { Alert, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { errorMessage } from '../api/client'
import { useHoursReport } from '../api/hooks'

export function ReportsPage() {
  const [params, setParams] = useState({ from: '2026-09-01', to: '2026-09-30', groupBy: 'project' as 'project' | 'user' })
  const report = useHoursReport(params)

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Approved hours</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField size="small" type="date" label="From" value={params.from} onChange={(e) => setParams({ ...params, from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="To" value={params.to} onChange={(e) => setParams({ ...params, to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <ToggleButtonGroup size="small" exclusive value={params.groupBy} onChange={(_e, value) => value && setParams({ ...params, groupBy: value })}>
          <ToggleButton value="project">By project</ToggleButton>
          <ToggleButton value="user">By person</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {report.error && <Alert severity="error">{errorMessage(report.error)}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{params.groupBy === 'project' ? 'Project' : 'Person'}</TableCell>
              <TableCell align="right">Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(report.data?.rows ?? []).map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.label}</TableCell>
                <TableCell align="right">{row.hours.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {(report.data?.totalHours ?? 0).toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}
