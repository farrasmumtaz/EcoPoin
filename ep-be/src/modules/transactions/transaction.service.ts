import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import {
  InvalidTransactionReferenceError,
  InvalidTransactionStateError,
  TransactionNotFoundError,
} from "@/modules/transactions/transaction.errors";
import type {
  CancelTransactionInput,
  CompleteTransactionInput,
  CreateTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
} from "@/modules/transactions/transaction.schema";
import type { PaginatedTransactions, TransactionDto } from "@/modules/transactions/transaction.types";

const transactionInclude = {
  member: { select: { fullName: true } },
  items: { orderBy: { wasteTypeNameSnapshot: "asc" as const } },
} satisfies Prisma.TransactionInclude;

type TransactionRecord = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;
type ItemInput = CreateTransactionInput["items"][number];

function toDto(record: TransactionRecord): TransactionDto {
  return {
    id: record.id,
    memberId: record.memberId,
    memberName: record.member.fullName,
    status: record.status,
    source: record.source,
    payoutMethod: record.payoutMethod,
    receiptToken: record.receiptToken,
    notes: record.notes,
    totalWeightKg: record.totalWeightKg.toString(),
    totalAmount: record.totalAmount.toString(),
    items: record.items.map((item) => ({
      id: item.id,
      wasteTypeId: item.wasteTypeId,
      wasteTypeName: item.wasteTypeNameSnapshot,
      condition: item.condition,
      weightKg: item.weightKg.toString(),
      pricePerKg: item.pricePerKgSnapshot.toString(),
      subtotalAmount: item.subtotalAmount.toString(),
    })),
    finalizedAt: record.finalizedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function assertMember(organizationId: string, memberId: string): Promise<void> {
  const member = await getPrisma().member.findFirst({
    where: { id: memberId, organizationId, isActive: true },
    select: { id: true },
  });
  if (!member) throw new InvalidTransactionReferenceError("Member is inactive or does not belong to this organization.");
}

async function buildItems(organizationId: string, input: readonly ItemInput[]) {
  const pricedAt = new Date();
  const uniqueItems = new Set(input.map(({ wasteTypeId, condition }) => `${wasteTypeId}:${condition}`));
  const uniqueIds = new Set(input.map(({ wasteTypeId }) => wasteTypeId));
  if (uniqueItems.size !== input.length) {
    throw new InvalidTransactionReferenceError("Each waste type and condition combination may only appear once per transaction.");
  }

  const wasteTypes = await getPrisma().wasteType.findMany({
    where: { organizationId, id: { in: [...uniqueIds] }, isActive: true },
    include: {
      priceVersions: {
        where: {
          effectiveFrom: { lte: pricedAt },
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: pricedAt } }],
        },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });
  if (wasteTypes.length !== uniqueIds.size) {
    throw new InvalidTransactionReferenceError("One or more waste types are inactive or invalid.");
  }

  const byId = new Map(wasteTypes.map((wasteType) => [wasteType.id, wasteType]));
  const items = input.map(({ wasteTypeId, condition, weightKg }) => {
    const wasteType = byId.get(wasteTypeId);
    if (!wasteType) throw new InvalidTransactionReferenceError("Waste type was not found.");
    const activePrice = wasteType.priceVersions.find((price) => price.condition === condition);
    if (!activePrice) throw new InvalidTransactionReferenceError(`Waste type '${wasteType.name}' has no active ${condition.toLowerCase()} price.`);
    const weight = new Prisma.Decimal(weightKg);
    const subtotal = weight.mul(activePrice.pricePerKg).toDecimalPlaces(2);
    return {
      wasteTypeId,
      wasteTypeNameSnapshot: wasteType.name,
      condition,
      weightKg: weight,
      pricePerKgSnapshot: activePrice.pricePerKg,
      subtotalAmount: subtotal,
    };
  });

  return {
    items,
    totalWeightKg: items.reduce((total, item) => total.add(item.weightKg), new Prisma.Decimal(0)),
    totalAmount: items.reduce((total, item) => total.add(item.subtotalAmount), new Prisma.Decimal(0)),
  };
}

async function findRecord(organizationId: string, id: string): Promise<TransactionRecord> {
  const record = await getPrisma().transaction.findFirst({
    where: { id, organizationId },
    include: transactionInclude,
  });
  if (!record) throw new TransactionNotFoundError();
  return record;
}

export async function listTransactions(
  organizationId: string,
  input: ListTransactionsInput,
): Promise<PaginatedTransactions> {
  const prisma = getPrisma();
  const where: Prisma.TransactionWhereInput = {
    organizationId,
    ...(input.search
      ? {
          OR: [
            { member: { fullName: { contains: input.search, mode: "insensitive" } } },
            { items: { some: { wasteTypeNameSnapshot: { contains: input.search, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.dateFrom || input.dateTo
      ? { createdAt: { ...(input.dateFrom ? { gte: input.dateFrom } : {}), ...(input.dateTo ? { lte: input.dateTo } : {}) } }
      : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [records, total] = await prisma.$transaction([
    prisma.transaction.findMany({ where, include: transactionInclude, orderBy: { createdAt: "desc" }, skip, take: input.limit }),
    prisma.transaction.count({ where }),
  ]);
  return { items: records.map(toDto), pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
}

export async function getTransaction(organizationId: string, id: string): Promise<TransactionDto> {
  return toDto(await findRecord(organizationId, id));
}

export async function createTransaction(
  organizationId: string,
  actorId: string,
  input: CreateTransactionInput,
): Promise<TransactionDto> {
  const existing = await getPrisma().transaction.findUnique({
    where: { organizationId_clientRequestId: { organizationId, clientRequestId: input.clientRequestId } },
    include: transactionInclude,
  });
  if (existing) return toDto(existing);

  await assertMember(organizationId, input.memberId);
  const totals = await buildItems(organizationId, input.items);
  const record = await getPrisma().$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        organizationId,
        memberId: input.memberId,
        clientRequestId: input.clientRequestId,
        source: input.source,
        notes: input.notes,
        createdBy: actorId,
        totalWeightKg: totals.totalWeightKg,
        totalAmount: totals.totalAmount,
        items: { create: totals.items },
      },
      include: transactionInclude,
    });
    await tx.auditLog.create({ data: { organizationId, actorId, action: "TRANSACTION_CREATED", entityType: "transaction", entityId: created.id } });
    return created;
  });
  return toDto(record);
}

export async function updateTransaction(
  organizationId: string,
  actorId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDto> {
  const current = await findRecord(organizationId, id);
  if (current.status !== "DRAFT") throw new InvalidTransactionStateError("Only a DRAFT transaction can be edited.");
  if (input.memberId) await assertMember(organizationId, input.memberId);
  const totals = input.items ? await buildItems(organizationId, input.items) : null;

  const record = await getPrisma().$transaction(async (tx) => {
    if (totals) await tx.transactionItem.deleteMany({ where: { transactionId: id } });
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        ...(input.memberId ? { memberId: input.memberId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(totals ? { totalWeightKg: totals.totalWeightKg, totalAmount: totals.totalAmount, items: { create: totals.items } } : {}),
      },
      include: transactionInclude,
    });
    await tx.auditLog.create({ data: { organizationId, actorId, action: "TRANSACTION_UPDATED", entityType: "transaction", entityId: id } });
    return updated;
  });
  return toDto(record);
}

export async function finalizeTransaction(organizationId: string, actorId: string, id: string): Promise<TransactionDto> {
  const current = await findRecord(organizationId, id);
  if (current.status !== "DRAFT") throw new InvalidTransactionStateError("Only a DRAFT transaction can be finalized.");
  if (current.items.length === 0) throw new InvalidTransactionStateError("A transaction must contain at least one item.");
  const now = new Date();
  const record = await getPrisma().$transaction(async (tx) => {
    const updated = await tx.transaction.update({ where: { id }, data: { status: "FINALIZED", finalizedBy: actorId, finalizedAt: now }, include: transactionInclude });
    await tx.auditLog.create({ data: { organizationId, actorId, action: "TRANSACTION_FINALIZED", entityType: "transaction", entityId: id } });
    return updated;
  });
  return toDto(record);
}

export async function completeTransaction(
  organizationId: string,
  actorId: string,
  id: string,
  input: CompleteTransactionInput,
): Promise<TransactionDto> {
  const current = await findRecord(organizationId, id);
  if (current.status === "COMPLETED") return toDto(current);
  if (current.status !== "FINALIZED") throw new InvalidTransactionStateError("Only a FINALIZED transaction can be completed.");
  const now = new Date();
  const record = await getPrisma().$transaction(async (tx) => {
    if (input.payoutMethod === "SAVINGS") {
      await tx.financialLedger.create({
        data: { organizationId, memberId: current.memberId, transactionId: id, entryType: "DEPOSIT", amount: current.totalAmount, referenceKey: `transaction:${id}`, createdBy: actorId },
      });
    }
    await tx.member.update({ where: { id: current.memberId }, data: { lastActivityAt: now } });
    const updated = await tx.transaction.update({ where: { id }, data: { status: "COMPLETED", payoutMethod: input.payoutMethod, completedBy: actorId, completedAt: now }, include: transactionInclude });
    await tx.auditLog.create({ data: { organizationId, actorId, action: "TRANSACTION_COMPLETED", entityType: "transaction", entityId: id, metadata: { payoutMethod: input.payoutMethod } } });
    return updated;
  });
  return toDto(record);
}

export async function cancelTransaction(
  organizationId: string,
  actorId: string,
  id: string,
  input: CancelTransactionInput,
): Promise<TransactionDto> {
  const current = await findRecord(organizationId, id);
  if (!(["DRAFT", "FINALIZED"] as const).includes(current.status as "DRAFT" | "FINALIZED")) {
    throw new InvalidTransactionStateError("Only a DRAFT or FINALIZED transaction can be cancelled.");
  }
  const record = await getPrisma().$transaction(async (tx) => {
    const updated = await tx.transaction.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: input.reason }, include: transactionInclude });
    await tx.auditLog.create({ data: { organizationId, actorId, action: "TRANSACTION_CANCELLED", entityType: "transaction", entityId: id, reason: input.reason } });
    return updated;
  });
  return toDto(record);
}
