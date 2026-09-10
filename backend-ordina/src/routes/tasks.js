const { Router } = require('express');
const controller = require('../controllers/taskController');
const { authRequired } = require('../middleware/auth');

const tasksRouter = Router();
tasksRouter.use(authRequired);
tasksRouter.get('/', controller.list);
tasksRouter.get('/:id', controller.getOne);
tasksRouter.post('/', controller.create);
tasksRouter.patch('/:id', controller.update);
tasksRouter.delete('/:id', controller.remove);

module.exports = { tasksRouter };
