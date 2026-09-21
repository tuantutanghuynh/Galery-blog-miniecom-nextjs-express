const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const ctrl = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Mật khẩu phải ít nhất 8 ký tự')
      .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ hoa')
      .matches(/[a-z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ thường')
      .matches(/[0-9]/).withMessage('Mật khẩu phải chứa ít nhất một chữ số')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Mật khẩu phải chứa ít nhất một ký tự đặc biệt'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password).withMessage('Xác nhận mật khẩu không khớp'),
    body('fullName').optional().trim().notEmpty(),
    validate,
  ],
  ctrl.register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate],
  ctrl.login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty(), validate],
  ctrl.refresh
);

router.get('/me', authenticate, ctrl.me);

router.post(
  '/request-password-reset',
  [body('email').isEmail().normalizeEmail(), validate],
  ctrl.requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('token').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Mật khẩu phải ít nhất 8 ký tự')
      .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ hoa')
      .matches(/[a-z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ thường')
      .matches(/[0-9]/).withMessage('Mật khẩu phải chứa ít nhất một chữ số')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Mật khẩu phải chứa ít nhất một ký tự đặc biệt'),
    validate,
  ],
  ctrl.resetPassword
);

module.exports = router;
