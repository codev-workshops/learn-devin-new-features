export type Role = 'employee' | 'manager' | 'admin'
export type EntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface Tenant {
  id: number
  slug: string
  name: string
}

export interface User {
  id: number
  email: string
  name: string
  role: Role
  tenant: Tenant
}

export interface Project {
  id: number
  code: string
  name: string
  billable: boolean
  archived: boolean
}

export interface TimesheetEntry {
  id: number
  userId: number
  userName: string
  projectId: number
  projectCode: string
  projectName: string
  workDate: string
  hours: number
  description: string
  status: EntryStatus
  reviewedBy: number | null
  reviewedAt: string | null
  reviewNote: string | null
}

export interface NewEntry {
  projectId: number
  workDate: string
  hours: number
  description: string
}

export interface HoursReportRow {
  key: string
  label: string
  hours: number
}

export interface HoursReport {
  from: string
  to: string
  groupBy: 'project' | 'user'
  status: 'submitted' | 'approved'
  rows: HoursReportRow[]
  totalHours: number
}

export interface PayrollExport {
  id: number
  periodStart: string
  periodEnd: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  attempts: number
  filePath: string | null
  totalHours: number | null
  totalAmountCents: number | null
  lastError: string | null
  createdAt: string
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: string[] }
}
