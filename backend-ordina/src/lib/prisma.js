require('dotenv/config');

const path = require('path');
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Copy backend-ordina/.env.example to .env');
}

function createAdapter() {
  const databaseUrl = process.env.DATABASE_URL;
  if (/^(libsql|https|wss):/i.test(databaseUrl)) {
    const { PrismaLibSql } = require('@prisma/adapter-libsql');
    return new PrismaLibSql({ url: databaseUrl, authToken: process.env.DATABASE_AUTH_TOKEN });
  }

  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const relative = databaseUrl.replace(/^file:/i, '').replace(/^\/\/\//, '').replace(/^\/\//, '');
  const backendRoot = path.resolve(__dirname, '..', '..');
  const absolute = path.isAbsolute(relative) ? relative : path.resolve(backendRoot, relative);
  return new PrismaBetterSqlite3({ url: absolute });
}

console.log('ORDINA db: connecting...');
const prisma = new PrismaClient({ adapter: createAdapter() });
console.log('ORDINA db: client ready');

module.exports = prisma;
