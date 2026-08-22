import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import {
  DepositNotDraftError,
  DepositNotFoundError,
} from "@/modules/deposits/deposit.errors";
import type { ListDepositsInput } from "@/modules/deposits/deposit.schema";
import type {
  DepositDto,
  DepositItemDto,
  PaginatedDeposits,
} from "@/modules/deposits/deposit.types";
import { creditPoints } from "@/modules/ledger/ledger.service";

const depositRelations = {
  member: { select: { memberNumber: true, fullName: true } },
  items: { include: { wasteType: { select: { name: true } } } },
} satisfies Prisma.DepositInclude;

type DepositWithRelations = Prisma.DepositGetPayload<{
  include: typeof depositRelations;
}>;

function toDto(deposit: DepositWithRelations): DepositDto {
  const items: DepositItemDto[] = deposit.items.map((item) => ({
    id: item.id,
    wasteTypeId: item.wasteTypeId,
    wasteTypeName: item.wasteType.name,
    weightKg: item.weightKg.toString(),
    pointsPerKgSnapshot: item.pointsPerKgSnapshot.toString(),
    subtotalPoints: item.subtotalPoints.toString(),
  }));

  const totalWeightKg = deposit.items.reduce(
    (sum, item) => sum.add(item.weightKg),
    new Prisma.Decimal(0),
  );
  const totalPoints = deposit.items.reduce(
    (sum, item) => sum.add(item.subtotalPoints),
    new Prisma.Decimal(0),
  );

  return {
    id: deposit.id,
    memberId: deposit.memberId,
    memberNumber: deposit.member.memberNumber,
    memberFullName: deposit.member.fullName,
    status: deposit.status,
    receiptToken: deposit.receiptToken,
    clientUuid: deposit.clientUuid,
    photoPath: deposit.photoPath,
    totalWeightKg: totalWeightKg.toString(),
    totalPoints: totalPoints.toString(),
    createdBy: deposit.createdBy,
    verifiedBy: deposit.verifiedBy,
    verifiedAt: deposit.verifiedAt?.toISOString() ?? null,
    rejectionReason: deposit.rejectionReason,
    items,
    createdAt: deposit.createdAt.toISOString(),
    updatedAt: deposit.updatedAt.toISOString(),
  };
}

export async function listDeposits(
  organizationId: string,
  input: ListDepositsInput,
): Promise<PaginatedDeposits> {
  const prisma = getPrisma();
  const where: Prisma.DepositWhereInput = {
    organizationId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          createdAt: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.deposit.findMany({
      where,
      include: depositRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.deposit.count({ where }),
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

export async function getDeposit(
  organizationId: string,
  id: string,
): Promise<DepositDto> {
  const deposit = await getPrisma().deposit.findFirst({
    where: { id, organizationId },
    include: depositRelations,
  });
  if (!deposit) throw new DepositNotFoundError();
  return toDto(deposit);
}

// Locks the deposit row so two concurrent verify/reject calls on the same
// deposit can't both pass the DRAFT check; the loser gets a clean
// DepositNotDraftError instead of racing the DB's immutability trigger.
async function lockDraftDeposit(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<DepositWithRelations> {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM deposits
    WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
    FOR UPDATE
  `;
  if (locked.length === 0) throw new DepositNotFoundError();

  const deposit = await tx.deposit.findUniqueOrThrow({
    where: { id },
    include: depositRelations,
  });
  if (deposit.status !== "DRAFT") throw new DepositNotDraftError();
  return deposit;
}

export async function verifyDeposit(
  organizationId: string,
  verifiedBy: string,
  id: string,
): Promise<DepositDto> {
  const deposit = await getPrisma().$transaction(async (tx) => {
    const draft = await lockDraftDeposit(tx, organizationId, id);
    const totalPoints = draft.items.reduce(
      (sum, item) => sum.add(item.subtotalPoints),
      new Prisma.Decimal(0),
    );

    const updated = await tx.deposit.update({
      where: { id },
      data: { status: "VERIFIED", verifiedBy, verifiedAt: new Date() },
      include: depositRelations,
    });

    await creditPoints(tx, {
      organizationId,
      memberId: draft.memberId,
      points: totalPoints,
      sourceType: "DEPOSIT",
      sourceId: draft.id,
    });

    await tx.member.update({
      where: { id: draft.memberId },
      data: { lastActivityAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: verifiedBy,
        action: "DEPOSIT_VERIFIED",
        entityType: "Deposit",
        entityId: draft.id,
        metadata: { totalPoints: totalPoints.toString() },
      },
    });

    return updated;
  });

  return toDto(deposit);
}

export async function rejectDeposit(
  organizationId: string,
  verifiedBy: string,
  id: string,
  reason: string,
): Promise<DepositDto> {
  const deposit = await getPrisma().$transaction(async (tx) => {
    const draft = await lockDraftDeposit(tx, organizationId, id);

    const updated = await tx.deposit.update({
      where: { id },
      data: {
        status: "REJECTED",
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
      include: depositRelations,
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: verifiedBy,
        action: "DEPOSIT_REJECTED",
        entityType: "Deposit",
        entityId: draft.id,
        reason,
      },
    });

    return updated;
  });

  return toDto(deposit);
}
