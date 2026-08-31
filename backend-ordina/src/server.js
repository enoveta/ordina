const { app } = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./config/prisma');

const server = app.listen(env.port, () => {
  console.log(`ORDINA API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
