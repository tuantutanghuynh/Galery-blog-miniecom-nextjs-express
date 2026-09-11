const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const ctrl = require('../controllers/category.controller');

router.get('/', ctrl.list);

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [body('name').notEmpty(), body('slug').notEmpty(), validate],
  ctrl.create
);

module.exports = router;
