// ==========================================
// 1. DEFINE ASYNC ERROR-CATCHING WRAPPER
// ==========================================
// FUNCTION asyncHandler(fn):
// Purpose: Wraps an async Express route/controller handler so that if the
// returned Promise rejects (e.g. an `await prisma.xxx()` call throws, or
// code does `throw new ApiError(...)`), the error is automatically forwarded
// to `next(err)` instead of being silently swallowed or crashing the process.
// Without this wrapper, Express does NOT catch rejected Promises on its own
// inside async route handlers — the request would just hang with no response.
//   - fn: the actual async (req, res, next) => {...} controller function
function asyncHandler(fn) {
  // RETURN a new function with the same Express middleware signature
  // (req, res, next) — this is what actually gets registered on the route
  return (req, res, next) => {
    // CALL the wrapped function 'fn' with (req, res, next)
    // WRAP the result in Promise.resolve(...) so this works even if 'fn'
    // is not itself declared 'async' (still safe either way)
    // ATTACH a .catch(next) so ANY rejection/thrown error automatically
    // flows into Express's error-handling chain (eventually reaching
    // middlewares/errorHandler.js)
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ==========================================
// 2. EXPORT MODULE
// ==========================================
// EXPORT 'asyncHandler' so every controller function can be wrapped:
// const myController = asyncHandler(async (req, res) => { ... });
module.exports = asyncHandler;
