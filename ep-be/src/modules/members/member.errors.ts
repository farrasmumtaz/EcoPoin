import { AppError } from "@/shared/errors/app-error";

export class MemberNotFoundError extends AppError {
  constructor() {
    super({
      code: "MEMBER_NOT_FOUND",
      message: "Member was not found.",
      statusCode: 404,
    });
  }
}

export class InvalidMemberRelationshipError extends AppError {
  constructor(message = "One or more unit relationships are invalid.") {
    super({
      code: "INVALID_MEMBER_RELATIONSHIP",
      message,
      statusCode: 422,
    });
  }
}
