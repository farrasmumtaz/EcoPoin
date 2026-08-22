import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { MemberNotFoundError } from "@/modules/members/member.errors";
import type { ListLedgerInput } from "@/modules/ledger/ledger.schema";
import type {
  LedgerEntryDto,
  MemberBalanceDto,
  PaginatedLedgerEntries,
} from "@/modules/ledger/ledger.types";

const ledgerRelations = {
  member: { select: { memberNumber: true, fullName: true } },
} satisfies Prisma.PointLedgerInclude;

type LedgerEntryWithRelations = Prisma.PointLedgerGetPayload<{
  include: typeof ledgerRelations;
}>;

function toDto(entry: LedgerEntryWithRelations): LedgerEntryDto {
  return {
    id: entry.id,
    memberId: entry.memberId,
    memberNumber: entry.member.memberNumber,
    memberFullName: entry.member.fullName,
    entryType: entry.entryType,
    points: entry.points.toString(),
    sourceType: entry.sourceType,
    sourceId: entry.sourceId,
    reversalOfId: entry.reversalOfId,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function listLedgerEntries(
  organizationId: string,
  input: ListLedgerInput,
): Promise<PaginatedLedgerEntries> {
  const prisma = getPrisma();
  const where: Prisma.PointLedgerWhereInput = {
    organizationId,
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.sourceType ? { sourceType: input.sourceType } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.pointLedger.findMany({
      where,
      include: ledgerRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.pointLedger.count({ where }),
  ]);

  return {
    items: items.map(toDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getMemberBalance(
  organizationId: string,
  memberId: string,
): Promise<MemberBalanceDto> {
  const prisma = getPrisma();
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
    select: { id: true },
  });
  if (!member) throw new MemberNotFoundError();

  const result = await prisma.pointLedger.aggregate({
    where: { organizationId, memberId },
    _sum: { points: true },
  });

  return {
    memberId,
    balance: (result._sum.points ?? 0).toString(),
  };
}

interface RecordLedgerEntryParams {
  readonly organizationId: string;
  readonly memberId: string;
  // Always the positive magnitude; credit/debit sign is applied internally
  // so callers can't accidentally pass a signed value the wrong way round.
  readonly points: Prisma.Decimal;
  readonly sourceType: "DEPOSIT" | "REDEMPTION";
  readonly sourceId: string;
}

// Both helpers must be called with the SAME transaction client that performs
// the triggering write (deposit verification, redemption creation) so the
// ledger entry is atomic with it. `point_ledger` has a unique
// (organization_id, source_type, source_id, entry_type) constraint, so
// calling either twice for the same source is safe to retry - it will raise
// a P2002 rather than double-crediting/debiting.
export async function creditPoints(
  tx: Prisma.TransactionClient,
  params: RecordLedgerEntryParams,
): Promise<void> {
  await tx.pointLedger.create({
    data: {
      organizationId: params.organizationId,
      memberId: params.memberId,
      entryType: "CREDIT",
      points: params.points,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    },
  });
}

export async function debitPoints(
  tx: Prisma.TransactionClient,
  params: RecordLedgerEntryParams,
): Promise<void> {
  await tx.pointLedger.create({
    data: {
      organizationId: params.organizationId,
      memberId: params.memberId,
      entryType: "DEBIT",
      points: params.points.negated(),
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    },
  });
}
