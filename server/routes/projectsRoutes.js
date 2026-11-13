/**
 * Projects Express Routes (Phase 3)
 */

import { Router } from 'express';
import { projectsController } from '../controllers/projectsController.js';

const router = Router();

router.get('/', projectsController.getProjects);

export default router;

