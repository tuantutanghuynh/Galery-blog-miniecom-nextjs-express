function sendSuccess(res, data, meta = null, status = 200) {
  return res.status(status).json({ data, meta, error: null });
}

module.exports = { sendSuccess };
