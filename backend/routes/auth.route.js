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
const ctrl = require('../controllers/auth.controller');

// ==========================================
// 2. DEFINE ROUTE: REGISTER
// ==========================================
// DEFINE a POST route at the endpoint '/register'
//   ATTACH Middleware 1 (Validation Rules):
//     - Check if the 'email' field in the request body is a valid email format
//     - Check if the 'password' field in the request body has a minimum length of 6 characters
//   ATTACH Middleware 2 (Validation Handler):
//     - Run the custom 'validate' middleware to process any validation errors caught above
//   ATTACH Controller:
//     - Execute the 'ctrl.register' function to handle the account creation logic
router.post(
  '/register',
  [body('email').isEmail(), body('password').isLength({ min: 6 }), validate],
  ctrl.register
);

// ==========================================
// 3. DEFINE ROUTE: LOGIN
// ==========================================
// DEFINE a POST route at the endpoint '/login'
//   ATTACH Middleware 1 (Validation Rules):
//     - Check if the 'email' field in the request body is a valid email format
//     - Check if the 'password' field in the request body is not empty
//   ATTACH Middleware 2 (Validation Handler):
//     - Run the custom 'validate' middleware to process any validation errors caught above
//   ATTACH Controller:
//     - Execute the 'ctrl.login' function to authenticate the user and issue tokens
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty(), validate],
  ctrl.login
);

// ==========================================
// 4. DEFINE ROUTE: REFRESH TOKEN
// ==========================================
// DEFINE a POST route at the endpoint '/refresh'
// Note: No specific body validation is attached here, assuming the controller handles it
//   ATTACH Controller:
//     - Execute the 'ctrl.refresh' function to rotate the refresh token and issue a new access token
router.post('/refresh', ctrl.refresh);

// ==========================================
// 5. DEFINE ROUTE: LOGOUT
// ==========================================
// DEFINE a POST route at the endpoint '/logout'
// Note: No specific body validation is attached here, assuming the controller handles it
//   ATTACH Controller:
//     - Execute the 'ctrl.logout' function to revoke the user's refresh token
router.post('/logout', ctrl.logout);

// ==========================================
// 6. EXPORT MODULE
// ==========================================
// EXPORT the configured 'router' object to be registered in the main Express application
module.exports = router;
