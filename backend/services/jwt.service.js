// ==========================================
// 1. IMPORT DEPENDENCIES & CONFIGURATION
// ==========================================
// IMPORT the 'jsonwebtoken' library as 'jwt'
// IMPORT 'jwtAccessSecret' from the local environment configuration file ('../config/env')
const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config/env');

// ==========================================
// 2. DEFINE CONSTANTS
// ==========================================
// DEFINE CONSTANT ACCESS_TOKEN_TTL AND SET it to "15m" (15 minutes)
const ACCESS_TOKEN_TTL = '15m';

// ==========================================
// 3. DEFINE TOKEN GENERATION FUNCTION
// ==========================================
// FUNCTION signAccessToken(payload):
// Purpose: Creates a new signed access token containing the user's data (payload)
function signAccessToken(payload) {
    // GENERATE a new token using jwt library's signing algorithm:
    //   - Data to encode: payload
    //   - Secret key: jwtAccessSecret
    //   - Options: Set token expiration time to ACCESS_TOKEN_TTL (15 minutes)
    // RETURN the generated token string
    return jwt.sign(payload, jwtAccessSecret, { expiresIn: ACCESS_TOKEN_TTL });
}
// END FUNCTION

// ==========================================
// 4. DEFINE TOKEN VERIFICATION FUNCTION
// ==========================================
// FUNCTION verifyAccessToken(token):
// Purpose: Checks if the provided token is valid and has not expired
function verifyAccessToken(token) {
    // ATTEMPT to verify the token using jwt library's verification algorithm:
    //   - Token to check: token
    //   - Secret key: jwtAccessSecret
    // Note: If the token is invalid, tampered with, or expired,
    // the library will automatically throw a 'JsonWebTokenError' or 'TokenExpiredError'.
    // RETURN the decoded payload if the verification is successful
    return jwt.verify(token, jwtAccessSecret); // throws JsonWebTokenError/TokenExpiredError nếu invalid/expired
}
// END FUNCTION

// ==========================================
// 5. EXPORT FUNCTIONS
// ==========================================
module.exports = { signAccessToken, verifyAccessToken };