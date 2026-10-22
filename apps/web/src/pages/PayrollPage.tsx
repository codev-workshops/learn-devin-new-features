import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { errorMessage } from '../api/client'
import { usePayrollExports, useRequestPayrollExport } from '../api/hooks'

const money = (cents: number | null) => (cents === null ? '—' : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))

export function PayrollPage() {
  const exports = usePayrollExports()
  const request = useRequestPayrollExport()
  const [period, setPeriod] = useState({ periodStart: '2026-09-01', periodEnd: '2026-09-30' })

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Payroll exports</Typography>
      {(request.error || exports.error) && <Alert severity="error">{errorMessage(request.error ?? exports.error)}</Alert>}
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault()
          request.mutate(period)
        }}
      >
        <Stack direction="row" spacing={2}>
          <TextField size="small" type="date" label="Period start" value={period.periodStart} onChange={(e) => setPeriod({ ...period, periodStart: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="Period end" value={period.periodEnd} onChange={(e) => setPeriod({ ...period, periodEnd: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained" disabled={request.isPending}>
            Request export
          </Button>
        </Stack>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Attempts</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(exports.data ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.periodStart} → {item.periodEnd}
                </TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell align="right">{item.attempts}</TableCell>
                <TableCell align="right">{item.totalHours ?? '—'}</TableCell>
                <TableCell align="right">{money(item.totalAmountCents)}</TableCell>
                <TableCell>{item.lastError ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}
