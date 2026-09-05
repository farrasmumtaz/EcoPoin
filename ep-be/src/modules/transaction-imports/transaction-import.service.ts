import { createHash } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import type { TransactionImportInput, TransactionImportRowInput } from "@/modules/transaction-imports/transaction-import.schema";
import type { TransactionImportResult, TransactionImportRowResult } from "@/modules/transaction-imports/transaction-import.types";
import { completeTransaction, createTransaction, finalizeTransaction } from "@/modules/transactions/transaction.service";
import { AppError } from "@/shared/errors/app-error";

interface ResolvedRow {
  readonly input: TransactionImportRowInput;
  readonly memberId: string | null;
  readonly memberName: string | null;
  readonly wasteTypeId: string | null;
  readonly wasteTypeName: string | null;
  readonly pricePerKg: Prisma.Decimal | null;
  readonly errors: readonly string[];
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase("id-ID");

function deterministicRequestId(batchId: string, rowNumber: number): string {
  const hex = createHash("sha256").update(`${batchId}:${rowNumber}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function resolveRows(organizationId: string, rows: readonly TransactionImportRowInput[]): Promise<readonly ResolvedRow[]> {
  const now = new Date();
  const [members, wasteTypes] = await Promise.all([
    getPrisma().member.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, memberNumber: true, fullName: true },
    }),
    getPrisma().wasteType.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        priceVersions: {
          where: { effectiveFrom: { lte: now }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }] },
          orderBy: { effectiveFrom: "desc" },
          select: { condition: true, pricePerKg: true },
        },
      },
    }),
  ]);
  const membersByNumber = new Map(members.map((member) => [normalize(member.memberNumber), member]));
  const wasteTypesByName = new Map(wasteTypes.map((wasteType) => [normalize(wasteType.name), wasteType]));

  return rows.map((input) => {
    const member = membersByNumber.get(normalize(input.memberNumber));
    const wasteType = wasteTypesByName.get(normalize(input.wasteTypeName));
    const price = wasteType?.priceVersions.find(({ condition }) => condition === input.condition)?.pricePerKg ?? null;
    const errors = [
      ...(!member ? [`Nomor nasabah '${input.memberNumber}' tidak ditemukan atau tidak aktif.`] : []),
      ...(!wasteType ? [`Jenis sampah '${input.wasteTypeName}' tidak ditemukan atau tidak aktif.`] : []),
      ...(wasteType && !price ? [`Harga ${input.condition === "SORTED" ? "dipilah" : "belum dipilah"} belum tersedia.`] : []),
    ];
    return {
      input,
      memberId: member?.id ?? null,
      memberName: member?.fullName ?? null,
      wasteTypeId: wasteType?.id ?? null,
      wasteTypeName: wasteType?.name ?? null,
      pricePerKg: price,
      errors,
    };
  });
}

function resultRow(row: ResolvedRow, transactionId: string | null = null): TransactionImportRowResult {
  return {
    rowNumber: row.input.rowNumber,
    valid: row.errors.length === 0,
    errors: row.errors,
    memberName: row.memberName,
    wasteTypeName: row.wasteTypeName,
    pricePerKg: row.pricePerKg?.toString() ?? null,
    subtotalAmount: row.pricePerKg?.mul(row.input.weightKg).toDecimalPlaces(2).toString() ?? null,
    transactionId,
  };
}

export async function importTransactions(
  organizationId: string,
  actorId: string,
  input: TransactionImportInput,
): Promise<TransactionImportResult> {
  const resolved = await resolveRows(organizationId, input.rows);
  const invalidRows = resolved.filter(({ errors }) => errors.length > 0).length;
  if (!input.dryRun && invalidRows > 0) {
    throw new AppError({
      code: "IMPORT_VALIDATION_ERROR",
      message: "Perbaiki seluruh baris yang tidak valid sebelum mengimpor.",
      statusCode: 422,
    });
  }

  const results: TransactionImportRowResult[] = [];
  for (const row of resolved) {
    if (input.dryRun || row.errors.length > 0 || !row.memberId || !row.wasteTypeId) {
      results.push(resultRow(row));
      continue;
    }
    let transaction = await createTransaction(organizationId, actorId, {
      memberId: row.memberId,
      clientRequestId: deterministicRequestId(input.batchId, row.input.rowNumber),
      source: "IMPORT",
      notes: row.input.notes,
      items: [{ wasteTypeId: row.wasteTypeId, condition: row.input.condition, weightKg: row.input.weightKg }],
    });
    if (transaction.status === "DRAFT") transaction = await finalizeTransaction(organizationId, actorId, transaction.id);
    if (transaction.status === "FINALIZED") transaction = await completeTransaction(organizationId, actorId, transaction.id, { payoutMethod: row.input.payoutMethod });
    results.push(resultRow(row, transaction.id));
  }

  if (!input.dryRun) {
    await getPrisma().auditLog.create({
      data: {
        organizationId,
        actorId,
        action: "TRANSACTIONS_IMPORTED",
        entityType: "transaction_import",
        entityId: input.batchId,
        metadata: { totalRows: input.rows.length, invalidRows },
      },
    });
  }
  return {
    batchId: input.batchId,
    dryRun: input.dryRun,
    validRows: input.rows.length - invalidRows,
    invalidRows,
    importedRows: input.dryRun ? 0 : results.filter(({ transactionId }) => transactionId !== null).length,
    rows: results,
  };
}
