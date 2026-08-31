// ==========================================
// 1. DEFINE SUCCESS RESPONSE HELPER
// ==========================================
// FUNCTION sendSuccess(res, data, meta = null, status = 200):
// Purpose: Single shared place that formats EVERY successful API response,
// so every endpoint in the app returns the exact same JSON shape
// { data, meta, error: null } — the client never has to guess the shape.
//   - res: the Express response object
//   - data: the actual payload to return (object, array, etc.)
//   - meta: optional extra info (e.g. pagination: { page, pageSize, total })
//   - status: HTTP status code to send, defaults to 200 (OK)
function sendSuccess(res, data, meta = null, status = 200) {
  // SET the HTTP status code and SEND the JSON body in the standard shape
  // RETURN the result of res.json(...) (Express returns 'res' itself,
  // handy for chaining if ever needed)
  return res.status(status).json({ data, meta, error: null });
}

// ==========================================
// 2. EXPORT MODULE
// ==========================================
// EXPORT 'sendSuccess' so every controller calls this instead of writing
// res.json(...) manually with an inconsistent shape
module.exports = { sendSuccess };
