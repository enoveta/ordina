require('dotenv/config');

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', 'file:./data/ordina.sqlite'),
  jwtSecret: process.env.JWT_SECRET || 'replace-me-in-production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
};

module.exports = { env };
