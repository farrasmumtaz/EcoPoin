import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import type { ReportQuery } from "@/modules/reports/report.schema";
import type { TransactionReportDto } from "@/modules/reports/report.types";

export async function getTransactionReport(
  organizationId: string,
  input: ReportQuery,
): Promise<TransactionReportDto> {
  const where: Prisma.TransactionWhereInput = {
    organizationId,
    status: "COMPLETED",
    completedAt: {
      ...(input.dateFrom ? { gte: input.dateFrom } : {}),
      ...(input.dateTo ? { lte: input.dateTo } : {}),
    },
    ...(input.rt ? { member: { rt: input.rt } } : {}),
    ...(input.payoutMethod ? { payoutMethod: input.payoutMethod } : {}),
    ...(input.wasteTypeId ? { items: { some: { wasteTypeId: input.wasteTypeId } } } : {}),
  };

  const [transactions, rtRecords] = await getPrisma().$transaction([
    getPrisma().transaction.findMany({
      where,
      select: {
        id: true, receiptNumber: true, completedAt: true, payoutMethod: true,
        member: { select: { memberNumber: true, fullName: true, rt: true } },
        items: {
          where: input.wasteTypeId ? { wasteTypeId: input.wasteTypeId } : undefined,
          orderBy: { wasteTypeNameSnapshot: "asc" },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 5000,
    }),
    getPrisma().member.findMany({
      where: { organizationId, rt: { not: null } },
      distinct: ["rt"], select: { rt: true }, orderBy: { rt: "asc" },
    }),
  ]);

  const rows = transactions.flatMap((transaction) => {
    if (!transaction.completedAt || !transaction.payoutMethod) return [];
    const completedAt = transaction.completedAt.toISOString();
    const payoutMethod = transaction.payoutMethod;
    return transaction.items.map((item) => ({
      transactionId: transaction.id,
      receiptNumber: transaction.receiptNumber,
      completedAt,
      memberNumber: transaction.member.memberNumber,
      memberName: transaction.member.fullName,
      rt: transaction.member.rt,
      wasteTypeName: item.wasteTypeNameSnapshot,
      condition: item.condition,
      weightKg: item.weightKg.toString(),
      pricePerKg: item.pricePerKgSnapshot.toString(),
      subtotalAmount: item.subtotalAmount.toString(),
      payoutMethod,
    }));
  });

  const totalWeight = rows.reduce((sum, row) => sum.add(row.weightKg), new Prisma.Decimal(0));
  const totalAmount = rows.reduce((sum, row) => sum.add(row.subtotalAmount), new Prisma.Decimal(0));
  return {
    rows,
    summary: { transactionCount: transactions.length, totalWeightKg: totalWeight.toString(), totalAmount: totalAmount.toString() },
    options: { rt: rtRecords.flatMap(({ rt }) => rt ? [rt] : []) },
  };
}
