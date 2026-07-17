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
