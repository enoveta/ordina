const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { fail } = require('../utils/apiResponse');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return fail(res, 'Authentication required', 401);
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return fail(res, 'Invalid or expired session', 401);
  }
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, env.jwtSecret, { expiresIn: '30d' });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    age: user.age,
    gender: user.gender,
    goals: user.goals ? JSON.parse(user.goals) : [],
    provider: user.provider,
    onboardingCompleted: user.onboardingCompleted,
    themePreference: user.themePreference,
  };
}

module.exports = { authRequired, signToken, publicUser };
