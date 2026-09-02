require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'ordina-backend', db: 'sqlite', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Database unavailable', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = require('argon2').hash(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: String(name).trim(),
        passwordHash: await passwordHash,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.displayName,
        email: user.email,
      },
      token: `demo-token-${user.id}`,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Unable to register user.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await require('argon2').verify(user.passwordHash, String(password));
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.displayName,
        email: user.email,
      },
      token: `demo-token-${user.id}`,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to sign in.', error: error.message });
  }
});

function currentUserId(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const match = token.match(/^demo-token-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function requireUser(req, res) {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' });
    return null;
  }
  return userId;
}

app.get('/api/projects', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const projects = await prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { tasks: true } });
    res.json({ projects: projects.map((project) => {
      const completed = project.tasks.filter((task) => task.status === 'completed').length;
      const overdue = project.tasks.filter((task) => task.dueAt && task.dueAt < new Date() && task.status !== 'completed').length;
      return { ...project, id: String(project.id), dueDate: project.dueDate?.toISOString(), tasksTotal: project.tasks.length, tasksCompleted: completed, tasksOverdue: overdue, progress: project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0 };
    }) });
  } catch (error) { res.status(500).json({ message: 'Unable to load projects.', error: error.message }); }
});

app.post('/api/projects', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const { name, description, color, dueDate } = req.body ?? {};
    if (!name) return res.status(400).json({ message: 'Project name is required.' });
    const project = await prisma.project.create({ data: { userId, name: String(name).trim(), description, color: color || '#5C4DF2', dueDate: dueDate ? new Date(dueDate) : undefined } });
    res.status(201).json({ project });
  } catch (error) { res.status(400).json({ message: 'Unable to create project.', error: error.message }); }
});

app.patch('/api/projects/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const project = await prisma.project.updateMany({ where: { id: Number(req.params.id), userId }, data: req.body });
    if (!project.count) return res.status(404).json({ message: 'Project not found.' });
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ message: 'Unable to update project.', error: error.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.project.deleteMany({ where: { id: Number(req.params.id), userId } });
  res.status(204).end();
});

for (const resource of ['goal', 'reminder']) {
  const plural = `${resource}s`;
  app.get(`/api/${plural}`, async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const records = await prisma[resource].findMany({ where: { userId }, orderBy: resource === 'reminder' ? { remindAt: 'asc' } : { createdAt: 'desc' } });
    res.json({ [plural]: records });
  });
  app.post(`/api/${plural}`, async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    try {
      const data = { ...req.body, userId };
      if (resource === 'reminder') data.remindAt = new Date(data.remindAt);
      const record = await prisma[resource].create({ data });
      res.status(201).json({ [resource]: record });
    } catch (error) { res.status(400).json({ message: `Unable to create ${resource}.`, error: error.message }); }
  });
  app.patch(`/api/${plural}/:id`, async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await prisma[resource].updateMany({ where: { id: Number(req.params.id), userId }, data: req.body });
    if (!result.count) return res.status(404).json({ message: `${resource} not found.` });
    res.json({ ok: true });
  });
  app.delete(`/api/${plural}/:id`, async (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    await prisma[resource].deleteMany({ where: { id: Number(req.params.id), userId } });
    res.status(204).end();
  });
}

app.get('/api/notifications', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const notifications = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.json({ notifications });
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.notification.updateMany({ where: { id: Number(req.params.id), userId }, data: { read: true } });
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  res.json({ ok: true });
});

function taskPriority(value) {
  return value === 'high' || value === 3 ? 3 : value === 'medium' || value === 2 ? 2 : 1;
}

function taskDate(dueDate, startTime) {
  if (!dueDate) return null;
  const value = `${dueDate}${startTime ? `T${startTime}:00` : 'T09:00:00'}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function taskPayload(body, userId, existing = {}) {
  return {
    userId,
    title: String(body.title ?? existing.title ?? '').trim(),
    description: body.description ?? existing.description ?? null,
    status: body.completed ? 'completed' : body.status === 'in_progress' ? 'in_progress' : body.status === 'completed' ? 'completed' : 'pending',
    priority: taskPriority(body.priority ?? existing.priority),
    dueAt: taskDate(body.dueDate ?? existing.dueDate, body.startTime ?? existing.startTime),
    projectId: body.projectId ? Number(body.projectId) : null,
    completedAt: body.completed ? new Date() : null,
  };
}

app.post('/api/tasks', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const data = taskPayload(req.body ?? {}, userId);
    if (!data.title) return res.status(400).json({ message: 'Task title is required.' });
    const task = await prisma.task.create({ data });
    res.status(201).json({ task });
  } catch (error) { res.status(400).json({ message: 'Unable to create task.', error: error.message }); }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const existing = await prisma.task.findFirst({ where: { id: Number(req.params.id), userId } });
    if (!existing) return res.status(404).json({ message: 'Task not found.' });
    const task = await prisma.task.update({ where: { id: existing.id }, data: taskPayload(req.body ?? {}, userId, existing) });
    res.json({ task });
  } catch (error) { res.status(400).json({ message: 'Unable to update task.', error: error.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.task.deleteMany({ where: { id: Number(req.params.id), userId } });
  res.status(204).end();
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const completed = Boolean(req.body?.completed);
  const result = await prisma.task.updateMany({ where: { id: Number(req.params.id), userId }, data: { status: completed ? 'completed' : 'pending', completedAt: completed ? new Date() : null } });
  if (!result.count) return res.status(404).json({ message: 'Task not found.' });
  res.json({ ok: true });
});

app.get('/api/dashboard', async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const tasks = await prisma.task.findMany({
      where: { dueAt: { gte: new Date(today).toISOString() } },
      orderBy: { dueAt: 'asc' },
      include: { categories: { include: { category: true } } },
      take: 50,
    });

    const mapped = tasks.map((task) => ({
      id: String(task.id),
      title: task.title,
      description: task.description,
      status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'todo',
      priority: task.priority <= 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
      category: task.categories?.[0]?.category?.name?.toLowerCase() || 'work',
      projectId: task.projectId ? String(task.projectId) : undefined,
      dueDate: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : today,
      startTime: task.dueAt ? new Date(task.dueAt).toTimeString().slice(0, 5) : '09:00',
      duration: '1h',
      completed: task.status === 'completed',
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    res.json({ tasks: mapped });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Unable to load dashboard tasks.', error: error.message });
  }
});

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { dueAt: 'asc' },
      include: { categories: { include: { category: true } } },
    });

    const mapped = tasks.map((task) => ({
      id: String(task.id),
      title: task.title,
      description: task.description,
      status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'todo',
      priority: task.priority <= 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
      category: task.categories?.[0]?.category?.name?.toLowerCase() || 'work',
      projectId: task.projectId ? String(task.projectId) : undefined,
      dueDate: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : undefined,
      startTime: task.dueAt ? new Date(task.dueAt).toTimeString().slice(0, 5) : undefined,
      completed: task.status === 'completed',
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    res.json({ tasks: mapped });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ message: 'Unable to load tasks.', error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ORDINA backend listening on http://0.0.0.0:${port}`);
});
