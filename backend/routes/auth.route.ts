import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import authenticate from '../middlewares/authenticate';
import createLimiter from '../utils/rateLimit';
import * as ctrl from '../controllers/auth.controller';

const router = Router();

// Chặn dò mật khẩu: chỉ đếm lần đăng nhập sai, nên người nhập đúng không bao giờ bị khoá oan,
// còn kẻ thử mật khẩu bị chặn sau 10 lần sai trong 15 phút.
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

// Đăng ký và đặt lại mật khẩu đếm cả lần thành công: "quên mật khẩu" luôn trả 200 nên nếu chỉ
// đếm lần lỗi thì bot gửi được vô hạn thư vào hộp thư người khác.
const accountLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

// Client gửi JSON nên mật khẩu hay token có thể là số, mảng, object. Chặn từ cửa: bcrypt và
// crypto ném lỗi khi nhận thứ không phải chuỗi, và lỗi đó thành 500.
const isText = (field: string) =>
  body(field).custom((value) => typeof value === 'string').withMessage('Dữ liệu không hợp lệ').bail();

const passwordRules = (field: string) =>
  isText(field)
    .isLength({ min: 8 }).withMessage('Mật khẩu phải ít nhất 8 ký tự')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ hoa')
    .matches(/[a-z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ thường')
    .matches(/[0-9]/).withMessage('Mật khẩu phải chứa ít nhất một chữ số')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');

router.post(
  '/register',
  accountLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    passwordRules('password'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password).withMessage('Xác nhận mật khẩu không khớp'),
    body('fullName').optional().isString().trim().notEmpty(),
    validate,
  ],
  ctrl.register
);

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), isText('password').notEmpty(), validate],
  ctrl.login
);

router.post(
  '/refresh',
  [isText('refreshToken').notEmpty(), validate],
  ctrl.refresh
);

// Không đặt sau `authenticate`: access token chỉ sống 15 phút, mà người dùng vẫn phải đăng
// xuất được sau khi nó hết hạn. Thiếu refreshToken cũng không coi là lỗi — client đã xoá
// token phía nó rồi, gọi lại lần nữa vẫn phải thành công.
router.post('/logout', ctrl.logout);

router.get('/me', authenticate, ctrl.me);

router.post(
  '/request-password-reset',
  accountLimiter,
  [body('email').isEmail().normalizeEmail(), validate],
  ctrl.requestPasswordReset
);

router.post(
  '/reset-password',
  accountLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    isText('token').notEmpty(),
    passwordRules('newPassword'),
    validate,
  ],
  ctrl.resetPassword
);

export default router;
