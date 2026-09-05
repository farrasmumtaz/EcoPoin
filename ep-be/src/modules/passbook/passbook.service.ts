import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { PassbookNotFoundError } from "@/modules/passbook/passbook.errors";
import type {
  PassbookDto,
  PassbookHistoryEntryDto,
} from "@/modules/passbook/passbook.types";

const HISTORY_LIMIT = 100;

export async function getPassbook(token: string): Promise<PassbookDto> {
  const prisma = getPrisma();
  // No organizationId scoping here by design - the token itself IS the
  // access credential for this public, unauthenticated route (see
  // prisma/README.md "Public receipts": there is intentionally no anonymous
  // RLS policy on members/transactions, so this backend route is the only
  // path to this data).
  const member = await prisma.member.findFirst({
    where: { publicToken: token, isActive: true },
    select: {
      id: true,
      organizationId: true,
      memberNumber: true,
      fullName: true,
      type: true,
    },
  });
  if (!member) throw new PassbookNotFoundError();

  const [transactions, withdrawals, balanceAgg] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId: member.organizationId,
        memberId: member.id,
        status: "COMPLETED",
        settlementMethod: "SAVINGS",
      },
      include: {
        items: { include: { wasteType: { select: { name: true } } } },
      },
      orderBy: { completedAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.withdrawal.findMany({
      where: {
        organizationId: member.organizationId,
        memberId: member.id,
        status: "PAID",
      },
      orderBy: { paidAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.ledgerEntry.aggregate({
      where: { organizationId: member.organizationId, memberId: member.id },
      _sum: { amountRupiah: true },
    }),
  ]);

  const depositHistory: PassbookHistoryEntryDto[] = transactions.map(
    (transaction) => ({
      type: "DEPOSIT",
      amountRupiah: (transaction.totalRupiah ?? new Prisma.Decimal(0)).toString(),
      description: transaction.items
        .map((item) => item.wasteType.name)
        .join(", "),
      occurredAt: (transaction.completedAt ?? transaction.createdAt).toISOString(),
    }),
  );

  const withdrawalHistory: PassbookHistoryEntryDto[] = withdrawals.map(
    (withdrawal) => ({
      type: "WITHDRAWAL",
      amountRupiah: withdrawal.amountRupiah.negated().toString(),
      description: withdrawal.notes ?? "Penarikan tabungan",
      occurredAt: (withdrawal.paidAt ?? withdrawal.createdAt).toISOString(),
    }),
  );

  const history = [...depositHistory, ...withdrawalHistory]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, HISTORY_LIMIT);

  return {
    memberNumber: member.memberNumber,
    fullName: member.fullName,
    memberType: member.type,
    balanceRupiah: (balanceAgg._sum.amountRupiah ?? new Prisma.Decimal(0)).toString(),
    history,
  };
}
