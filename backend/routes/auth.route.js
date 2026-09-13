// ==========================================
// 1. IMPORT DEPENDENCIES & CONTROLLERS
// ==========================================
// IMPORT the 'Router' module from the 'express' library and INITIALIZE it as 'router'
// IMPORT the 'body' validation function from the 'express-validator' library
// IMPORT the custom 'validate' middleware (used to check validation results)
// IMPORT the authentication controller functions (register, login, refresh, logout) as 'ctrl'
const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const ctrl = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

// Rate limiter chống Brute-force (Tối đa 5 lần thử sai / 15 phút từ 1 IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  }
});

// ==========================================
// 2. DEFINE ROUTE: REGISTER
// ==========================================
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Mật khẩu phải dài ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'),
    validate
  ],
  ctrl.register
);

// ==========================================
// 3. DEFINE ROUTE: LOGIN
// ==========================================
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').notEmpty(), validate],
  ctrl.login
);

// ==========================================
// 4. DEFINE ROUTE: REFRESH TOKEN
// ==========================================
router.post('/refresh', ctrl.refresh);

// ==========================================
// 5. DEFINE ROUTE: LOGOUT
// ==========================================
router.post('/logout', ctrl.logout);

// ==========================================
// 6. DEFINE ROUTE: CHANGE PASSWORD
// ==========================================
router.post(
  '/change-password',
  authLimiter,
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
    body('newPassword')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Mật khẩu mới phải dài ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'),
    validate
  ],
  ctrl.changePassword
);

// ==========================================
// 7. EXPORT MODULE
// ==========================================
module.exports = router;
