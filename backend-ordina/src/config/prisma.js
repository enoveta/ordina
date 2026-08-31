const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');

const { env } = require('./env');

const adapter = new PrismaLibSql({ url: env.databaseUrl });
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
