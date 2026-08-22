import { AppError } from "@/shared/errors/app-error";

export class PassbookNotFoundError extends AppError {
  constructor() {
    // Deliberately generic: returned both when the token doesn't exist and
    // when the member is inactive, so a public caller can't use this
    // endpoint to distinguish "wrong token" from "deactivated member".
    super({
      code: "PASSBOOK_NOT_FOUND",
      message: "This receipt link is invalid or no longer active.",
      statusCode: 404,
    });
  }
}
