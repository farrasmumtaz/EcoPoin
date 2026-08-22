import { AppError } from "@/shared/errors/app-error";

export class RedemptionNotFoundError extends AppError {
  constructor() {
    super({
      code: "REDEMPTION_NOT_FOUND",
      message: "Redemption was not found.",
      statusCode: 404,
    });
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(currentBalance: string) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: "Member does not have enough points for this redemption.",
      statusCode: 422,
      details: { currentBalance },
    });
  }
}

export class MemberNotEligibleError extends AppError {
  constructor() {
    super({
      code: "MEMBER_NOT_ELIGIBLE",
      message: "This member is inactive and cannot redeem points.",
      statusCode: 422,
    });
  }
}
