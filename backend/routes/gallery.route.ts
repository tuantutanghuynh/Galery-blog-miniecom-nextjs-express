import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';
import * as ctrl from '../controllers/gallery.controller';

const router = Router();

router.get('/', ctrl.list);
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [body('imageUrl').notEmpty(), body('altText').notEmpty(), validate],
  ctrl.create
);
router.get('/:id', ctrl.getById);
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  [body('imageUrl').notEmpty(), body('altText').notEmpty(), validate],
  ctrl.update
);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
