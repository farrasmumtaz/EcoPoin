import type {
  LedgerEntryType,
  LedgerSourceType,
} from "@/generated/prisma/enums";

export interface LedgerEntryDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberFullName: string;
  readonly entryType: LedgerEntryType;
  // Signed decimal as a string: positive for CREDIT, negative for DEBIT.
  readonly points: string;
  readonly sourceType: LedgerSourceType;
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
  readonly balance: string;
}
