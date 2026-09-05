import type { FinancialLedgerEntryType, PayoutMethod, TransactionStatus } from "@/generated/prisma/enums";
import type { MemberDto } from "@/modules/members/member.types";

export interface MemberSummaryDto {
  readonly member: MemberDto;
  readonly statistics: { readonly balance: string; readonly totalDepositAmount: string; readonly totalWeightKg: string; readonly completedTransactions: number };
  readonly transactions: readonly { readonly id: string; readonly status: TransactionStatus; readonly payoutMethod: PayoutMethod | null; readonly totalWeightKg: string; readonly totalAmount: string; readonly createdAt: string }[];
  readonly ledgerEntries: readonly { readonly id: string; readonly entryType: FinancialLedgerEntryType; readonly amount: string; readonly referenceKey: string; readonly createdAt: string }[];
}
