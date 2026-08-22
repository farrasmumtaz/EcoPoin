import type { DepositStatus } from "@/generated/prisma/enums";

export interface DepositItemDto {
  readonly id: string;
  readonly wasteTypeId: string;
  readonly wasteTypeName: string;
  readonly weightKg: string;
  readonly pointsPerKgSnapshot: string;
  readonly subtotalPoints: string;
}

export interface DepositDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly status: DepositStatus;
  readonly receiptToken: string;
  readonly clientUuid: string;
  readonly photoPath: string | null;
  readonly totalWeightKg: string;
  readonly totalPoints: string;
  readonly createdBy: string;
  readonly verifiedBy: string | null;
  readonly verifiedAt: string | null;
  readonly rejectionReason: string | null;
  readonly items: readonly DepositItemDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedDeposits {
  readonly items: readonly DepositDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
