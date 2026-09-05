import { AppError } from "@/shared/errors/app-error";

export class TransactionNotFoundError extends AppError {
  constructor() {
    super({ code: "TRANSACTION_NOT_FOUND", message: "Transaction was not found.", statusCode: 404 });
  }
}

export class InvalidTransactionStateError extends AppError {
  constructor(message: string) {
    super({ code: "INVALID_TRANSACTION_STATE", message, statusCode: 409 });
  }
}

export class InvalidTransactionReferenceError extends AppError {
  constructor(message: string) {
    super({ code: "INVALID_TRANSACTION_REFERENCE", message, statusCode: 422 });
  }
}
