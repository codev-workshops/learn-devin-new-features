const toIsoDate = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value);
const toIsoTimestamp = (value) => (value instanceof Date ? value.toISOString() : value);
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const serializeEntry = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  projectId: row.project_id,
  projectCode: row.project_code,
  projectName: row.project_name,
  workDate: toIsoDate(row.work_date),
  hours: toNumber(row.hours),
  description: row.description,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewedAt: toIsoTimestamp(row.reviewed_at),
  reviewNote: row.review_note,
});

const serializeProject = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  billable: row.billable,
  archived: row.archived,
});

const serializeExport = (row) => ({
  id: row.id,
  periodStart: toIsoDate(row.period_start),
  periodEnd: toIsoDate(row.period_end),
  status: row.status,
  attempts: row.attempts,
  idempotencyKey: row.idempotency_key,
  filePath: row.file_path,
  totalHours: toNumber(row.total_hours),
  totalAmountCents: toNumber(row.total_amount_cents),
  lastError: row.last_error,
  requestedBy: row.requested_by,
  createdAt: toIsoTimestamp(row.created_at),
  startedAt: toIsoTimestamp(row.started_at),
  finishedAt: toIsoTimestamp(row.finished_at),
});

module.exports = { serializeEntry, serializeProject, serializeExport, toIsoDate };
