import type { LedgerEntryType } from "@/generated/prisma/enums";

export interface LedgerEntryDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly entryType: LedgerEntryType;
  // Signed decimal as a string: positive increases the balance (DEPOSIT,
  // OPENING_BALANCE), negative decreases it (WITHDRAWAL). REVERSAL/ADJUSTMENT
  // carry whichever sign undoes or corrects the original entry.
  readonly amountRupiah: string;
  readonly sourceId: string;
  readonly reversalOfId: string | null;
  readonly createdAt: string;
}

export interface PaginatedLedgerEntries {
  readonly items: readonly LedgerEntryDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface MemberBalanceDto {
  readonly memberId: string;
  readonly balanceRupiah: string;
}
