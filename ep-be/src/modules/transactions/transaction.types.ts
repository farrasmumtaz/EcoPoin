import type { PayoutMethod, TransactionSource, TransactionStatus, WasteCondition } from "@/generated/prisma/enums";

export interface TransactionItemDto {
  readonly id: string;
  readonly wasteTypeId: string;
  readonly wasteTypeName: string;
  readonly condition: WasteCondition;
  readonly weightKg: string;
  readonly pricePerKg: string;
  readonly subtotalAmount: string;
}

export interface TransactionDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly status: TransactionStatus;
  readonly source: TransactionSource;
  readonly payoutMethod: PayoutMethod | null;
  readonly receiptToken: string;
  readonly notes: string | null;
  readonly totalWeightKg: string;
  readonly totalAmount: string;
  readonly items: readonly TransactionItemDto[];
  readonly finalizedAt: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedTransactions {
  readonly items: readonly TransactionDto[];
  readonly pagination: { readonly page: number; readonly limit: number; readonly total: number; readonly totalPages: number };
}
