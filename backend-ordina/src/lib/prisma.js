require('dotenv/config');

const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
