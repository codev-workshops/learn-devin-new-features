import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { HoursReport, NewEntry, PayrollExport, Project, TimesheetEntry, User } from './types'

interface Envelope<T> {
  data: T
}

const get = async <T>(url: string, params?: Record<string, string | number | undefined>) =>
  (await api.get<Envelope<T>>(url, { params })).data.data

export const useMe = (enabled: boolean) => useQuery({ queryKey: ['me'], queryFn: () => get<User>('/me'), enabled })

export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: () => get<Project[]>('/projects') })

export interface EntryFilters {
  status?: TimesheetEntry['status']
  from?: string
  to?: string
}

export const useTimesheets = (filters: EntryFilters = {}) =>
  useQuery({ queryKey: ['timesheets', filters], queryFn: () => get<TimesheetEntry[]>('/timesheets', { ...filters }) })

export const useHoursReport = (params: { from: string; to: string; groupBy: 'project' | 'user' }) =>
  useQuery({ queryKey: ['reports', 'hours', params], queryFn: () => get<HoursReport>('/reports/hours', params) })

export const usePayrollExports = () =>
  useQuery({
    queryKey: ['payroll-exports'],
    queryFn: () => get<PayrollExport[]>('/payroll-exports'),
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.status === 'queued' || item.status === 'running') ? 3000 : false,
  })

function useInvalidate(...keys: string[]) {
  const client = useQueryClient()
  return () => Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] })))
}

export function useCreateEntry() {
  const invalidate = useInvalidate('timesheets', 'reports')
  return useMutation({
    mutationFn: async (entry: NewEntry) => (await api.post<Envelope<TimesheetEntry>>('/timesheets', entry)).data.data,
    onSuccess: invalidate,
  })
}

export function useEntryAction() {
  const invalidate = useInvalidate('timesheets', 'reports')
  return useMutation({
    mutationFn: async ({ id, action, note }: { id: number; action: 'submit' | 'approve' | 'reject' | 'delete'; note?: string }) => {
      if (action === 'delete') return api.delete(`/timesheets/${id}`)
      return api.post(`/timesheets/${id}/${action}`, action === 'submit' ? undefined : { note })
    },
    onSuccess: invalidate,
  })
}

export function useRequestPayrollExport() {
  const invalidate = useInvalidate('payroll-exports')
  return useMutation({
    mutationFn: async (period: { periodStart: string; periodEnd: string }) =>
      (await api.post<Envelope<PayrollExport>>('/payroll-exports', period)).data.data,
    onSuccess: invalidate,
  })
}
