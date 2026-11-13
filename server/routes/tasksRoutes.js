/**
 * Tasks Express Routes (Phase 3)
 */

import { Router } from 'express';
import { tasksController } from '../controllers/tasksController.js';
import { validateCreateTask, validateUpdateTask, validateReorder } from '../middleware/validator.js';

const router = Router();

router.get('/', tasksController.getTasks);
router.post('/', validateCreateTask, tasksController.createTask);
router.post('/reorder', validateReorder, tasksController.reorderTasks);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', validateUpdateTask, tasksController.updateTask);
router.patch('/:id/toggle', tasksController.toggleTask);
router.delete('/:id', tasksController.deleteTask);

export default router;

