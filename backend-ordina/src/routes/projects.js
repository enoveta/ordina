const { Router } = require('express');
const controller = require('../controllers/taskController');
const { authRequired } = require('../middleware/auth');

const projectsRouter = Router();
projectsRouter.use(authRequired);
projectsRouter.get('/', controller.listProjects);
projectsRouter.get('/:id', controller.getProject);
projectsRouter.post('/', controller.createProject);
projectsRouter.patch('/:id', controller.updateProject);
projectsRouter.delete('/:id', controller.removeProject);

module.exports = { projectsRouter };
