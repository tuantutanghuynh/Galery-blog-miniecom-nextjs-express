// Error type for every failure this API raises on purpose, as opposed to an unexpected
// crash. It carries the three things the central error handler needs to build a response:
// an HTTP status, a stable machine-readable code, and a human-readable message.

// Builds an error that the error handler can turn straight into an HTTP response. `status`
// is the HTTP status to send, `code` is a stable SNAKE_CASE identifier the frontend can
// branch on without parsing prose, `message` is the text shown to the user, and `details`
// carries optional extra payload such as the field-level errors from express-validator.
// It extends the built-in Error so stack traces and `instanceof` checks keep working —
// that `instanceof` check is exactly how the error handler tells a deliberate failure
// apart from a genuine bug, and it decides whether the real message reaches the client.
export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default ApiError;
