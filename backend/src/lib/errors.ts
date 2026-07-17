/**
 * AppError: a typed application error carrying an HTTP status code and a
 * short machine-readable `code` (the same string codes controllers used to
 * throw as `new Error("SOME_CODE")` and compare via `error.message === ...`).
 *
 * Throw `AppError` (or one of the factory helpers below) from services and
 * controllers; the global error handler in `src/app.ts` will translate it
 * into a consistent `{ message: code }` JSON response with the right status.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message?: string) {
    super(message ?? code);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(code: string, message?: string) {
    return new AppError(400, code, message);
  }

  static unauthorized(code: string, message?: string) {
    return new AppError(401, code, message);
  }

  static forbidden(code: string, message?: string) {
    return new AppError(403, code, message);
  }

  static notFound(code: string, message?: string) {
    return new AppError(404, code, message);
  }

  static conflict(code: string, message?: string) {
    return new AppError(409, code, message);
  }

  static internal(code: string, message?: string) {
    return new AppError(500, code, message);
  }
}
