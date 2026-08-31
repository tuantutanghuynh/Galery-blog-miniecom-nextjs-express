// ==========================================
// 1. IMPORT DEPENDENCIES
// ==========================================
// IMPORT the built-in 'crypto' library (for cryptographic functions)
// IMPORT the local 'prisma' client (for database operations)
const crypto = require('crypto');
const prisma = require('./prisma');

// ==========================================
// 2. DEFINE CONSTANTS
// ==========================================
// DEFINE CONSTANT REFRESH_TOKEN_TTL_MS AND SET it to 7 days in milliseconds (7 * 24 * 60 * 60 * 1000)
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; //7 NGÀY

// ==========================================
// 3. DEFINE UTILITY FUNCTION: HASH TOKEN
// ==========================================
// FUNCTION hashToken(rawToken):
// Purpose: Creates a secure hash of the raw token before storing it in the database
function hashToken(rawToken) {
    // CREATE a SHA-256 hash object
    // UPDATE the hash object with the 'rawToken'
    // RETURN the resulting hash as a hexadecimal string
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}
// END FUNCTION

// ==========================================
// 4. DEFINE FUNCTION: ISSUE NEW REFRESH TOKEN
// ==========================================
// ASYNC FUNCTION issueRefreshToken(userId):
// Purpose: Generates a new secure refresh token and saves its hash to the database
async function issueRefreshToken(userId) {
    // GENERATE a cryptographically strong random string of 40 bytes
    // CONVERT the random bytes to a hexadecimal string and STORE as 'rawToken'
    const rawToken = crypto.randomBytes(40).toString('hex');
    // CALCULATE the expiration date (current time + REFRESH_TOKEN_TTL_MS)
    // AWAIT database operation to CREATE a new 'refreshToken' record:
    //   - Set 'userId' to the provided user ID
    //   - Set 'tokenHash' to the result of hashToken(rawToken)
    //   - Set 'expiresAt' to the calculated expiration date
    await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        }
    });
    // Note: We return the plain text token to the user, but only store the hash
    // RETURN rawToken
    return rawToken;
}
// END FUNCTION

// ==========================================
// 5. DEFINE FUNCTION: ROTATE REFRESH TOKEN
// ==========================================
// ASYNC FUNCTION rotateRefreshToken(rawToken):
// Purpose: Replaces an old, valid refresh token with a new one (Token Rotation)
async function rotateRefreshToken(rawToken) {
    // HASH the provided 'rawToken' to get 'tokenHash'
    const tokenHash = hashToken(rawToken);
    // AWAIT database operation to FIND the FIRST 'refreshToken' record where:
    //   - The token hash matches 'tokenHash'
    //   - The token has NOT been revoked ('revokedAt' is null)
    //   - The token has NOT expired ('expiresAt' is greater than current time)
    const record = await prisma.refreshToken.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });
    // IF no matching record is found:
    //   RETURN null // The caller will handle this (e.g., return a 401 Unauthorized error)
    if (!record) 
        return null;

    // If valid, invalidate the old token
    // AWAIT database operation to UPDATE the found record:
    //   - Set 'revokedAt' to the current time
    await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
    });
    // Issue a completely new token for the user
    // AWAIT issueRefreshToken(record.userId) and STORE result as 'newRawToken'
    const newRawToken =  await issueRefreshToken(record.userId);
    // RETURN an object containing { userId, rawToken: newRawToken }
    return { userId: record.userId, rawToken: newRawToken}
}
// END FUNCTION

// ==========================================
// 6. DEFINE FUNCTION: REVOKE REFRESH TOKEN
// ==========================================
// ASYNC FUNCTION revokeRefreshToken(rawToken):
// Purpose: Manually invalidates a refresh token (e.g., for logging out)
async function revokeRefreshToken(rawToken) {
    // HASH the provided 'rawToken' to get 'tokenHash'
    const tokenHash = hashToken(rawToken);
    // AWAIT database operation to UPDATE ALL 'refreshToken' records where:
    //   - The token hash matches 'tokenHash'
    //   - The token has NOT been revoked yet ('revokedAt' is null)
    // WITH the following change:
    //   - Set 'revokedAt' to the current time
    await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date()},
    });
}
// END FUNCTION

// ==========================================
// 7. EXPORT FUNCTIONS
// ==========================================
// EXPORT issueRefreshToken, rotateRefreshToken, AND revokeRefreshToken for use in other files
module.exports = { issueRefreshToken, rotateRefreshToken, revokeRefreshToken}