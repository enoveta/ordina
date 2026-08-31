const { Router } = require('express');
const controller = require('../controllers/aiController');
const { authRequired } = require('../middleware/auth');

const aiRouter = Router();
aiRouter.use(authRequired);
aiRouter.post('/chat', controller.chat);

module.exports = { aiRouter };
