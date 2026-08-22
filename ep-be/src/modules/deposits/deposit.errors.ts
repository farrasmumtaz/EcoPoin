import { AppError } from "@/shared/errors/app-error";

export class DepositNotFoundError extends AppError {
  constructor() {
    super({
      code: "DEPOSIT_NOT_FOUND",
      message: "Deposit was not found.",
      statusCode: 404,
    });
  }
}

export class DepositNotDraftError extends AppError {
  constructor() {
    super({
      code: "DEPOSIT_NOT_DRAFT",
      message:
        "This deposit was already verified or rejected and can no longer be changed.",
      statusCode: 422,
    });
  }
}
