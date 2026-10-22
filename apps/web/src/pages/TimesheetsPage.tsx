import { useState } from 'react'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { errorMessage } from '../api/client'
import { useCreateEntry, useEntryAction, useProjects, useTimesheets } from '../api/hooks'
import { useAuth } from '../auth/useAuth'
import { EntryTable } from '../components/EntryTable'

const today = () => new Date().toISOString().slice(0, 10)

export function TimesheetsPage() {
  const { user } = useAuth()
  const projects = useProjects()
  const entries = useTimesheets()
  const create = useCreateEntry()
  const action = useEntryAction()
  const [form, setForm] = useState({ projectId: '', workDate: today(), hours: '8', description: '' })

  const mine = (entries.data ?? []).filter((entry) => entry.userId === user?.id)
  const error = create.error ?? action.error ?? entries.error

  return (
    <Stack spacing={3}>
      <Typography variant="h4">My timesheet</Typography>
      {error && <Alert severity="error">{errorMessage(error)}</Alert>}
      <Paper sx={{ p: 2 }}>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault()
            create.mutate(
              { projectId: Number(form.projectId), workDate: form.workDate, hours: Number(form.hours), description: form.description },
              { onSuccess: () => setForm((prev) => ({ ...prev, description: '' })) },
            )
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              size="small"
              label="Project"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              sx={{ minWidth: 220 }}
              required
            >
              {(projects.data ?? []).map((project) => (
                <MenuItem key={project.id} value={String(project.id)}>
                  {project.code} · {project.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="Date"
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              size="small"
              type="number"
              label="Hours"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              slotProps={{ htmlInput: { min: 0.25, max: 24, step: 0.25 } }}
              required
            />
            <TextField
              size="small"
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={create.isPending}>
              Add
            </Button>
          </Stack>
        </Box>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <EntryTable
          entries={mine}
          actions={(entry) =>
            entry.status === 'draft' || entry.status === 'rejected' ? (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={() => action.mutate({ id: entry.id, action: 'submit' })}>
                  Submit
                </Button>
                {entry.status === 'draft' && (
                  <Button size="small" color="error" onClick={() => action.mutate({ id: entry.id, action: 'delete' })}>
                    Delete
                  </Button>
                )}
              </Stack>
            ) : null
          }
        />
      </Paper>
    </Stack>
  )
}
