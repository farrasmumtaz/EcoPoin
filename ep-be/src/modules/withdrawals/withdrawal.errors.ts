import { AppError } from "@/shared/errors/app-error";

export class WithdrawalNotFoundError extends AppError {
  constructor() {
    super({
      code: "WITHDRAWAL_NOT_FOUND",
      message: "Withdrawal was not found.",
      statusCode: 404,
    });
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(currentBalanceRupiah: string) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: "Member does not have enough savings balance for this withdrawal.",
      statusCode: 422,
      details: { currentBalanceRupiah },
    });
  }
}

export class MemberNotEligibleError extends AppError {
  constructor() {
    super({
      code: "MEMBER_NOT_ELIGIBLE",
      message: "This member is inactive and cannot request a withdrawal.",
      statusCode: 422,
    });
  }
}

export class WithdrawalNotRequestedError extends AppError {
  constructor() {
    super({
      code: "WITHDRAWAL_NOT_REQUESTED",
      message: "This withdrawal is no longer awaiting approval.",
      statusCode: 422,
    });
  }
}

export class WithdrawalNotApprovedError extends AppError {
  constructor() {
    super({
      code: "WITHDRAWAL_NOT_APPROVED",
      message: "This withdrawal must be approved before it can be paid.",
      statusCode: 422,
    });
  }
}
