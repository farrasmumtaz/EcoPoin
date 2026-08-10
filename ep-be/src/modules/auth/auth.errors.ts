import { AppError } from "@/shared/errors/app-error";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      statusCode: 401,
    });
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super({
      code: "UNAUTHORIZED",
      message: "Authentication is required.",
      statusCode: 401,
    });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
      statusCode: 403,
    });
    this.name = "ForbiddenError";
  }
}

export class IncompleteAccountError extends AppError {
  constructor() {
    super({
      code: "INCOMPLETE_ACCOUNT",
      message: "The account has not been assigned to an organization and role.",
      statusCode: 403,
    });
    this.name = "IncompleteAccountError";
  }
}
