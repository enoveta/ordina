const { success } = require('../utils/apiResponse');
const aiService = require('../services/aiService');

async function chat(req, res, next) {
  try {
    return success(res, await aiService.chat(req.body.message));
  } catch (error) {
    return next(error);
  }
}

module.exports = { chat };
