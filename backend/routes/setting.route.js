const router = require('express').Router();
const ctrl = require('../controllers/setting.controller');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');

// Bất kỳ ai cũng có thể đọc cấu hình (để hiển thị lên web)
router.get('/', ctrl.getSettings);

// Chỉ Admin mới được phép sửa cấu hình
router.patch('/', authenticate, requireRole('admin'), ctrl.updateSettings);

module.exports = router;
