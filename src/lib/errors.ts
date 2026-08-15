import "server-only";

/**
 * Application error hierarchy.
 *
 * All errors thrown by the service layer should extend AppError. Route
 * handlers map AppError instances to standardized API responses via
 * `handleError` in `@/lib/api/response`.
 *
 * Raw Prisma errors must never leak to API consumers — catch them in services
 * and re-throw as AppError (or let the global handler log and return 500).
 */

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", details?: unknown) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(code, message, 409);
  }
}

/** A requested room/room type is no longer available for the dates. */
export class ReservationConflictError extends ConflictError {
  constructor(
    message = "The selected room is no longer available for the requested dates",
  ) {
    super(message, "ROOM_NOT_AVAILABLE");
  }
}

/** A reservation state transition is not allowed. */
export class InvalidReservationStateError extends ConflictError {
  constructor(message = "Invalid reservation state transition") {
    super(message, "INVALID_RESERVATION_STATE");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super("RATE_LIMITED", message, 429);
  }
}
