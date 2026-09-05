import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { getMember } from "@/modules/members/member.service";
import type { MemberSummaryDto } from "@/modules/members/member-summary.types";

export async function getMemberSummary(organizationId: string, memberId: string): Promise<MemberSummaryDto> {
  const member = await getMember(organizationId, memberId);
  const prisma = getPrisma();
  const completedWhere = { organizationId, memberId, status: "COMPLETED" as const };
  const [transactionAggregate, transactions, ledgerEntries, ledgerGroups] = await prisma.$transaction([
    prisma.transaction.aggregate({ where: completedWhere, _sum: { totalAmount: true, totalWeightKg: true }, _count: { id: true } }),
    prisma.transaction.findMany({ where: { organizationId, memberId }, select: { id: true, status: true, payoutMethod: true, totalWeightKg: true, totalAmount: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.financialLedger.findMany({ where: { organizationId, memberId }, select: { id: true, entryType: true, amount: true, referenceKey: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.financialLedger.groupBy({ by: ["entryType"], where: { organizationId, memberId }, orderBy: { entryType: "asc" }, _sum: { amount: true } }),
  ]);
  const credit = ledgerGroups.filter(({ entryType }) => entryType === "DEPOSIT" || entryType === "ADJUSTMENT").reduce((sum, row) => sum.add(row._sum?.amount ?? 0), new Prisma.Decimal(0));
  const debit = ledgerGroups.filter(({ entryType }) => entryType === "WITHDRAWAL" || entryType === "REVERSAL").reduce((sum, row) => sum.add(row._sum?.amount ?? 0), new Prisma.Decimal(0));
  return {
    member,
    statistics: { balance: credit.sub(debit).toString(), totalDepositAmount: transactionAggregate._sum.totalAmount?.toString() ?? "0", totalWeightKg: transactionAggregate._sum.totalWeightKg?.toString() ?? "0", completedTransactions: transactionAggregate._count.id },
    transactions: transactions.map((transaction) => ({ ...transaction, totalWeightKg: transaction.totalWeightKg.toString(), totalAmount: transaction.totalAmount.toString(), createdAt: transaction.createdAt.toISOString() })),
    ledgerEntries: ledgerEntries.map((entry) => ({ ...entry, amount: entry.amount.toString(), createdAt: entry.createdAt.toISOString() })),
  };
}
