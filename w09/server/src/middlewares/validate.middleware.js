const Joi = require('joi');
const { ValidationError } = require('../errors');

function formatJoiErrors(details) {
  return details.map(d => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
}

/**
 * validation middleware factory
 * schema: { body?: Joi.Schema, params?: Joi.Schema, query?: Joi.Schema }
 */
function validate(schema = {}) {
  return (req, res, next) => {
    try {
      const allErrors = [];

      if (schema.params) {
        const { value, error } = schema.params.validate(req.params, { abortEarly: false, allowUnknown: false, convert: true });
        if (error) allErrors.push(...error.details);
        else req.params = value;
      }

      if (schema.query) {
        const { value, error } = schema.query.validate(req.query, { abortEarly: false, allowUnknown: false, convert: true });
        if (error) allErrors.push(...error.details);
        else req.query = value;
      }

      if (schema.body) {
        const { value, error } = schema.body.validate(req.body, { abortEarly: false, allowUnknown: false, convert: true });
        if (error) allErrors.push(...error.details);
        else req.body = value;
      }

      if (allErrors.length > 0) {
        const details = formatJoiErrors(allErrors);
        throw new ValidationError('Request validation failed', { details });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
// Middleware: request validation using OpenAPI / schemas

// TODO: integrate validation library
