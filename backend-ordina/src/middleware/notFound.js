const { fail } = require('../utils/apiResponse');

function notFound(_req, res) {
  return fail(res, 'Route not found', 404);
}

module.exports = { notFound };
