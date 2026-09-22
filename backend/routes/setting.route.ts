import { Router } from 'express';
import * as ctrl from '../controllers/setting.controller';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';

const router = Router();

// Bất kỳ ai cũng có thể đọc cấu hình (để hiển thị lên web)
router.get('/', ctrl.getSettings);

// Chỉ Admin mới được phép sửa cấu hình
router.patch('/', authenticate, requireRole('admin'), ctrl.updateSettings);

export default router;
