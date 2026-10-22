import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material'
import { errorMessage } from '../api/client'
import { useEntryAction, useTimesheets } from '../api/hooks'
import { useAuth } from '../auth/useAuth'
import { EntryTable } from '../components/EntryTable'

export function ApprovalsPage() {
  const { user } = useAuth()
  const submitted = useTimesheets({ status: 'submitted' })
  const action = useEntryAction()
  const [rejecting, setRejecting] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const queue = (submitted.data ?? []).filter((entry) => entry.userId !== user?.id)

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Approvals</Typography>
      {action.error && <Alert severity="error">{errorMessage(action.error)}</Alert>}
      <Paper sx={{ p: 2 }}>
        <EntryTable
          entries={queue}
          showUser
          actions={(entry) => (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => action.mutate({ id: entry.id, action: 'approve' })}>
                Approve
              </Button>
              <Button size="small" color="error" onClick={() => setRejecting(entry.id)}>
                Reject
              </Button>
            </Stack>
          )}
        />
      </Paper>
      <Dialog open={rejecting !== null} onClose={() => setRejecting(null)}>
        <DialogTitle>Reject entry</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Reason" value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button
            color="error"
            disabled={note.trim().length < 3}
            onClick={() => {
              if (rejecting !== null) action.mutate({ id: rejecting, action: 'reject', note })
              setRejecting(null)
              setNote('')
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
