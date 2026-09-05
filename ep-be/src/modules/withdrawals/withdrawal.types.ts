import type { WithdrawalStatus } from "@/generated/prisma/enums";

export interface WithdrawalDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly amountRupiah: string;
  readonly status: WithdrawalStatus;
  readonly notes: string | null;
  readonly createdBy: string;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly paidBy: string | null;
  readonly paidAt: string | null;
  readonly rejectedBy: string | null;
  readonly rejectedAt: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string;
}

export interface PaginatedWithdrawals {
  readonly items: readonly WithdrawalDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
