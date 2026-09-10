const argon2 = require('argon2');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');
const { signToken, publicUser } = require('../middleware/auth');

function sessionPayload(user) {
  return { token: signToken(user), user: publicUser(user) };
}

async function register({ username, email, pin, name, age, gender, goals }) {
  const normalizedUsername = username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    const error = new Error('An account with this email already exists');
    error.status = 409;
    throw error;
  }
  const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existingUsername) {
    const error = new Error('That username is already taken');
    error.status = 409;
    throw error;
  }
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: email.toLowerCase(),
      passwordHash: await argon2.hash(pin),
      emailVerified: false,
      emailVerificationCode: verificationCode,
      displayName: name,
      age: age ? Number(age) : null,
      gender: gender || null,
      goals: goals ? JSON.stringify(goals) : null,
      provider: 'local',
      onboardingCompleted: true,
    },
  });
  return {
    email: user.email,
    verificationRequired: true,
    verificationCode: env.nodeEnv === 'production' ? undefined : verificationCode,
  };
}

async function login({ identifier, pin }) {
  const normalized = identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { username: normalized }] },
  });
  if (!user || user.provider !== 'local') {
    const error = new Error('Invalid username/email or PIN');
    error.status = 401;
    throw error;
  }
  const ok = await argon2.verify(user.passwordHash, pin);
  if (!ok) {
    const error = new Error('Invalid username/email or PIN');
    error.status = 401;
    throw error;
  }
  if (!user.emailVerified) {
    const error = new Error('Confirm your email before signing in');
    error.status = 403;
    throw error;
  }
  return sessionPayload(user);
}

async function verifyEmail(email, code) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.emailVerificationCode || user.emailVerificationCode !== code) {
    const error = new Error('Invalid email confirmation code');
    error.status = 400;
    throw error;
  }
  const verified = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationCode: null },
  });
  return sessionPayload(verified);
}

async function googleSignIn(idToken) {
  if (!env.googleClientId) {
    const error = new Error(
      'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in backend-ordina/.env'
    );
    error.status = 503;
    throw error;
  }
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    const error = new Error('Google token could not be verified');
    error.status = 401;
    throw error;
  }
  const payload = await response.json();
  if (payload.aud !== env.googleClientId) {
    const error = new Error('Google token audience mismatch');
    error.status = 401;
    throw error;
  }
  const email = String(payload.email || '').toLowerCase();
  const googleId = payload.sub;
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `google_${String(googleId).slice(-12)}`,
        email,
        passwordHash: await argon2.hash(`google:${googleId}:${Date.now()}`),
        displayName: payload.name || email.split('@')[0],
        googleId,
        provider: 'google',
        onboardingCompleted: true,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, provider: user.provider === 'local' ? 'local' : 'google' },
    });
  }
  return sessionPayload(user);
}

async function appleSignIn({ identityToken, fullName }) {
  if (!env.appleClientId) {
    const error = new Error(
      'Apple Sign-In is not configured. Set APPLE_CLIENT_ID in backend-ordina/.env'
    );
    error.status = 503;
    throw error;
  }
  if (!identityToken) {
    const error = new Error('Apple identity token is required');
    error.status = 400;
    throw error;
  }
  const parts = identityToken.split('.');
  if (parts.length < 2) {
    const error = new Error('Invalid Apple identity token');
    error.status = 401;
    throw error;
  }
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (env.appleClientId && claims.aud && claims.aud !== env.appleClientId) {
    const error = new Error('Apple token audience mismatch');
    error.status = 401;
    throw error;
  }
  const appleId = claims.sub;
  const email = String(claims.email || `${appleId}@privaterelay.appleid.com`).toLowerCase();
  const name = fullName || email.split('@')[0];
  let user = await prisma.user.findFirst({
    where: { OR: [{ appleId }, { email }] },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `apple_${String(appleId).slice(-12)}`,
        email,
        passwordHash: await argon2.hash(`apple:${appleId}:${Date.now()}`),
        displayName: name,
        appleId,
        provider: 'apple',
        onboardingCompleted: true,
      },
    });
  }
  return sessionPayload(user);
}

async function updateProfile(userId, body) {
  const data = {};
  if (body.name) data.displayName = body.name;
  if (body.age !== undefined) data.age = body.age ? Number(body.age) : null;
  if (body.gender !== undefined) data.gender = body.gender;
  if (body.goals !== undefined) data.goals = JSON.stringify(body.goals);
  if (body.themePreference) data.themePreference = body.themePreference;
  if (body.onboardingCompleted !== undefined) data.onboardingCompleted = body.onboardingCompleted;
  const user = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(user);
}

module.exports = { register, login, verifyEmail, googleSignIn, appleSignIn, updateProfile, sessionPayload };
