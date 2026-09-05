import type { FinancialLedgerEntryType } from "@/generated/prisma/enums";

export interface LedgerEntryDto {
  readonly id: string;
  readonly memberId: string;
  readonly memberNumber: string;
  readonly memberName: string;
  readonly entryType: FinancialLedgerEntryType;
  readonly amount: string;
  readonly referenceKey: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface LedgerListDto {
  readonly items: readonly LedgerEntryDto[];
  readonly summary: { readonly totalCredit: string; readonly totalDebit: string; readonly balance: string };
  readonly pagination: { readonly page: number; readonly limit: number; readonly total: number; readonly totalPages: number };
}
