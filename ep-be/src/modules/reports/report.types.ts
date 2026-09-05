import type { PayoutMethod, WasteCondition } from "@/generated/prisma/enums";

export interface ReportRowDto {
  readonly transactionId: string;
  readonly receiptNumber: string | null;
  readonly completedAt: string;
  readonly memberNumber: string;
  readonly memberName: string;
  readonly rt: string | null;
  readonly wasteTypeName: string;
  readonly condition: WasteCondition;
  readonly weightKg: string;
  readonly pricePerKg: string;
  readonly subtotalAmount: string;
  readonly payoutMethod: PayoutMethod;
}

export interface TransactionReportDto {
  readonly rows: readonly ReportRowDto[];
  readonly summary: {
    readonly transactionCount: number;
    readonly totalWeightKg: string;
    readonly totalAmount: string;
  };
  readonly options: { readonly rt: readonly string[] };
}
