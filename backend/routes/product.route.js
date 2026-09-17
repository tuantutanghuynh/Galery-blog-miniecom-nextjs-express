const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const ctrl = require('../controllers/product.controller');
const { PRODUCT_STATUS_VALUES } = require('../constants/product');

// Routes for the product catalogue. Public endpoints serve the storefront and need no token;
// everything that writes sits behind `authenticate` + `requireRole('admin')`.

// `/admin/list` is declared before `/:slug` on purpose. Express matches routes in order, so with
// the reverse order the literal word "admin" would be captured as a product slug and the admin
// listing would answer 404 instead.
router.get('/', ctrl.list);
router.get('/admin/list', authenticate, requireRole('admin'), ctrl.adminList);
router.get('/:slug', ctrl.getBySlug);

// Prices are validated as integers because the column is `Int` and money is never stored as a
// float. `isInt({ min: 0 })` also rejects the string "12000" silently becoming NaN later, and
// blocks negative prices that would make an order total smaller than it should be.
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [
    body('categoryId').notEmpty(),
    body('name').notEmpty(),
    body('slug').notEmpty(),
    body('status').optional().isIn(PRODUCT_STATUS_VALUES),
    body('variants').isArray({ min: 1 }).withMessage('Sản phẩm phải có ít nhất một biến thể'),
    body('variants.*.sku').notEmpty(),
    body('variants.*.price').isInt({ min: 0 }),
    body('variants.*.compareAtPrice').optional({ nullable: true }).isInt({ min: 0 }),
    body('variants.*.stockQuantity').optional().isInt({ min: 0 }),
    body('images').optional().isArray(),
    body('images.*.url').optional().notEmpty(),
    validate,
  ],
  ctrl.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  [body('status').optional().isIn(PRODUCT_STATUS_VALUES), validate],
  ctrl.update
);

router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
