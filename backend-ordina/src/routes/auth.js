const { Router } = require('express');
const controller = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const authRouter = Router();

authRouter.post('/register', controller.register);
authRouter.post('/login', controller.login);
authRouter.post('/google', controller.google);
authRouter.post('/apple', controller.apple);
authRouter.post('/forgot-password', controller.forgotPassword);
authRouter.get('/me', authRequired, controller.me);
authRouter.patch('/me', authRequired, controller.updateMe);

module.exports = { authRouter };
