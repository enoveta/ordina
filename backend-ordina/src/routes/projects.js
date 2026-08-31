const { Router } = require('express');
const controller = require('../controllers/taskController');
const { authRequired } = require('../middleware/auth');

const projectsRouter = Router();
projectsRouter.use(authRequired);
projectsRouter.get('/', controller.listProjects);
projectsRouter.post('/', controller.createProject);

module.exports = { projectsRouter };
