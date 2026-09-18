const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const resolveBrand = require('../middlewares/resolveBrand');
const ctrl = require('../controllers/order.controller');
const { PAYMENT_METHOD, ORDER_STATUS, PAYMENT_STATUS } = require('../constants/order');

// Order routes. Every endpoint needs a logged-in user and a brand; admin endpoints add a role check
// on top. Note that admin routes are declared before `/:code`, otherwise the literal word "admin"
// would be captured as an order code.
router.use(authenticate, resolveBrand);

// The shipping address is validated field by field rather than accepted as a free-form object,
// because it is snapshotted into the order and cannot be corrected afterwards without editing a
// historical record. A missing phone number here becomes a parcel nobody can deliver.
router.post(
  '/',
  [
    body('paymentMethod').isIn([PAYMENT_METHOD.BANK_TRANSFER, PAYMENT_METHOD.COD]),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Thiếu họ tên người nhận'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Thiếu số điện thoại'),
    body('shippingAddress.addressLine').trim().notEmpty().withMessage('Thiếu địa chỉ'),
    body('shippingAddress.city').trim().notEmpty().withMessage('Thiếu tỉnh/thành phố'),
    body('note').optional({ nullable: true }).isLength({ max: 500 }),
    validate,
  ],
  ctrl.createOrder
);

router.get('/', ctrl.listMyOrders);

router.get('/admin/list', requireRole('admin'), ctrl.adminList);
router.patch('/admin/:id/confirm-payment', requireRole('admin'), ctrl.confirmPayment);
router.patch('/admin/:id/cancel', requireRole('admin'), ctrl.cancelOrder);

router.get('/:code', ctrl.getMyOrder);

module.exports = router;
