// Wrapper that connects async controllers to Express's error-handling chain. Every
// controller in this project is wrapped in it, so thrown errors always reach
// middlewares/errorHandler.js instead of being lost.

// Takes an async controller `fn` and returns a normal Express middleware that runs it and
// forwards any rejection to `next`. Express 5 does not catch rejected Promises coming out
// of async handlers on its own, so without this wrapper a failed `await prisma.x()` would
// leave the request hanging forever with no response and no log. `Promise.resolve(...)` is
// used so the wrapper also works on handlers that are not declared `async`. Forgetting to
// wrap a new controller is the single easiest way to reintroduce hanging requests here.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
