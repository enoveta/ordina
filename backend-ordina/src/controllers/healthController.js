const { prisma } = require('../config/prisma');
const { success, fail } = require('../utils/apiResponse');

async function getHealth(_req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return success(res, {
      service: 'ordina-api',
      status: 'ok',
      database: 'connected',
      engine: 'sqlite',
    });
  } catch (error) {
    return fail(res, 'Database unavailable', 503, { reason: error.message });
  }
}

module.exports = { getHealth };
