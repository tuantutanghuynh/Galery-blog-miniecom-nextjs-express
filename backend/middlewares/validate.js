// ==========================================
// 1. IMPORT DEPENDENCIES
// ==========================================
// IMPORT 'validationResult' from 'express-validator' (reads the validation
// rules attached earlier in the route chain, e.g. body('email').isEmail())
// IMPORT the custom 'ApiError' utility class (for standardized error handling)
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// ==========================================
// 2. DEFINE VALIDATION MIDDLEWARE
// ==========================================
// FUNCTION validate(req, res, next):
// Purpose: Runs AFTER the express-validator rule chain in a route definition
// (e.g. [body('email').isEmail(), validate]) to collect and report any
// validation failures in one consistent format.
function validate(req, res, next) {
  // COLLECT all validation errors accumulated on 'req' by the rules declared
  // earlier in the same route (express-validator attaches them internally,
  // it does NOT throw — this is what actually reads them out)
  const errors = validationResult(req);

  // IF there is at least one validation error:
  //   CREATE a new ApiError (Status: 422, Code: 'VALIDATION_ERROR')
  //   ATTACH the full list of individual field errors as 'details'
  //   PASS the error to 'next' to trigger the centralized errorHandler
  //   RETURN immediately to stop the request from reaching the controller
  if (!errors.isEmpty()) {
    return next(
      new ApiError(422, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors.array())
    );
  }

  // No errors found — let the request continue to the next middleware/controller
  // CALL next()
  next();
}

// ==========================================
// 3. EXPORT MODULE
// ==========================================
// EXPORT the 'validate' function so route files can plug it into their
// validation chain right after the express-validator rules
module.exports = validate;
