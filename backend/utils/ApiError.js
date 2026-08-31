// ==========================================
// 1. DEFINE CUSTOM ERROR CLASS
// ==========================================
// CLASS ApiError EXTENDS the built-in 'Error' class:
// Purpose: Represents a "known" application error (something we deliberately
// threw, as opposed to an unexpected bug/crash) that carries everything the
// centralized errorHandler needs to build a proper HTTP response.
class ApiError extends Error {
  // CONSTRUCTOR(status, code, message, details = null):
  //   - status: the HTTP status code to respond with (e.g. 404, 401, 422)
  //   - code: a short machine-readable string identifying the error type
  //     (e.g. 'NOT_FOUND', 'INVALID_CREDENTIALS') — used by clients to branch
  //     logic without parsing the human-readable message
  //   - message: human-readable description shown to the caller
  //   - details: optional extra data (e.g. field-level validation errors)
  constructor(status, code, message, details = null) {
    // CALL the parent Error constructor with 'message' so error.message,
    // stack traces, etc. still work normally
    super(message);

    // ATTACH the extra fields onto 'this' so the errorHandler can read them
    // back later via `err.status`, `err.code`, `err.details`
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// 2. EXPORT MODULE
// ==========================================
// EXPORT the 'ApiError' class so controllers/services can do
// `throw new ApiError(404, 'NOT_FOUND', '...')` anywhere in the app
module.exports = ApiError;
