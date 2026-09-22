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

// Thuộc tính của danh mục: đọc công khai vì trang sản phẩm cần nhãn để vẽ bảng thông số,
// còn thêm và xoá thì chỉ admin.
router.get('/:id/attributes', ctrl.listAttributes);
router.post('/:id/attributes', authenticate, requireRole('admin'), ctrl.createAttribute);
router.delete('/:id/attributes/:attributeId', authenticate, requireRole('admin'), ctrl.removeAttribute);

module.exports = router;
