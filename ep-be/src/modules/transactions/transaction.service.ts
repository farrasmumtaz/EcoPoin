import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { creditLedger } from "@/modules/ledger/ledger.service";
import {
  TransactionEmptyError,
  TransactionNotCancellableError,
  TransactionNotDraftError,
  TransactionNotFinalizedError,
  TransactionNotFoundError,
} from "@/modules/transactions/transaction.errors";
import type {
  CancelTransactionInput,
  ListTransactionsInput,
  SettleTransactionInput,
} from "@/modules/transactions/transaction.schema";
import type {
  PaginatedTransactions,
  TransactionDto,
  TransactionItemDto,
} from "@/modules/transactions/transaction.types";

const transactionRelations = {
  member: { select: { memberNumber: true, fullName: true } },
  items: { include: { wasteType: { select: { name: true } } } },
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof transactionRelations;
}>;

function toDto(transaction: TransactionWithRelations): TransactionDto {
  const items: TransactionItemDto[] = transaction.items.map((item) => ({
    id: item.id,
    wasteTypeId: item.wasteTypeId,
    wasteTypeName: item.wasteType.name,
    weightKg: item.weightKg.toString(),
    pricePerKgSnapshot: item.pricePerKgSnapshot.toString(),
    subtotalRupiah: item.subtotalRupiah.toString(),
  }));

  const totalWeightKg = transaction.items.reduce(
    (sum, item) => sum.add(item.weightKg),
    new Prisma.Decimal(0),
  );

  return {
    id: transaction.id,
    memberId: transaction.memberId,
    memberNumber: transaction.member.memberNumber,
    memberFullName: transaction.member.fullName,
    status: transaction.status,
    settlementMethod: transaction.settlementMethod,
    receiptToken: transaction.receiptToken,
    clientUuid: transaction.clientUuid,
    photoPath: transaction.photoPath,
    totalWeightKg: totalWeightKg.toString(),
    totalRupiah: transaction.totalRupiah?.toString() ?? null,
    createdBy: transaction.createdBy,
    completedBy: transaction.completedBy,
    completedAt: transaction.completedAt?.toISOString() ?? null,
    cancelledBy: transaction.cancelledBy,
    cancelledAt: transaction.cancelledAt?.toISOString() ?? null,
    cancellationReason: transaction.cancellationReason,
    items,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export async function listTransactions(
  organizationId: string,
  input: ListTransactionsInput,
): Promise<PaginatedTransactions> {
  const prisma = getPrisma();
  const where: Prisma.TransactionWhereInput = {
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
    prisma.transaction.findMany({
      where,
      include: transactionRelations,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.transaction.count({ where }),
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

export async function getTransaction(
  organizationId: string,
  id: string,
): Promise<TransactionDto> {
  const transaction = await getPrisma().transaction.findFirst({
    where: { id, organizationId },
    include: transactionRelations,
  });
  if (!transaction) throw new TransactionNotFoundError();
  return toDto(transaction);
}

// Locks the row so two concurrent finalize/settle/cancel calls on the same
// transaction can't both pass their status check below.
async function lockTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<TransactionWithRelations> {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM transactions
    WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
    FOR UPDATE
  `;
  if (locked.length === 0) throw new TransactionNotFoundError();

  return tx.transaction.findUniqueOrThrow({
    where: { id },
    include: transactionRelations,
  });
}

// Locks items and snapshots the rupiah total. Items themselves still come
// from wherever they were seeded - draft creation/editing is still pending a
// team decision, see the NOTE in src/app/api/transactions/route.ts.
export async function finalizeTransaction(
  organizationId: string,
  id: string,
): Promise<TransactionDto> {
  const transaction = await getPrisma().$transaction(async (tx) => {
    const draft = await lockTransaction(tx, organizationId, id);
    if (draft.status !== "DRAFT") throw new TransactionNotDraftError();
    if (draft.items.length === 0) throw new TransactionEmptyError();

    const totalRupiah = draft.items.reduce(
      (sum, item) => sum.add(item.subtotalRupiah),
      new Prisma.Decimal(0),
    );

    return tx.transaction.update({
      where: { id },
      data: { status: "FINALIZED", finalizedAt: new Date(), totalRupiah },
      include: transactionRelations,
    });
  });

  return toDto(transaction);
}

// DIRECT_CASH never touches the savings ledger; SAVINGS produces exactly one
// DEPOSIT ledger credit - see root README "Alur Utama" and "Aturan Bisnis
// Kritis" ("DIRECT_CASH tidak menambah saldo" / "SAVINGS menghasilkan tepat
// satu kredit ledger").
export async function settleTransaction(
  organizationId: string,
  completedBy: string,
  id: string,
  input: SettleTransactionInput,
): Promise<TransactionDto> {
  const transaction = await getPrisma().$transaction(async (tx) => {
    const finalized = await lockTransaction(tx, organizationId, id);
    if (finalized.status !== "FINALIZED") {
      throw new TransactionNotFinalizedError();
    }

    const updated = await tx.transaction.update({
      where: { id },
      data: {
        status: "COMPLETED",
        settlementMethod: input.settlementMethod,
        completedBy,
        completedAt: new Date(),
      },
      include: transactionRelations,
    });

    if (input.settlementMethod === "SAVINGS") {
      await creditLedger(tx, {
        organizationId,
        memberId: finalized.memberId,
        entryType: "DEPOSIT",
        amountRupiah: finalized.totalRupiah ?? new Prisma.Decimal(0),
        sourceId: finalized.id,
      });
    }

    await tx.member.update({
      where: { id: finalized.memberId },
      data: { lastActivityAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: completedBy,
        action: "TRANSACTION_SETTLED",
        entityType: "Transaction",
        entityId: finalized.id,
        metadata: {
          settlementMethod: input.settlementMethod,
          totalRupiah: (finalized.totalRupiah ?? new Prisma.Decimal(0)).toString(),
        },
      },
    });

    return updated;
  });

  return toDto(transaction);
}

export async function cancelTransaction(
  organizationId: string,
  cancelledBy: string,
  id: string,
  input: CancelTransactionInput,
): Promise<TransactionDto> {
  const transaction = await getPrisma().$transaction(async (tx) => {
    const current = await lockTransaction(tx, organizationId, id);
    if (current.status !== "DRAFT" && current.status !== "FINALIZED") {
      throw new TransactionNotCancellableError();
    }

    const updated = await tx.transaction.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason: input.reason,
      },
      include: transactionRelations,
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: cancelledBy,
        action: "TRANSACTION_CANCELLED",
        entityType: "Transaction",
        entityId: current.id,
        reason: input.reason,
      },
    });

    return updated;
  });

  return toDto(transaction);
}
