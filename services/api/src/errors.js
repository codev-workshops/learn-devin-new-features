class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message, details) => new HttpError(400, 'validation_error', message, details);
const unauthorized = (message = 'Authentication required') => new HttpError(401, 'unauthorized', message);
const forbidden = (message = 'You do not have access to this resource') => new HttpError(403, 'forbidden', message);
const notFound = (message = 'Resource not found') => new HttpError(404, 'not_found', message);
const conflict = (message) => new HttpError(409, 'conflict', message);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
