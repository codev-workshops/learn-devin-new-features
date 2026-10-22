import type { ApiError, ErrorCode } from "@kade/contracts";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ApiError["details"],
  ) {
    super(message);
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export const badRequest = (message: string, details?: ApiError["details"]) =>
  new HttpError(400, "bad_request", message, details);
export const forbidden = (message: string) => new HttpError(403, "forbidden", message);
export const notFound = (message: string) => new HttpError(404, "not_found", message);
export const conflict = (message: string) => new HttpError(409, "conflict", message);
export const outOfStock = (message: string) => new HttpError(409, "out_of_stock", message);
export const invalidSignature = (message: string) =>
  new HttpError(401, "invalid_signature", message);
export const validationFailed = (details: ApiError["details"]) =>
  new HttpError(422, "validation_failed", "Validation failed", details);
