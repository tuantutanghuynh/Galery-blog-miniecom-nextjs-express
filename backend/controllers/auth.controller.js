const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../services/prisma');
const { signAccessToken } = require('../services/jwt.service');
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/token.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: 'customer' },
  });
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  sendSuccess(res, {
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    accessToken,
    refreshToken,
  }, null, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  sendSuccess(res, {
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    accessToken,
    refreshToken,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(401, 'NO_REFRESH_TOKEN', 'Refresh token không được cung cấp');

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ, bị thu hồi hoặc hết hạn');
  }

  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng');

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  sendSuccess(res, { accessToken, refreshToken: rotated.rawToken });
});

const me = asyncHandler(async (req, res) => {
  // authenticate gán req.user = { id, role } chứ không giữ nguyên payload JWT, nên phải đọc
  // .id. Đọc .sub thì luôn nhận undefined và Prisma ném lỗi -> endpoint 500 với mọi token.
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng');
  sendSuccess(res, { id: user.id, email: user.email, fullName: user.fullName, role: user.role });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return sendSuccess(res, { message: 'Nếu email tồn tại, link reset sẽ được gửi.' });
  }
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}&email=${email}`;
  console.log(`[PASSWORD RESET] ${email}:\n${resetLink}`);
  sendSuccess(res, { message: 'Kiểm tra console/logs để lấy link reset password' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(400, 'INVALID_REQUEST', 'Email không hợp lệ');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.userId !== user.id) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Token reset không hợp lệ');
  }
  if (new Date() > resetToken.expiresAt) {
    throw new ApiError(400, 'EXPIRED_TOKEN', 'Token reset đã hết hạn');
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
  sendSuccess(res, { message: 'Mật khẩu đã được đặt lại thành công' });
});


const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  sendSuccess(res, { message: 'Đăng xuất thành công' });
});

module.exports = { register, login, refresh, logout, me, requestPasswordReset, resetPassword };
