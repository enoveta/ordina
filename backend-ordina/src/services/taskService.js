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

async function listProjects(userId) {
  return prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

async function createProject(userId, body) {
  return prisma.project.create({
    data: {
      userId,
      name: body.name,
      subtitle: body.subtitle,
      progress: body.progress || 0,
      color: body.color || '#8B5CF6',
    },
  });
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listProjects,
  createProject,
};
