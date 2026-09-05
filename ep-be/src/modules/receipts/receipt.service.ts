import { getPrisma } from "@/infrastructure/database/prisma";
import { AppError } from "@/shared/errors/app-error";

export async function getPublicReceipt(token: string) {
  const transaction = await getPrisma().transaction.findFirst({
    where: { receiptToken: token, status: "COMPLETED" },
    select: {
      id: true, receiptToken: true, receiptNumber: true, memberNameSnapshot: true,
      payoutMethod: true, totalWeightKg: true, totalAmount: true, completedAt: true,
      member: { select: { fullName: true } },
      organization: { select: { name: true, address: true, contactPhone: true } },
      items: { select: { id: true, wasteTypeNameSnapshot: true, condition: true, weightKg: true, pricePerKgSnapshot: true, subtotalAmount: true }, orderBy: { wasteTypeNameSnapshot: "asc" } },
    },
  });
  if (!transaction) throw new AppError({ code: "RECEIPT_NOT_FOUND", message: "Nota tidak ditemukan.", statusCode: 404 });
  return {
    receiptNumber: transaction.receiptNumber ?? `ECP-${transaction.id.slice(0, 8).toUpperCase()}`,
    organization: transaction.organization,
    memberName: transaction.memberNameSnapshot ?? transaction.member.fullName,
    payoutMethod: transaction.payoutMethod,
    totalWeightKg: transaction.totalWeightKg.toString(), totalAmount: transaction.totalAmount.toString(),
    completedAt: transaction.completedAt?.toISOString() ?? null,
    items: transaction.items.map((item) => ({ id: item.id, wasteTypeName: item.wasteTypeNameSnapshot, condition: item.condition, weightKg: item.weightKg.toString(), pricePerKg: item.pricePerKgSnapshot.toString(), subtotalAmount: item.subtotalAmount.toString() })),
  };
}
