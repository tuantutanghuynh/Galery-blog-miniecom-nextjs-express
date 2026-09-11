const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const ctrl = require('../controllers/blog.controller');

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

module.exports = router;
