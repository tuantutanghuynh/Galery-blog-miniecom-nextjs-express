import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import authenticate from '../middlewares/authenticate';
import resolveBrand from '../middlewares/resolveBrand';
import * as ctrl from '../controllers/cart.controller';

const router = Router();

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

export default router;
