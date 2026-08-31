// ==========================================
// 1. IMPORT DEPENDENCIES
// ==========================================
// IMPORT the custom 'ApiError' utility class (for standardized error handling)
// IMPORT the 'verifyAccessToken' function from the local JWT service
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../services/jwt.service');

// ==========================================
// 2. DEFINE AUTHENTICATION MIDDLEWARE
// ==========================================
// FUNCTION authenticate(req, res, next):
// Purpose: Express middleware to protect routes by verifying the user's access token
function authenticate(req, res, next) {
    // Step 1: Extract the Authorization header
    // GET the 'authorization' header from the incoming request (req)
    // IF the header does not exist, SET it to an empty string
    const header = req.headers.authorization || '';

    // Step 2: Parse the header
    // SPLIT the header string into two variables: 'scheme' and 'token'
    // Note: The code attempts to split it, usually expecting a format like "Bearer <token_string>"
    const [scheme, token] = header.split(' ');

    // Step 3: Validate the token format
    // IF 'scheme' is NOT equal to "Bearer" OR if 'token' is empty/missing:
    //   CREATE a new ApiError (Status: 401, Code: 'UNAUTHENTICATED', Message: 'Missing access token')
    //   PASS the error to the 'next' function to trigger the error handler
    //   RETURN immediately to stop further execution
    if (scheme !== 'Bearer' || !token) {
        return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing access token'))
    }

    // Step 4: Verify the token and authorize the user
    // TRY:
    try {
        // Attempt to verify the signature and expiration
        // CALL verifyAccessToken(token) and STORE the returned data as 'payload'
        const payload = verifyAccessToken(token);

        // Attach the decoded user information to the request object for downstream use
        // CREATE a 'user' object on 'req' containing:
        //   - id: payload.sub (the subject/user ID from the token)
        //   - role: payload.role (the user's permission level from the token)
        req.user = { id: payload.sub, role: payload.role };

        // Move to the next middleware or route handler in the application
        // CALL next()
        next();
    } catch {
        // CATCH any errors (e.g., token is fake, modified, or expired):
        //   CREATE a new ApiError (Status: 401, Code: 'UNAUTHENTICATED', Message: 'Access token is invalid or expired')
        //   PASS the error to the 'next' function to trigger the error handler
        next(new ApiError(401, 'UNAUTHENTICATED', 'Access token is invalid or expired'))
    }
}
// END FUNCTION

// ==========================================
// 3. EXPORT MODULE
// ==========================================
// EXPORT the 'authenticate' function so it can be used to protect routes in other files
module.exports = authenticate;