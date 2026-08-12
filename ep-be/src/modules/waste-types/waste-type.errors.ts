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
