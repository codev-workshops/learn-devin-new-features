const { HttpError } = require('../errors');

const PG_UNIQUE_VIOLATION = '23505';
const PG_CHECK_VIOLATION = '23514';

function errorHandler(error, req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } });
  }
  if (error.code === PG_UNIQUE_VIOLATION) {
    return res.status(409).json({ error: { code: 'conflict', message: 'A record with these values already exists' } });
  }
  if (error.code === PG_CHECK_VIOLATION) {
    return res.status(400).json({ error: { code: 'validation_error', message: 'Value violates a database constraint' } });
  }
  (req.log || console).error({ err: error }, 'Unhandled error');
  return res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
}

module.exports = { errorHandler };
