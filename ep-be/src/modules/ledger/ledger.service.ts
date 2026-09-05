import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import type { ListLedgerInput } from "@/modules/ledger/ledger.schema";
import type { LedgerListDto } from "@/modules/ledger/ledger.types";

export async function listLedger(organizationId: string, input: ListLedgerInput): Promise<LedgerListDto> {
  const prisma = getPrisma();
  const where: Prisma.FinancialLedgerWhereInput = {
    organizationId,
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.entryType ? { entryType: input.entryType } : {}),
    ...(input.search ? { member: { OR: [{ fullName: { contains: input.search, mode: "insensitive" } }, { memberNumber: { contains: input.search, mode: "insensitive" } }] } } : {}),
    ...(input.dateFrom || input.dateTo ? { createdAt: { ...(input.dateFrom ? { gte: input.dateFrom } : {}), ...(input.dateTo ? { lte: input.dateTo } : {}) } } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [records, total, grouped] = await prisma.$transaction([
    prisma.financialLedger.findMany({ where, include: { member: { select: { memberNumber: true, fullName: true } } }, orderBy: { createdAt: "desc" }, skip, take: input.limit }),
    prisma.financialLedger.count({ where }),
    prisma.financialLedger.groupBy({ by: ["entryType"], where, orderBy: { entryType: "asc" }, _sum: { amount: true } }),
  ]);
  const credits = grouped.filter(({ entryType }) => entryType === "DEPOSIT" || entryType === "ADJUSTMENT").reduce((sum, row) => sum.add(row._sum?.amount ?? 0), new Prisma.Decimal(0));
  const debits = grouped.filter(({ entryType }) => entryType === "WITHDRAWAL" || entryType === "REVERSAL").reduce((sum, row) => sum.add(row._sum?.amount ?? 0), new Prisma.Decimal(0));
  return {
    items: records.map((record) => ({ id: record.id, memberId: record.memberId, memberNumber: record.member.memberNumber, memberName: record.member.fullName, entryType: record.entryType, amount: record.amount.toString(), referenceKey: record.referenceKey, notes: record.notes, createdAt: record.createdAt.toISOString() })),
    summary: { totalCredit: credits.toString(), totalDebit: debits.toString(), balance: credits.sub(debits).toString() },
    pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
  };
}
