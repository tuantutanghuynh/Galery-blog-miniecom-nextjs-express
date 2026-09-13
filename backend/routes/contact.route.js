const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const rateLimit = require('express-rate-limit');

// Rate limiter chống spam (Tối đa 5 request / 15 phút từ 1 IP)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 15 phút.'
  }
});

// Khách truy cập gửi form (Public)
router.post('/', contactLimiter, contactController.submitContact);

router.use('/admin', authenticate, requireRole('admin'));
router.get('/admin/list', contactController.adminList);
router.patch('/admin/:id/read', contactController.markAsRead);
router.delete('/admin/:id', contactController.remove);

module.exports = router;
