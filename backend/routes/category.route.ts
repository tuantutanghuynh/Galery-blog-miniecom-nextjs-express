import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';
import * as ctrl from '../controllers/category.controller';

const router = Router();

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

export default router;
