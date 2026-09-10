const { prisma } = require('../config/prisma');

function mapTask(task) {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description || '',
    status: task.status === 'pending' ? 'todo' : task.status,
    priority: task.priority,
    category: task.category,
    projectId: task.projectId ? String(task.projectId) : undefined,
    dueDate: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : undefined,
    startTime: task.startTime || undefined,
    endTime: task.endTime || undefined,
    duration: task.duration || undefined,
    reminder: task.reminder,
    completed: task.status === 'completed' || Boolean(task.completedAt),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function toDueAt(dueDate) {
  if (!dueDate) return null;
  const date = new Date(`${dueDate}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fromClient(body) {
  const completed = Boolean(body.completed) || body.status === 'completed';
  return {
    title: body.title,
    description: body.description,
    status: completed ? 'completed' : body.status === 'in_progress' ? 'in_progress' : 'pending',
    priority: body.priority || 'medium',
    category: body.category || 'work',
    projectId: (() => {
      const pid = Number(body.projectId);
      return Number.isInteger(pid) && pid > 0 ? pid : null;
    })(),
    dueAt: toDueAt(body.dueDate),
    startTime: body.startTime || null,
    endTime: body.endTime || null,
    duration: body.duration || null,
    reminder: Boolean(body.reminder),
    completedAt: completed ? new Date() : null,
  };
}

async function listTasks(userId) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  });
  return tasks.map(mapTask);
}

async function createTask(userId, body) {
  if (!body.title || !String(body.title).trim()) {
    const error = new Error('Task title is required');
    error.status = 422;
    throw error;
  }
  const task = await prisma.task.create({
    data: { userId, ...fromClient(body) },
  });
  return mapTask(task);
}

async function updateTask(userId, id, body) {
  const existing = await prisma.task.findFirst({ where: { id: Number(id), userId } });
  if (!existing) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: fromClient({ ...mapTask(existing), ...body }),
  });
  return mapTask(task);
}

async function deleteTask(userId, id) {
  const existing = await prisma.task.findFirst({ where: { id: Number(id), userId } });
  if (!existing) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }
  await prisma.task.delete({ where: { id: existing.id } });
}

async function getTask(userId, id) {
  const task = await prisma.task.findFirst({ where: { id: Number(id), userId } });
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }
  return mapTask(task);
}

async function listProjects(userId) {
  return prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

async function getProject(userId, id) {
  const project = await prisma.project.findFirst({
    where: { id: Number(id), userId },
    include: { tasks: true },
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  return project;
}

async function createProject(userId, body) {
  if (!body.name || !String(body.name).trim()) {
    const error = new Error('Project name is required');
    error.status = 422;
    throw error;
  }
  return prisma.project.create({
    data: {
      userId,
      name: body.name.trim(),
      subtitle: body.subtitle ? String(body.subtitle).trim() : null,
      progress: body.progress ? Number(body.progress) : 0,
      color: body.color || '#8B5CF6',
    },
  });
}

async function updateProject(userId, id, body) {
  const existing = await prisma.project.findFirst({ where: { id: Number(id), userId } });
  if (!existing) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  const data = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.subtitle !== undefined) data.subtitle = body.subtitle ? String(body.subtitle).trim() : null;
  if (body.progress !== undefined) data.progress = Number(body.progress);
  if (body.color !== undefined) data.color = body.color;
  if (body.tasksTotal !== undefined) data.tasksTotal = Number(body.tasksTotal);
  if (body.tasksCompleted !== undefined) data.tasksCompleted = Number(body.tasksCompleted);
  if (body.tasksOverdue !== undefined) data.tasksOverdue = Number(body.tasksOverdue);
  return prisma.project.update({ where: { id: existing.id }, data });
}

async function deleteProject(userId, id) {
  const existing = await prisma.project.findFirst({ where: { id: Number(id), userId } });
  if (!existing) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  await prisma.project.delete({ where: { id: existing.id } });
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
