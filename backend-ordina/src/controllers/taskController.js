const { success } = require('../utils/apiResponse');
const taskService = require('../services/taskService');

async function list(req, res, next) {
  try {
    return success(res, { tasks: await taskService.listTasks(req.userId) });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    return success(res, { task: await taskService.createTask(req.userId, req.body) }, 201);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    return success(res, { task: await taskService.updateTask(req.userId, req.params.id, req.body) });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    await taskService.deleteTask(req.userId, req.params.id);
    return success(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    return success(res, { task: await taskService.getTask(req.userId, req.params.id) });
  } catch (error) {
    return next(error);
  }
}

async function listProjects(req, res, next) {
  try {
    return success(res, { projects: await taskService.listProjects(req.userId) });
  } catch (error) {
    return next(error);
  }
}

async function getProject(req, res, next) {
  try {
    return success(res, { project: await taskService.getProject(req.userId, req.params.id) });
  } catch (error) {
    return next(error);
  }
}

async function createProject(req, res, next) {
  try {
    return success(res, { project: await taskService.createProject(req.userId, req.body) }, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    return success(res, { project: await taskService.updateProject(req.userId, req.params.id, req.body) });
  } catch (error) {
    return next(error);
  }
}

async function removeProject(req, res, next) {
  try {
    await taskService.deleteProject(req.userId, req.params.id);
    return success(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  listProjects,
  getProject,
  createProject,
  updateProject,
  removeProject,
};
