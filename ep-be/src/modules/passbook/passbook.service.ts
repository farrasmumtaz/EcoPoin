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
  // RLS policy on members/deposits, so this backend route is the only path
  // to this data).
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

  const [deposits, redemptions, balanceAgg] = await Promise.all([
    prisma.deposit.findMany({
      where: {
        organizationId: member.organizationId,
        memberId: member.id,
        status: "VERIFIED",
      },
      include: { items: { include: { wasteType: { select: { name: true } } } } },
      orderBy: { verifiedAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.redemption.findMany({
      where: {
        organizationId: member.organizationId,
        memberId: member.id,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.pointLedger.aggregate({
      where: { organizationId: member.organizationId, memberId: member.id },
      _sum: { points: true },
    }),
  ]);

  const depositHistory: PassbookHistoryEntryDto[] = deposits.map((deposit) => ({
    type: "DEPOSIT",
    points: deposit.items
      .reduce((sum, item) => sum.add(item.subtotalPoints), new Prisma.Decimal(0))
      .toString(),
    description: deposit.items.map((item) => item.wasteType.name).join(", "),
    occurredAt: (deposit.verifiedAt ?? deposit.createdAt).toISOString(),
  }));

  const redemptionHistory: PassbookHistoryEntryDto[] = redemptions.map(
    (redemption) => ({
      type: "REDEMPTION",
      points: redemption.points.negated().toString(),
      description: redemption.redemptionType,
      occurredAt: redemption.createdAt.toISOString(),
    }),
  );

  const history = [...depositHistory, ...redemptionHistory]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, HISTORY_LIMIT);

  return {
    memberNumber: member.memberNumber,
    fullName: member.fullName,
    memberType: member.type,
    balance: (balanceAgg._sum.points ?? new Prisma.Decimal(0)).toString(),
    history,
  };
}
