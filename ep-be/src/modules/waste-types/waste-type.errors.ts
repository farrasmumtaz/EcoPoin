import { AppError } from "@/shared/errors/app-error";

export class WasteTypeNotFoundError extends AppError {
  constructor() {
    super({
      code: "WASTE_TYPE_NOT_FOUND",
      message: "Waste type was not found.",
      statusCode: 404,
    });
  }
}

export class WasteTypeNameConflictError extends AppError {
  constructor() {
    super({
      code: "WASTE_TYPE_NAME_CONFLICT",
      message: "A waste type with this name already exists.",
      statusCode: 409,
    });
  }
}

export class NoActivePriceError extends AppError {
  constructor() {
    super({
      code: "NO_ACTIVE_PRICE",
      message: "This waste type has no active price for the given scheme.",
      statusCode: 422,
    });
  }
}

export class InvalidPriceRangeError extends AppError {
  constructor() {
    super({
      code: "INVALID_PRICE_RANGE",
      message:
        "The new price's effective date must be after the currently active version's.",
      statusCode: 422,
    });
  }
}
