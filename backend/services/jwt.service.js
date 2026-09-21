const jwt = require('jsonwebtoken');
const { jwtAccessSecret, jwtRefreshSecret } = require('../config/env');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

// Signs a payload — `{ sub, role }` in this project — into an access token valid for 15
// minutes. The TTL is deliberately short because a stateless JWT cannot be revoked once
// issued: a stolen token stays usable until it expires, so the window is kept small and the
// refresh-token rotation in token.service.js handles long-lived sessions instead. Keeping
// the role inside the payload lets requireRole authorise a request without a database read.
function signAccessToken(payload) {
    return jwt.sign(payload, jwtAccessSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

// Verifies a token's signature and expiry and returns its decoded payload. It deliberately
// does not catch anything: `jsonwebtoken` throws `TokenExpiredError` or `JsonWebTokenError`
// on failure, and the caller — middlewares/authenticate.js — converts both into the same
// 401 so the client cannot distinguish an expired token from a forged one. Callers must
// therefore always wrap this in try/catch rather than checking a return value.
function verifyAccessToken(token) {
    return jwt.verify(token, jwtAccessSecret);
}

function signRefreshToken(payload) {
    return jwt.sign(payload, jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyRefreshToken(token) {
    return jwt.verify(token, jwtRefreshSecret);
}

module.exports = { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken };
