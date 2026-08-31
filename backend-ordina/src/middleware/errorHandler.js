const { fail } = require('../utils/apiResponse');

function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';
  return fail(res, message, status);
}

module.exports = { errorHandler };
