import axios from "axios";
import { api } from "@/app/api/axiosInstance";

export interface ReportRow {
  readonly transactionId: string; readonly receiptNumber: string | null; readonly completedAt: string;
  readonly memberNumber: string; readonly memberName: string; readonly rt: string | null;
  readonly wasteTypeName: string; readonly condition: "SORTED" | "UNSORTED";
  readonly weightKg: string; readonly pricePerKg: string; readonly subtotalAmount: string;
  readonly payoutMethod: "DIRECT_CASH" | "SAVINGS";
}
export interface TransactionReport {
  readonly rows: readonly ReportRow[];
  readonly summary: { readonly transactionCount: number; readonly totalWeightKg: string; readonly totalAmount: string };
  readonly options: { readonly rt: readonly string[] };
}
interface Response { readonly success: true; readonly data: TransactionReport }
export interface ReportFilters { readonly dateFrom?: string; readonly dateTo?: string; readonly rt?: string; readonly wasteTypeId?: string; readonly payoutMethod?: "DIRECT_CASH" | "SAVINGS" }

export async function getTransactionReport(params: ReportFilters = {}): Promise<TransactionReport> {
  try {
    return (await api.get<Response>("/reports/transactions", { params })).data.data;
  } catch (error: unknown) {
    const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : null;
    throw new Error(typeof message === "string" ? message : "Laporan gagal dimuat.");
  }
}
