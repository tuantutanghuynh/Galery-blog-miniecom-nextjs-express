const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const ctrl = require('../controllers/gallery.controller');

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

module.exports = router;
