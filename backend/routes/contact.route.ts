import { Router } from 'express';
import createLimiter from '../utils/rateLimit';
import * as contactController from '../controllers/contact.controller';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';

const router = Router();

// Rate limiter chống spam (Tối đa 5 request / 15 phút từ 1 IP)
const contactLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 15 phút.',
});

// Khách truy cập gửi form (Public)
router.post('/', contactLimiter, contactController.submitContact);

router.use('/admin', authenticate, requireRole('admin'));
router.get('/admin/list', contactController.adminList);
router.patch('/admin/:id/read', contactController.markAsRead);
router.delete('/admin/:id', contactController.remove);

export default router;
