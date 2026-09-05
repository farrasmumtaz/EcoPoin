import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";

export interface DashboardDto {
  readonly metrics: { readonly totalWeightKg: string; readonly totalAmount: string; readonly transactionCount: number; readonly activeMemberCount: number; readonly savingsAmount: string; readonly cashAmount: string };
  readonly recentTransactions: readonly { readonly id: string; readonly memberName: string; readonly totalWeightKg: string; readonly totalAmount: string; readonly payoutMethod: "DIRECT_CASH" | "SAVINGS" | null; readonly createdAt: string }[];
  readonly wasteComposition: readonly { readonly name: string; readonly weightKg: string; readonly amount: string }[];
}

export async function getDashboard(organizationId: string): Promise<DashboardDto> {
  const prisma = getPrisma();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { activityThresholdDays: true } });
  const activeSince = new Date();
  activeSince.setUTCDate(activeSince.getUTCDate() - organization.activityThresholdDays);
  const completedWhere = { organizationId, status: "COMPLETED" as const };
  const [aggregate, activeMemberCount, savings, cash, recent, itemRows] = await prisma.$transaction([
    prisma.transaction.aggregate({ where: completedWhere, _sum: { totalWeightKg: true, totalAmount: true }, _count: { id: true } }),
    prisma.member.count({ where: { organizationId, isActive: true, lastActivityAt: { gte: activeSince } } }),
    prisma.transaction.aggregate({ where: { ...completedWhere, payoutMethod: "SAVINGS" }, _sum: { totalAmount: true } }),
    prisma.transaction.aggregate({ where: { ...completedWhere, payoutMethod: "DIRECT_CASH" }, _sum: { totalAmount: true } }),
    prisma.transaction.findMany({ where: { organizationId }, include: { member: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.transactionItem.findMany({ where: { transaction: completedWhere }, select: { wasteTypeNameSnapshot: true, weightKg: true, subtotalAmount: true } }),
  ]);
  const composition = new Map<string, { weight: Prisma.Decimal; amount: Prisma.Decimal }>();
  for (const item of itemRows) {
    const current = composition.get(item.wasteTypeNameSnapshot) ?? { weight: new Prisma.Decimal(0), amount: new Prisma.Decimal(0) };
    current.weight = current.weight.add(item.weightKg); current.amount = current.amount.add(item.subtotalAmount);
    composition.set(item.wasteTypeNameSnapshot, current);
  }
  return {
    metrics: { totalWeightKg: aggregate._sum.totalWeightKg?.toString() ?? "0", totalAmount: aggregate._sum.totalAmount?.toString() ?? "0", transactionCount: aggregate._count.id, activeMemberCount, savingsAmount: savings._sum.totalAmount?.toString() ?? "0", cashAmount: cash._sum.totalAmount?.toString() ?? "0" },
    recentTransactions: recent.map((transaction) => ({ id: transaction.id, memberName: transaction.member.fullName, totalWeightKg: transaction.totalWeightKg.toString(), totalAmount: transaction.totalAmount.toString(), payoutMethod: transaction.payoutMethod, createdAt: transaction.createdAt.toISOString() })),
    wasteComposition: [...composition.entries()].map(([name, value]) => ({ name, weightKg: value.weight.toString(), amount: value.amount.toString() })).sort((a, b) => Number(b.weightKg) - Number(a.weightKg)).slice(0, 8),
  };
}
