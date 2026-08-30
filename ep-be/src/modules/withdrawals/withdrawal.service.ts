import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { debitLedger } from "@/modules/ledger/ledger.service";
import { MemberNotFoundError } from "@/modules/members/member.errors";
import {
  InsufficientBalanceError,
  MemberNotEligibleError,
  WithdrawalNotApprovedError,
  WithdrawalNotFoundError,
  WithdrawalNotRequestedError,
} from "@/modules/withdrawals/withdrawal.errors";
import type {
  CreateWithdrawalInput,
  ListWithdrawalsInput,
  RejectWithdrawalInput,
} from "@/modules/withdrawals/withdrawal.schema";
import type {
  PaginatedWithdrawals,
  WithdrawalDto,
} from "@/modules/withdrawals/withdrawal.types";

const withdrawalRelations = {
  member: { select: { memberNumber: true, fullName: true } },
} satisfies Prisma.WithdrawalInclude;

type WithdrawalWithRelations = Prisma.WithdrawalGetPayload<{
  include: typeof withdrawalRelations;
}>;

function toDto(withdrawal: WithdrawalWithRelations): WithdrawalDto {
  return {
    id: withdrawal.id,
    memberId: withdrawal.memberId,
    memberNumber: withdrawal.member.memberNumber,
    memberFullName: withdrawal.member.fullName,
    amountRupiah: withdrawal.amountRupiah.toString(),
    status: withdrawal.status,
    notes: withdrawal.notes,
    createdBy: withdrawal.createdBy,
    approvedBy: withdrawal.approvedBy,
    approvedAt: withdrawal.approvedAt?.toISOString() ?? null,
    paidBy: withdrawal.paidBy,
    paidAt: withdrawal.paidAt?.toISOString() ?? null,
    rejectedBy: withdrawal.rejectedBy,
    rejectedAt: withdrawal.rejectedAt?.toISOString() ?? null,
    rejectionReason: withdrawal.rejectionReason,
    createdAt: withdrawal.createdAt.toISOString(),
  };
}

export async function listWithdrawals(
  organizationId: string,
  input: ListWithdrawalsInput,
): Promise<PaginatedWithdrawals> {
  const prisma = getPrisma();
  const where: Prisma.WithdrawalWhereInput = {
    organizationId,
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.status ? { status: input.status } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.withdrawal.findMany({
      where,
      include: withdrawalRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.withdrawal.count({ where }),
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

export async function getWithdrawal(
  organizationId: string,
  id: string,
): Promise<WithdrawalDto> {
  const withdrawal = await getPrisma().withdrawal.findFirst({
    where: { id, organizationId },
    include: withdrawalRelations,
  });
  if (!withdrawal) throw new WithdrawalNotFoundError();
  return toDto(withdrawal);
}

async function getBalance(
  tx: Prisma.TransactionClient,
  organizationId: string,
  memberId: string,
): Promise<Prisma.Decimal> {
  const result = await tx.ledgerEntry.aggregate({
    where: { organizationId, memberId },
    _sum: { amountRupiah: true },
  });
  return result._sum.amountRupiah ?? new Prisma.Decimal(0);
}

// Only a soft check for immediate UX feedback - the authoritative, race-safe
// check happens again (with a row lock) in payWithdrawal. See root README
// "Aturan Bisnis Kritis": "Penarikan melakukan pemeriksaan saldo ulang dalam
// transaksi database".
export async function createWithdrawal(
  organizationId: string,
  createdBy: string,
  input: CreateWithdrawalInput,
): Promise<WithdrawalDto> {
  const withdrawal = await getPrisma().$transaction(async (tx) => {
    const member = await tx.member.findFirst({
      where: { id: input.memberId, organizationId },
      select: { isActive: true },
    });
    if (!member) throw new MemberNotFoundError();
    if (!member.isActive) throw new MemberNotEligibleError();

    const balance = await getBalance(tx, organizationId, input.memberId);
    const amount = new Prisma.Decimal(input.amountRupiah);
    if (balance.lessThan(amount)) {
      throw new InsufficientBalanceError(balance.toString());
    }

    const created = await tx.withdrawal.create({
      data: {
        organizationId,
        memberId: input.memberId,
        amountRupiah: amount,
        notes: input.notes ?? null,
        createdBy,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: createdBy,
        action: "WITHDRAWAL_REQUESTED",
        entityType: "Withdrawal",
        entityId: created.id,
        metadata: { amountRupiah: amount.toString() },
      },
    });

    return tx.withdrawal.findUniqueOrThrow({
      where: { id: created.id },
      include: withdrawalRelations,
    });
  });

  return toDto(withdrawal);
}

// Locks the row so concurrent approve/pay/reject calls on the same
// withdrawal can't both pass the status check below.
async function lockWithdrawal(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<WithdrawalWithRelations> {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM withdrawals
    WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
    FOR UPDATE
  `;
  if (locked.length === 0) throw new WithdrawalNotFoundError();

  return tx.withdrawal.findUniqueOrThrow({
    where: { id },
    include: withdrawalRelations,
  });
}

export async function approveWithdrawal(
  organizationId: string,
  approvedBy: string,
  id: string,
): Promise<WithdrawalDto> {
  const withdrawal = await getPrisma().$transaction(async (tx) => {
    const requested = await lockWithdrawal(tx, organizationId, id);
    if (requested.status !== "REQUESTED") {
      throw new WithdrawalNotRequestedError();
    }

    const updated = await tx.withdrawal.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
      include: withdrawalRelations,
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: approvedBy,
        action: "WITHDRAWAL_APPROVED",
        entityType: "Withdrawal",
        entityId: requested.id,
      },
    });

    return updated;
  });

  return toDto(withdrawal);
}

// The safety-critical balance recheck: locks the member row (so two
// concurrent payouts for the same member can't both pass), re-aggregates the
// ledger inside this same transaction, and only then writes exactly one
// WITHDRAWAL debit.
export async function payWithdrawal(
  organizationId: string,
  paidBy: string,
  id: string,
): Promise<WithdrawalDto> {
  const withdrawal = await getPrisma().$transaction(async (tx) => {
    const approved = await lockWithdrawal(tx, organizationId, id);
    if (approved.status !== "APPROVED") {
      throw new WithdrawalNotApprovedError();
    }

    await tx.$queryRaw`
      SELECT id FROM members
      WHERE id = ${approved.memberId}::uuid AND organization_id = ${organizationId}::uuid
      FOR UPDATE
    `;

    const balance = await getBalance(tx, organizationId, approved.memberId);
    if (balance.lessThan(approved.amountRupiah)) {
      throw new InsufficientBalanceError(balance.toString());
    }

    const updated = await tx.withdrawal.update({
      where: { id },
      data: { status: "PAID", paidBy, paidAt: new Date() },
      include: withdrawalRelations,
    });

    await debitLedger(tx, {
      organizationId,
      memberId: approved.memberId,
      entryType: "WITHDRAWAL",
      amountRupiah: approved.amountRupiah,
      sourceId: approved.id,
    });

    await tx.member.update({
      where: { id: approved.memberId },
      data: { lastActivityAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: paidBy,
        action: "WITHDRAWAL_PAID",
        entityType: "Withdrawal",
        entityId: approved.id,
        metadata: { amountRupiah: approved.amountRupiah.toString() },
      },
    });

    return updated;
  });

  return toDto(withdrawal);
}

export async function rejectWithdrawal(
  organizationId: string,
  rejectedBy: string,
  id: string,
  input: RejectWithdrawalInput,
): Promise<WithdrawalDto> {
  const withdrawal = await getPrisma().$transaction(async (tx) => {
    const requested = await lockWithdrawal(tx, organizationId, id);
    if (requested.status !== "REQUESTED") {
      throw new WithdrawalNotRequestedError();
    }

    const updated = await tx.withdrawal.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: input.reason,
      },
      include: withdrawalRelations,
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: rejectedBy,
        action: "WITHDRAWAL_REJECTED",
        entityType: "Withdrawal",
        entityId: requested.id,
        reason: input.reason,
      },
    });

    return updated;
  });

  return toDto(withdrawal);
}
