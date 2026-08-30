import { AppError } from "@/shared/errors/app-error";

export class TransactionNotFoundError extends AppError {
  constructor() {
    super({
      code: "TRANSACTION_NOT_FOUND",
      message: "Transaction was not found.",
      statusCode: 404,
    });
  }
}

export class TransactionEmptyError extends AppError {
  constructor() {
    super({
      code: "TRANSACTION_EMPTY",
      message: "This transaction has no items and cannot be finalized.",
      statusCode: 422,
    });
  }
}

export class TransactionNotDraftError extends AppError {
  constructor() {
    super({
      code: "TRANSACTION_NOT_DRAFT",
      message: "This transaction is no longer a draft and cannot be finalized.",
      statusCode: 422,
    });
  }
}

export class TransactionNotFinalizedError extends AppError {
  constructor() {
    super({
      code: "TRANSACTION_NOT_FINALIZED",
      message: "This transaction must be finalized before it can be settled.",
      statusCode: 422,
    });
  }
}

export class TransactionNotCancellableError extends AppError {
  constructor() {
    super({
      code: "TRANSACTION_NOT_CANCELLABLE",
      message: "Completed or already-cancelled transactions cannot be cancelled.",
      statusCode: 422,
    });
  }
}
