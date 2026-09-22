import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';
import * as ctrl from '../controllers/blog.controller';

const router = Router();

router.get('/', ctrl.list);
router.get('/admin/list', authenticate, requireRole('admin'), ctrl.adminList);
router.get('/:slug', ctrl.getBySlug);

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [
    body('title').notEmpty(),
    body('slug').notEmpty(),
    body('content').notEmpty(),
    body('status').optional().isIn(['draft', 'published']),
    validate,
  ],
  ctrl.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  [body('status').optional().isIn(['draft', 'published']), validate],
  ctrl.update
);

router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
