const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const resolveBrand = require('../middlewares/resolveBrand');
const ctrl = require('../controllers/quoteRequest.controller');

// Mọi endpoint ở đây đều cần biết yêu cầu thuộc storefront nào, kể cả đường công khai — nếu
// không thì khi storefront thứ hai chạy, hai bên sẽ đọc lẫn yêu cầu của nhau.
router.use(resolveBrand);

// Rộng tay hơn form liên hệ (5 lượt) vì khách hỏi giá nhiều món trong một buổi là bình thường,
// nhưng vẫn đủ chặt để một con bot không đổ rác vào danh sách nhân viên phải gọi.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  },
});

router.post('/', submitLimiter, ctrl.submit);

router.use('/admin', authenticate, requireRole('admin'));
router.get('/admin/list', ctrl.adminList);
router.get('/admin/stats', ctrl.stats);
router.patch('/admin/:id/status', ctrl.updateStatus);
router.delete('/admin/:id', ctrl.remove);

module.exports = router;
