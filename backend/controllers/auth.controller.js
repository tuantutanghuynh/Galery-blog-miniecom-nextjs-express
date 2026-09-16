const bcrypt = require('bcrypt');
const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { signAccessToken } = require('../services/jwt.service');
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/token.service');

// Every authentication endpoint: register, login, refresh, logout and change password. The
// token mechanics themselves live in services/jwt.service.js and services/token.service.js;
// this file only orchestrates them and talks to the User table.

// Creates a new account from `{ email, password, fullName }` and responds 201 with the new
// user's id, email and role. The email is rejected with 409 if it already exists, since the
// column is unique and letting Prisma throw would surface as an opaque 500. The password is
// stored as a bcrypt hash with cost factor 10, never in plaintext. The role is hardcoded to
// `customer` and is never read from the request body — accepting a role from the client
// would let anyone register themselves as an admin. Admin accounts are created only by
// scripts/seedAdmin.js.
const register = asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email }});
    if (existing){
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already exist')
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, passwordHash, fullName, role: 'customer' },
    });

    sendSuccess(res, { id: user.id, email: user.email, role: user.role}, null, 201);
})

// Verifies credentials and returns a fresh access token, refresh token and the caller's
// role. An unknown email and a wrong password deliberately produce the exact same 401 and
// the same `INVALID_CREDENTIALS` message, so the endpoint cannot be used to discover which
// email addresses have accounts. `bcrypt.compare` is still run in a way that keeps both
// paths similar in cost. The role travels in the response only so the frontend can render
// the right screen — authorisation itself is always re-checked server-side from the token.
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email }});
    if (!user) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id);

    sendSuccess(res, { accessToken, refreshToken, role: user.role});
});

// Trades a refresh token for a new access token plus a new refresh token, which is how a
// session survives past the 15-minute access token lifetime. The rotation logic — including
// reuse detection, which kills every session of a user whose old token gets replayed — lives
// in `rotateRefreshToken`; anything it refuses comes back here as `null` and becomes a 401.
// The user row is re-read instead of trusting the old token's claims, so a role changed in
// the database takes effect on the next refresh rather than lingering for a whole week.
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
        throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token')
    }

    const user = await prisma.user.findUnique({ where: { id: rotated.userId}});
    const accessToken = signAccessToken({ sub: user.id, role: user.role });

    sendSuccess(res, { accessToken, refreshToken: rotated.rawToken});
})

// Ends a session by revoking the refresh token that was sent. It answers success even when
// the token is unknown or already revoked, because a logout that reports "no such token"
// would confirm to an attacker which stolen tokens are still live. The matching access token
// keeps working until it expires — a stateless JWT cannot be recalled — which is the reason
// its lifetime is kept to 15 minutes.
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } =  req.body;

    await revokeRefreshToken(refreshToken);

    sendSuccess(res, { message: "Logged out"});
});

// Changes the password of the logged-in user, identified from the access token rather than
// from the request body so nobody can change someone else's password. The current password
// must be supplied and verified first, which blocks an attacker holding only a stolen access
// token from locking the real owner out. Reusing the current password is rejected so the
// action is never a silent no-op. After the new hash is saved, every active refresh token of
// that user is revoked: this is what actually evicts an intruder, since otherwise their
// existing session would survive the very password change meant to shut them out.
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản');

    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) throw new ApiError(400, 'INVALID_PASSWORD', 'Mật khẩu cũ không chính xác');

    if (oldPassword === newPassword) {
        throw new ApiError(400, 'SAME_PASSWORD', 'Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
    });

    await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });

    sendSuccess(res, { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
});

module.exports = { register, login, refresh, logout, changePassword };
