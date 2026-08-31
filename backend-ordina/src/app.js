const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { healthRouter } = require('./routes/health');
const { authRouter } = require('./routes/auth');
const { tasksRouter } = require('./routes/tasks');
const { projectsRouter } = require('./routes/projects');
const { aiRouter } = require('./routes/ai');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/ai', aiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
