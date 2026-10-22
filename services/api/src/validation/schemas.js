const Joi = require('joi');

const isoDate = Joi.string()
  .custom((value, helpers) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      return helpers.error('date.format');
    }
    return value;
  })
  .messages({ 'date.format': '{{#label}} must be a valid YYYY-MM-DD date' });
const id = Joi.number().integer().positive();

const login = Joi.object({
  email: Joi.string().email({ tlds: false }).lowercase().trim().required(),
});

const createProject = Joi.object({
  code: Joi.string().trim().uppercase().pattern(/^[A-Z0-9-]{2,20}$/).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  billable: Joi.boolean().default(true),
});

const createEntry = Joi.object({
  projectId: id.required(),
  workDate: isoDate.required(),
  hours: Joi.number().greater(0).max(24).precision(2).required(),
  description: Joi.string().trim().max(500).allow('').default(''),
});

const updateEntry = Joi.object({
  projectId: id,
  workDate: isoDate,
  hours: Joi.number().greater(0).max(24).precision(2),
  description: Joi.string().trim().max(500).allow(''),
}).min(1);

const listEntries = Joi.object({
  from: isoDate,
  to: isoDate,
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected'),
  userId: id,
});

const reviewEntry = Joi.object({
  note: Joi.string().trim().max(500).allow('').default(''),
});

const rejectEntry = Joi.object({
  note: Joi.string().trim().min(3).max(500).required(),
});

const hoursReport = Joi.object({
  from: isoDate.required(),
  to: isoDate.required(),
  groupBy: Joi.string().valid('project', 'user').default('project'),
  status: Joi.string().valid('submitted', 'approved').default('approved'),
});

const createPayrollExport = Joi.object({
  periodStart: isoDate.required(),
  periodEnd: isoDate.required(),
});

const idParam = Joi.object({ id: id.required() });

module.exports = {
  login,
  createProject,
  createEntry,
  updateEntry,
  listEntries,
  reviewEntry,
  rejectEntry,
  hoursReport,
  createPayrollExport,
  idParam,
};
