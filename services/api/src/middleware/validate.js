const { badRequest } = require('../errors');

const validate = (schema, property = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(badRequest('Request validation failed', error.details.map((detail) => detail.message)));
  }
  req.validated = { ...(req.validated || {}), [property]: value };
  return next();
};

module.exports = { validate };
