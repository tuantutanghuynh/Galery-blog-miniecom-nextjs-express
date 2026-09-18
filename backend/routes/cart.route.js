const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const resolveBrand = require('../middlewares/resolveBrand');
const ctrl = require('../controllers/cart.controller');

// Cart routes. Every endpoint needs both a logged-in user and a brand, so the two middlewares are
// applied to the whole router rather than repeated on each line.
router.use(authenticate, resolveBrand);

router.get('/', ctrl.getCart);

// Quantity is capped at 99 per line. Without an upper bound a typo (or a script) could post a
// quantity large enough that `price * quantity` overflows the Int column at checkout.
router.post(
  '/items',
  [body('variantId').notEmpty(), body('quantity').optional().isInt({ min: 1, max: 99 }), validate],
  ctrl.addItem
);

router.patch(
  '/items/:id',
  [body('quantity').isInt({ min: 1, max: 99 }), validate],
  ctrl.updateItem
);

router.delete('/items/:id', ctrl.removeItem);

module.exports = router;
