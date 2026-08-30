import type { Prisma } from "@/generated/prisma/client";
import type { LedgerEntryType } from "@/generated/prisma/enums";
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
} satisfies Prisma.LedgerEntryInclude;

type LedgerEntryWithRelations = Prisma.LedgerEntryGetPayload<{
  include: typeof ledgerRelations;
}>;

function toDto(entry: LedgerEntryWithRelations): LedgerEntryDto {
  return {
    id: entry.id,
    memberId: entry.memberId,
    memberNumber: entry.member.memberNumber,
    memberFullName: entry.member.fullName,
    entryType: entry.entryType,
    amountRupiah: entry.amountRupiah.toString(),
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
  const where: Prisma.LedgerEntryWhereInput = {
    organizationId,
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.entryType ? { entryType: input.entryType } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.ledgerEntry.findMany({
      where,
      include: ledgerRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.ledgerEntry.count({ where }),
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

  const result = await prisma.ledgerEntry.aggregate({
    where: { organizationId, memberId },
    _sum: { amountRupiah: true },
  });

  return {
    memberId,
    balanceRupiah: (result._sum.amountRupiah ?? 0).toString(),
  };
}

interface RecordLedgerEntryParams {
  readonly organizationId: string;
  readonly memberId: string;
  readonly entryType: LedgerEntryType;
  // Always the positive magnitude; credit/debit sign is applied internally
  // so callers can't accidentally pass a signed value the wrong way round.
  readonly amountRupiah: Prisma.Decimal;
  readonly sourceId: string;
}

// Both helpers must be called with the SAME transaction client that performs
// the triggering write (transaction settle, withdrawal pay) so the ledger
// entry is atomic with it. `ledger_entries` has a unique
// (organization_id, entry_type, source_id) constraint, so calling either
// twice for the same source is safe to retry - it will raise a P2002 rather
// than double-crediting/debiting.
export async function creditLedger(
  tx: Prisma.TransactionClient,
  params: RecordLedgerEntryParams,
): Promise<void> {
  await tx.ledgerEntry.create({
    data: {
      organizationId: params.organizationId,
      memberId: params.memberId,
      entryType: params.entryType,
      amountRupiah: params.amountRupiah,
      sourceId: params.sourceId,
    },
  });
}

export async function debitLedger(
  tx: Prisma.TransactionClient,
  params: RecordLedgerEntryParams,
): Promise<void> {
  await tx.ledgerEntry.create({
    data: {
      organizationId: params.organizationId,
      memberId: params.memberId,
      entryType: params.entryType,
      amountRupiah: params.amountRupiah.negated(),
      sourceId: params.sourceId,
    },
  });
}
