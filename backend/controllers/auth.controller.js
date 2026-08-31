// ==========================================
// 1. IMPORT DEPENDENCIES & UTILITIES
// ==========================================
// IMPORT 'bcrypt' for password hashing
// IMPORT 'prisma' client for database interactions
// IMPORT 'ApiError' utility for standard HTTP errors
// IMPORT 'asyncHandler' utility to automatically catch asynchronous errors
// IMPORT 'sendSuccess' utility to format successful API responses
// IMPORT 'signAccessToken' from JWT service
// IMPORT 'issueRefreshToken', 'rotateRefreshToken', 'revokeRefreshToken' from token service
const bcrypt = require('bcrypt');
const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { signAccessToken } = require('../services/jwt.service');
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/token.service');

// ==========================================
// 2. DEFINE CONTROLLER: REGISTER
// ==========================================
// ASYNC FUNCTION register(req, res) WRAPPED IN asyncHandler:
// Purpose: Creates a new user account with a default "customer" role
const register = asyncHandler(async (req, res) => {
    // Step 1: Extract user input
    // EXTRACT 'email', 'password', and 'fullName' from the request body (req.body)
    const { email, password, fullName } = req.body;

    // Step 2: Check for existing user
    // AWAIT database operation to FIND a user where the email matches the input
    // IF an existing user is found:
    //   THROW a new ApiError (Status: 409, Code: 'EMAIL_TAKEN', Message: 'Email is already in use')
    const existing = await prisma.user.findUnique({ where: { email }});
    if (existing){
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already exist')
    }

    // Step 3: Secure the password
    // AWAIT bcrypt to HASH the 'password' with a salt factor of 10, STORE as 'passwordHash'
    const passwordHash = await bcrypt.hash(password, 10);

    // Step 4: Create the new user
    // AWAIT database operation to CREATE a new user record:
    //   - Set 'email' to the provided email
    //   - Set 'passwordHash' to the hashed password
    //   - Set 'fullName' to the provided full name
    //   - Set 'role' to 'customer' (default)
    // STORE the created record as 'user'
    const user = await prisma.user.create({
        data: { email, passwordHash, fullName, role: 'customer' },
    });

    // Step 5: Send response
    // CALL sendSuccess to return:
    //   - Response object (res)
    //   - Data: { id: user.id, email: user.email, role: user.role }
    //   - Message: null
    //   - HTTP Status: 201 (Created)
    sendSuccess(res, { id: user.id, email: user.email, role: user.role}, null, 201);
})
// END FUNCTION

// ==========================================
// 3. DEFINE CONTROLLER: LOGIN
// ==========================================
// ASYNC FUNCTION login(req, res) WRAPPED IN asyncHandler:
// Purpose: Authenticates a user and issues access & refresh tokens
const login = asyncHandler(async (req, res) => {
    // Step 1: Extract credentials
    // EXTRACT 'email' and 'password' from the request body (req.body)
    const { email, password } = req.body;

    // Step 2: Verify user exists
    // AWAIT database operation to FIND a user by 'email'
    // IF user is NOT found:
    //   THROW a new ApiError (Status: 401, Code: 'INVALID_CREDENTIALS', Message: 'Incorrect email or password')
    const user = await prisma.user.findUnique({ where: { email }});
    if (!user) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    // Step 3: Verify password
    // AWAIT bcrypt to COMPARE the provided 'password' against the stored 'user.passwordHash'
    // IF passwords DO NOT match:
    //   THROW a new ApiError (Status: 401, Code: 'INVALID_CREDENTIALS', Message: 'Incorrect email or password')
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    // Step 4: Generate tokens
    // CALL signAccessToken with payload { sub: user.id, role: user.role } and STORE as 'accessToken'
    // AWAIT issueRefreshToken for 'user.id' and STORE as 'refreshToken'
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id);

    // Step 5: Send response
    // CALL sendSuccess to return the generated 'accessToken', 'refreshToken', and user 'role'
    sendSuccess(res, { accessToken, refreshToken, role: user.role});
});
// END FUNCTION

// ==========================================
// 4. DEFINE CONTROLLER: REFRESH TOKEN
// ==========================================
// ASYNC FUNCTION refresh(req, res) WRAPPED IN asyncHandler:
// Purpose: Issues a new access token and rotates the refresh token
const refresh = asyncHandler(async (req, res) => {
    // Step 1: Extract old refresh token
    // EXTRACT 'refreshToken' from the request body (req.body)
    const { refreshToken } = req.body;

    // Step 2: Attempt token rotation
    // AWAIT rotateRefreshToken using 'refreshToken' and STORE result as 'rotated'
    // IF rotation fails ('rotated' is null/falsy):
    //   THROW a new ApiError (Status: 401, Code: 'INVALID_REFRESH_TOKEN', Message: 'Invalid refresh token')
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
        throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token')
    }

    // Step 3: Fetch user details for new access token payload
    // AWAIT database operation to FIND user by 'id' (using rotated.userId)
    const user = await prisma.user.findUnique({ where: { id: rotated.userId}});

    // Step 4: Generate new access token
    // CALL signAccessToken with payload { sub: user.id, role: user.role } and STORE as 'accessToken'
    const accessToken = signAccessToken({ sub: user.id, role: user.role });

    // Step 5: Send response
    // CALL sendSuccess to return the new 'accessToken' and the newly issued 'refreshToken' (rotated.rawToken)
    sendSuccess(res, { accessToken, refreshToken: rotated.rawToken});
})
// END FUNCTION

// ==========================================
// 5. DEFINE CONTROLLER: LOGOUT
// ==========================================
// ASYNC FUNCTION logout(req, res) WRAPPED IN asyncHandler:
// Purpose: Logs the user out by invalidating their refresh token
const logout = asyncHandler(async (req, res) => {
    // Step 1: Extract refresh token
    // EXTRACT 'refreshToken' from the request body (req.body)
    const { refreshToken } =  req.body;

    // Step 2: Revoke token
    // AWAIT revokeRefreshToken using the provided 'refreshToken'
    await revokeRefreshToken(refreshToken);

    // Step 3: Send response
    // CALL sendSuccess to return a message: 'Logged out successfully'
    sendSuccess(res, { message: "Logged out"});
});
// END FUNCTION

// ==========================================
// 6. EXPORT MODULE
// ==========================================
// EXPORT the 'register', 'login', 'refresh', and 'logout' functions to be used as route handlers
module.exports = { register, login, refresh, logout}