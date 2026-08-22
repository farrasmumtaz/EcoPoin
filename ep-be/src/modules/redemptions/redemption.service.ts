import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { MemberNotFoundError } from "@/modules/members/member.errors";
import { debitPoints } from "@/modules/ledger/ledger.service";
import {
  InsufficientBalanceError,
  MemberNotEligibleError,
  RedemptionNotFoundError,
} from "@/modules/redemptions/redemption.errors";
import type {
  CreateRedemptionInput,
  ListRedemptionsInput,
} from "@/modules/redemptions/redemption.schema";
import type {
  PaginatedRedemptions,
  RedemptionDto,
} from "@/modules/redemptions/redemption.types";

const redemptionRelations = {
  member: { select: { memberNumber: true, fullName: true } },
} satisfies Prisma.RedemptionInclude;

type RedemptionWithRelations = Prisma.RedemptionGetPayload<{
  include: typeof redemptionRelations;
}>;

function toDto(redemption: RedemptionWithRelations): RedemptionDto {
  return {
    id: redemption.id,
    memberId: redemption.memberId,
    memberNumber: redemption.member.memberNumber,
    memberFullName: redemption.member.fullName,
    points: redemption.points.toString(),
    redemptionType: redemption.redemptionType,
    status: redemption.status,
    notes: redemption.notes,
    createdBy: redemption.createdBy,
    cancelledBy: redemption.cancelledBy,
    cancellationReason: redemption.cancellationReason,
    cancelledAt: redemption.cancelledAt?.toISOString() ?? null,
    createdAt: redemption.createdAt.toISOString(),
  };
}

export async function listRedemptions(
  organizationId: string,
  input: ListRedemptionsInput,
): Promise<PaginatedRedemptions> {
  const prisma = getPrisma();
  const where: Prisma.RedemptionWhereInput = {
    organizationId,
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.status ? { status: input.status } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.redemption.findMany({
      where,
      include: redemptionRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.redemption.count({ where }),
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

export async function getRedemption(
  organizationId: string,
  id: string,
): Promise<RedemptionDto> {
  const redemption = await getPrisma().redemption.findFirst({
    where: { id, organizationId },
    include: redemptionRelations,
  });
  if (!redemption) throw new RedemptionNotFoundError();
  return toDto(redemption);
}

export async function createRedemption(
  organizationId: string,
  createdBy: string,
  input: CreateRedemptionInput,
): Promise<RedemptionDto> {
  const redemption = await getPrisma().$transaction(async (tx) => {
    // Lock the member row so two concurrent redemptions for the same member
    // can't both read the same balance and both succeed past the check
    // below - that's exactly the negative-balance race task 29 calls out.
    const locked = await tx.$queryRaw<{ isActive: boolean }[]>`
      SELECT is_active AS "isActive" FROM members
      WHERE id = ${input.memberId}::uuid AND organization_id = ${organizationId}::uuid
      FOR UPDATE
    `;
    if (locked.length === 0) throw new MemberNotFoundError();
    if (!locked[0].isActive) throw new MemberNotEligibleError();

    const balanceAgg = await tx.pointLedger.aggregate({
      where: { organizationId, memberId: input.memberId },
      _sum: { points: true },
    });
    const balance = balanceAgg._sum.points ?? new Prisma.Decimal(0);
    const requestedPoints = new Prisma.Decimal(input.points);
    if (balance.lessThan(requestedPoints)) {
      throw new InsufficientBalanceError(balance.toString());
    }

    const created = await tx.redemption.create({
      data: {
        organizationId,
        memberId: input.memberId,
        points: requestedPoints,
        redemptionType: input.redemptionType,
        notes: input.notes ?? null,
        createdBy,
      },
    });

    await debitPoints(tx, {
      organizationId,
      memberId: input.memberId,
      points: requestedPoints,
      sourceType: "REDEMPTION",
      sourceId: created.id,
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: createdBy,
        action: "REDEMPTION_CREATED",
        entityType: "Redemption",
        entityId: created.id,
        metadata: {
          points: requestedPoints.toString(),
          redemptionType: input.redemptionType,
        },
      },
    });

    return tx.redemption.findUniqueOrThrow({
      where: { id: created.id },
      include: redemptionRelations,
    });
  });

  return toDto(redemption);
}
