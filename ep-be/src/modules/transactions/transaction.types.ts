import type {
  SettlementMethod,
  TransactionStatus,
} from "@/generated/prisma/enums";

export interface TransactionItemDto {
  readonly id: string;
  readonly wasteTypeId: string;
  readonly wasteTypeName: string;
  readonly weightKg: string;
  readonly pricePerKgSnapshot: string;
  readonly subtotalRupiah: string;
}

export interface TransactionDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly status: TransactionStatus;
  readonly settlementMethod: SettlementMethod | null;
  readonly receiptToken: string;
  readonly clientUuid: string;
  readonly photoPath: string | null;
  readonly totalWeightKg: string;
  // Rupiah snapshot taken at finalize; null until then (see root README
  // "Aturan Bisnis Kritis": price/total snapshots never change retroactively).
  readonly totalRupiah: string | null;
  readonly createdBy: string;
  readonly completedBy: string | null;
  readonly completedAt: string | null;
  readonly cancelledBy: string | null;
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly items: readonly TransactionItemDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedTransactions {
  readonly items: readonly TransactionDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
