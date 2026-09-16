// The single place that formats successful API responses. Every endpoint returns the same
// envelope through this helper, so the frontend never has to guess the shape of a response.

// Sends a success response in the project's standard envelope
// `{ data, meta, error: null }`. `data` is the payload, `meta` carries side information
// such as pagination counters (`{ page, pageSize, total }`), and `status` is the HTTP code,
// defaulting to 200. Pagination goes in `meta` rather than being mixed into `data` so a
// list endpoint always returns a plain array in `data`. Controllers must call this instead
// of `res.json()` directly — a hand-written response is how the shape drifts and breaks
// the frontend's error handling, which reads `json.error?.message`.
function sendSuccess(res, data, meta = null, status = 200) {
  return res.status(status).json({ data, meta, error: null });
}

module.exports = { sendSuccess };
