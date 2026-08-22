import type { RedemptionStatus } from "@/generated/prisma/enums";

export interface RedemptionDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly points: string;
  readonly redemptionType: string;
  readonly status: RedemptionStatus;
  readonly notes: string | null;
  readonly createdBy: string;
  readonly cancelledBy: string | null;
  readonly cancellationReason: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
}

export interface PaginatedRedemptions {
  readonly items: readonly RedemptionDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
