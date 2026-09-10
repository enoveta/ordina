const { success, fail } = require('../utils/apiResponse');
const authService = require('../services/authService');
const { registerSchema, loginSchema, parse } = require('../validators/auth');
const { prisma } = require('../config/prisma');
const { publicUser } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const data = parse(registerSchema, req.body);
    return success(res, await authService.register(data), 201);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = parse(loginSchema, req.body);
    return success(res, await authService.login(data));
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    return success(res, await authService.verifyEmail(req.body.email, req.body.code));
  } catch (error) {
    return next(error);
  }
}

async function google(req, res, next) {
  try {
    const idToken = req.body.idToken;
    if (!idToken) return fail(res, 'idToken is required', 400);
    return success(res, await authService.googleSignIn(idToken));
  } catch (error) {
    return next(error);
  }
}

async function apple(req, res, next) {
  try {
    return success(res, await authService.appleSignIn(req.body));
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res) {
  return success(res, {
    message: 'If that email exists, a reset link will be sent once email delivery is configured.',
  });
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return fail(res, 'User not found', 404);
    return success(res, { user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await authService.updateProfile(req.userId, req.body);
    return success(res, { user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, verifyEmail, google, apple, forgotPassword, me, updateMe };
