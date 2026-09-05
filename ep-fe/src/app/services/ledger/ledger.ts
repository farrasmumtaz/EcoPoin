import axios from "axios";
import { api } from "@/app/api/axiosInstance";

export type LedgerEntryType = "DEPOSIT" | "WITHDRAWAL" | "REVERSAL" | "ADJUSTMENT";
export interface LedgerEntry { readonly id: string; readonly memberId: string; readonly memberNumber: string; readonly memberName: string; readonly entryType: LedgerEntryType; readonly amount: string; readonly referenceKey: string; readonly notes: string | null; readonly createdAt: string; }
interface LedgerResult { readonly items: readonly LedgerEntry[]; readonly summary: { readonly totalCredit: string; readonly totalDebit: string; readonly balance: string }; readonly pagination: { readonly page: number; readonly limit: number; readonly total: number; readonly totalPages: number }; }
interface SuccessResponse { readonly success: true; readonly data: LedgerResult; }
interface ErrorResponse { readonly success: false; readonly error: { readonly message: string }; }

export async function getLedger(params: { readonly search?: string; readonly entryType?: LedgerEntryType; readonly page?: number; readonly limit?: number } = {}): Promise<LedgerResult> {
  try { return (await api.get<SuccessResponse>("/ledger", { params })).data.data; }
  catch (error: unknown) { throw new Error(axios.isAxiosError<ErrorResponse>(error) ? error.response?.data.error.message ?? "Mutasi gagal dimuat." : "Mutasi gagal dimuat."); }
}
