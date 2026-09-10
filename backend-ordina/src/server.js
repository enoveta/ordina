require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');
const { signToken, requireUser } = require('./lib/auth');
const ai = require('./lib/ai');
const schedule = require('./lib/schedule');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '8mb' }));
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
      token: signToken(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
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
      token: signToken(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to sign in.', error: error.message });
  }
});

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
    const { name, description, color, dueDate, startDate, status, priority } = req.body ?? {};
    if (!name) return res.status(400).json({ message: 'Project name is required.' });
    const project = await prisma.project.create({
      data: {
        userId,
        name: String(name).trim(),
        description,
        color: color || '#5C4DF2',
        status: status || 'active',
        priority: priority || 'medium',
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });
    res.status(201).json({ project: { ...project, id: String(project.id) } });
  } catch (error) { res.status(400).json({ message: 'Unable to create project.', error: error.message }); }
});

app.patch('/api/projects/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const allowed = {};
    for (const key of ['name', 'description', 'color', 'status', 'priority', 'dueDate', 'startDate']) {
      if (req.body?.[key] !== undefined) {
        allowed[key] = key.endsWith('Date') && req.body[key] ? new Date(req.body[key]) : req.body[key];
      }
    }
    const project = await prisma.project.updateMany({ where: { id: Number(req.params.id), userId }, data: allowed });
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

function pickFields(body, keys) {
  const data = {};
  for (const key of keys) {
    if (body?.[key] !== undefined) data[key] = body[key];
  }
  return data;
}

app.get('/api/goals', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const records = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { tasks: true },
  });
  res.json({
    goals: records.map((goal) => {
      const related = goal.tasks;
      const completed = related.filter((task) => task.status === 'completed').length;
      const progress = related.length ? Math.round((completed / related.length) * 100) : (goal.target ? Math.round((goal.current / goal.target) * 100) : (goal.completed ? 100 : 0));
      return { ...goal, progress, tasksTotal: related.length, tasksCompleted: completed };
    }),
  });
});

app.post('/api/goals', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const data = pickFields(req.body ?? {}, ['title', 'description', 'status', 'priority', 'target', 'current', 'dueDate', 'projectId', 'completed']);
    if (!data.title) return res.status(400).json({ message: 'Goal title is required.' });
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.projectId) data.projectId = Number(data.projectId);
    if (data.completed) data.status = 'completed';
    const goal = await prisma.goal.create({ data: { ...data, userId } });
    res.status(201).json({ goal });
  } catch (error) { res.status(400).json({ message: 'Unable to create goal.', error: error.message }); }
});

app.patch('/api/goals/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const data = pickFields(req.body ?? {}, ['title', 'description', 'status', 'priority', 'target', 'current', 'dueDate', 'projectId', 'completed']);
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.projectId !== undefined) data.projectId = data.projectId ? Number(data.projectId) : null;
  if (data.completed === true) data.status = 'completed';
  if (data.completed === false && data.status === undefined) data.status = 'in_progress';
  const result = await prisma.goal.updateMany({ where: { id: Number(req.params.id), userId }, data });
  if (!result.count) return res.status(404).json({ message: 'Goal not found.' });
  res.json({ ok: true });
});

app.delete('/api/goals/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.goal.deleteMany({ where: { id: Number(req.params.id), userId } });
  res.status(204).end();
});

app.get('/api/reminders', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const reminders = await prisma.reminder.findMany({ where: { userId }, orderBy: { remindAt: 'asc' } });
  res.json({ reminders });
});

app.post('/api/reminders', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const data = pickFields(req.body ?? {}, ['title', 'remindAt', 'enabled', 'status', 'taskId', 'projectId', 'goalId']);
    if (!data.title || !data.remindAt) return res.status(400).json({ message: 'Title and reminder date/time are required.' });
    const remindAt = new Date(data.remindAt);
    if (Number.isNaN(remindAt.getTime())) return res.status(400).json({ message: 'Invalid reminder date/time.' });
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: String(data.title).trim(),
        remindAt,
        enabled: data.enabled !== false,
        status: data.status || 'scheduled',
        taskId: data.taskId ? Number(data.taskId) : null,
        projectId: data.projectId ? Number(data.projectId) : null,
        goalId: data.goalId ? Number(data.goalId) : null,
      },
    });
    res.status(201).json({ reminder });
  } catch (error) { res.status(400).json({ message: 'Unable to create reminder.', error: error.message }); }
});

app.patch('/api/reminders/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const data = pickFields(req.body ?? {}, ['title', 'remindAt', 'enabled', 'status', 'completed', 'taskId', 'projectId', 'goalId']);
  if (data.remindAt) {
    data.remindAt = new Date(data.remindAt);
    if (Number.isNaN(data.remindAt.getTime())) return res.status(400).json({ message: 'Invalid reminder date/time.' });
  }
  if (data.completed === true) data.status = 'completed';
  const result = await prisma.reminder.updateMany({ where: { id: Number(req.params.id), userId }, data });
  if (!result.count) return res.status(404).json({ message: 'Reminder not found.' });
  res.json({ ok: true });
});

app.delete('/api/reminders/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.reminder.deleteMany({ where: { id: Number(req.params.id), userId } });
  res.status(204).end();
});

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

function mapTask(task) {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description || '',
    status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'todo',
    priority: task.priority <= 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
    category: task.categories?.[0]?.category?.name?.toLowerCase() || 'work',
    projectId: task.projectId ? String(task.projectId) : undefined,
    goalId: task.goalId ? String(task.goalId) : undefined,
    parentTaskId: task.parentTaskId ? String(task.parentTaskId) : undefined,
    dueDate: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : task.occurrenceDate || undefined,
    startTime: task.startTime || undefined,
    duration: task.duration || undefined,
    recurrence: task.recurrence || 'none',
    reminder: Boolean(task.reminderEnabled),
    completed: task.status === 'completed',
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function materializeRecurrence(userId) {
  const today = schedule.toDateKey(new Date());
  const tomorrow = schedule.addDays(today, 1);
  const parents = await prisma.task.findMany({
    where: { userId, parentTaskId: null, recurrence: { not: 'none' }, status: { not: 'archived' } },
  });
  for (const parent of parents) {
    for (const dateKey of [today, tomorrow]) {
      if (!schedule.matchesRecurrence(parent, dateKey)) continue;
      const existing = await prisma.task.findFirst({
        where: { userId, parentTaskId: parent.id, occurrenceDate: dateKey },
      });
      if (existing) continue;
      await prisma.task.create({
        data: {
          userId,
          parentTaskId: parent.id,
          projectId: parent.projectId,
          goalId: parent.goalId,
          title: parent.title,
          description: parent.description,
          status: 'pending',
          priority: parent.priority,
          dueAt: new Date(`${dateKey}T12:00:00.000Z`),
          startTime: parent.startTime,
          duration: parent.duration,
          recurrence: 'none',
          occurrenceDate: dateKey,
          reminderEnabled: parent.reminderEnabled,
        },
      });
    }
  }
}

async function notify(userId, title, message, type, relatedType, relatedId) {
  return prisma.notification.create({
    data: { userId, title, message, type: type || 'info', relatedType: relatedType || null, relatedId: relatedId || null },
  });
}

async function ownedTasks(userId) {
  const rows = await prisma.task.findMany({
    where: { userId },
    orderBy: { dueAt: 'asc' },
    include: { categories: { include: { category: true } } },
  });
  return rows
    .filter((task) => task.recurrence === 'none' || task.parentTaskId)
    .map(mapTask);
}

function taskPriority(value) {
  return value === 'high' || value === 3 ? 3 : value === 'medium' || value === 2 ? 2 : 1;
}

function taskDate(dueDate, startTime) {
  if (!dueDate) return null;
  const value = `${dueDate}${startTime ? `T${startTime}:00` : 'T12:00:00'}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function taskPayload(body, userId, existing = {}) {
  let projectId = existing.projectId ?? null;
  if (body.projectId !== undefined) {
    projectId = body.projectId && Number(body.projectId) > 0 ? Number(body.projectId) : null;
  }
  let goalId = existing.goalId ?? null;
  if (body.goalId !== undefined) {
    goalId = body.goalId && Number(body.goalId) > 0 ? Number(body.goalId) : null;
  }
  return {
    userId,
    title: String(body.title ?? existing.title ?? '').trim(),
    description: body.description ?? existing.description ?? null,
    status: body.completed ? 'completed' : body.status === 'in_progress' ? 'in_progress' : body.status === 'completed' ? 'completed' : existing.status || 'pending',
    priority: taskPriority(body.priority ?? existing.priority),
    dueAt: taskDate(body.dueDate ?? (existing.dueAt && existing.dueAt.toISOString().slice(0, 10)), body.startTime ?? existing.startTime),
    projectId,
    goalId,
    startTime: body.startTime ?? existing.startTime ?? null,
    duration: body.duration ?? existing.duration ?? null,
    recurrence: body.recurrence ?? existing.recurrence ?? 'none',
    recurrenceRule: body.recurrenceRule ?? existing.recurrenceRule ?? null,
    reminderEnabled: body.reminder === undefined ? Boolean(existing.reminderEnabled) : Boolean(body.reminder),
    completedAt: body.completed ? new Date() : null,
  };
}

app.post('/api/ai/interpret', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const message = String(req.body?.message || req.body?.prompt || '').trim();
  if (!message) return res.status(400).json({ message: 'A message is required.' });
  try {
    await materializeRecurrence(userId);
    const existingTasks = await ownedTasks(userId);
    const result = await ai.interpret({
      message,
      timezone: req.body?.timezone,
      existingTasks,
      contacts: req.body?.contacts,
    });
    await prisma.aiMessage.create({ data: { userId, role: 'user', content: message } });
    await prisma.aiMessage.create({
      data: { userId, role: 'assistant', content: result.message || '', actions: JSON.stringify(result) },
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

app.post('/api/ai/transcribe', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const text = await ai.transcribe(req.body?.audio, req.body?.mimeType);
    return res.json({ text });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

app.post('/api/ai/confirm', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const actions = req.body?.tasks || [];
  const reschedule = req.body?.reschedule;
  try {
    const created = [];
    for (const item of actions) {
      const task = await prisma.task.create({
        data: taskPayload({
          title: item.title,
          description: item.description,
          dueDate: item.date,
          startTime: item.startTime,
          duration: item.durationMinutes ? `${Math.round(item.durationMinutes / 60)}h ${item.durationMinutes % 60}m` : item.duration,
          priority: item.priority,
          reminder: Boolean(item.reminder),
          projectId: item.projectId,
        }, userId),
      });
      created.push(mapTask(task));
      if (item.reminder && item.date) {
        await prisma.reminder.create({
          data: {
            userId,
            taskId: task.id,
            title: `Reminder: ${task.title}`,
            remindAt: taskDate(item.date, item.startTime || '09:00'),
            enabled: true,
            status: 'scheduled',
          },
        });
      }
      await notify(userId, 'Task created', task.title, 'task', 'task', task.id);
    }
    if (reschedule?.taskId || reschedule?.titleHint) {
      const existing = reschedule.taskId
        ? await prisma.task.findFirst({ where: { id: Number(reschedule.taskId), userId } })
        : await prisma.task.findFirst({
          where: { userId, title: { contains: String(reschedule.titleHint) } },
        });
      if (existing) {
        await prisma.task.update({
          where: { id: existing.id },
          data: {
            dueAt: taskDate(reschedule.date, reschedule.startTime),
            startTime: reschedule.startTime || existing.startTime,
          },
        });
        await notify(userId, 'Task rescheduled', existing.title, 'schedule', 'task', existing.id);
      }
    }
    return res.json({ created, ok: true });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get('/api/ai/messages', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const messages = await prisma.aiMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 80 });
  res.json({ messages });
});

app.post('/api/ai/schedule', async (req, res) => {
  req.body = { ...req.body, message: req.body?.prompt || req.body?.message };
  const userId = requireUser(req, res);
  if (!userId) return;
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ message: 'A message is required.' });
  try {
    await materializeRecurrence(userId);
    const result = await ai.interpret({
      message,
      timezone: req.body?.timezone,
      existingTasks: await ownedTasks(userId),
      contacts: req.body?.contacts,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const data = taskPayload(req.body ?? {}, userId);
    if (!data.title) return res.status(400).json({ message: 'Task title is required.' });
    const task = await prisma.task.create({ data });
    if (data.reminderEnabled && data.dueAt) {
      await prisma.reminder.create({
        data: { userId, taskId: task.id, title: `Reminder: ${task.title}`, remindAt: data.dueAt, enabled: true, status: 'scheduled' },
      });
    }
    res.status(201).json({ task: mapTask(task) });
  } catch (error) { res.status(400).json({ message: 'Unable to create task.', error: error.message }); }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const existing = await prisma.task.findFirst({ where: { id: Number(req.params.id), userId } });
    if (!existing) return res.status(404).json({ message: 'Task not found.' });
    const task = await prisma.task.update({ where: { id: existing.id }, data: taskPayload(req.body ?? {}, userId, existing) });
    res.json({ task: mapTask(task) });
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
  const existing = await prisma.task.findFirst({ where: { id: Number(req.params.id), userId } });
  if (!existing) return res.status(404).json({ message: 'Task not found.' });
  const completed = Boolean(req.body?.completed);
  if (completed && existing.recurrence !== 'none' && !existing.parentTaskId) {
    const dateKey = schedule.toDateKey(new Date());
    const instance = await prisma.task.findFirst({ where: { parentTaskId: existing.id, occurrenceDate: dateKey } });
    if (instance) {
      await prisma.task.update({ where: { id: instance.id }, data: { status: 'completed', completedAt: new Date() } });
    } else {
      await prisma.task.create({
        data: {
          userId,
          parentTaskId: existing.id,
          title: existing.title,
          description: existing.description,
          status: 'completed',
          priority: existing.priority,
          occurrenceDate: dateKey,
          dueAt: new Date(`${dateKey}T12:00:00.000Z`),
          completedAt: new Date(),
          recurrence: 'none',
        },
      });
    }
    return res.json({ ok: true, seriesRemainsOpen: true });
  }
  await prisma.task.update({
    where: { id: existing.id },
    data: { status: completed ? 'completed' : 'pending', completedAt: completed ? new Date() : null },
  });
  res.json({ ok: true });
});

app.get('/api/dashboard', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    await materializeRecurrence(userId);
    const tasks = await ownedTasks(userId);
    for (const task of tasks.filter((item) => !item.completed && item.dueDate).slice(0, 30)) {
      const due = new Date(`${task.dueDate}T${task.startTime || '09:00'}:00`);
      const hours = (due.getTime() - Date.now()) / 3600000;
      if (hours <= 0 || hours > 48) continue;
      const exists = await prisma.notification.findFirst({
        where: { userId, relatedType: 'task', relatedId: Number(task.id), type: 'deadline' },
      });
      if (!exists) {
        await notify(userId, 'Upcoming deadline', task.title, 'deadline', 'task', Number(task.id));
      }
    }
    res.json({ tasks, recommendation: schedule.recommendNow(tasks), overwhelm: schedule.overwhelmPlan(tasks) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load dashboard tasks.', error: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    await materializeRecurrence(userId);
    res.json({ tasks: await ownedTasks(userId) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load tasks.', error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const project = await prisma.project.findFirst({ where: { id: Number(req.params.id), userId }, include: { tasks: true } });
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const completed = project.tasks.filter((task) => task.status === 'completed').length;
  res.json({
    project: {
      ...project,
      id: String(project.id),
      progress: project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0,
      tasksTotal: project.tasks.length,
      tasksCompleted: completed,
    },
  });
});

app.delete('/api/notifications/:id', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  await prisma.notification.deleteMany({ where: { id: Number(req.params.id), userId } });
  res.json({ ok: true });
});

process.on('uncaughtException', (error) => {
  console.error('ORDINA uncaught exception', error);
});
process.on('unhandledRejection', (error) => {
  console.error('ORDINA unhandled rejection', error);
});
process.on('exit', (code) => {
  console.log(`ORDINA process exiting with code ${code}`);
});

async function start() {
  try {
    await prisma.$connect();
    console.log('ORDINA db: connected');
  } catch (error) {
    console.error('ORDINA db: failed to connect', error);
    process.exitCode = 1;
    return;
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ORDINA backend listening on http://0.0.0.0:${port}`);
  });
}

start();
