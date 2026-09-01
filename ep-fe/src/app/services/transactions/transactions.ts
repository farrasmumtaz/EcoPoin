import axios from "axios";

import { api } from "@/app/api/axiosInstance";

interface ApiErrorResponse {
  readonly success: false;
  readonly error: { readonly code: string; readonly message: string };
}

interface TransactionItemPayload {
  readonly wasteTypeId: string;
  readonly condition: "SORTED" | "UNSORTED";
  readonly weightKg: number;
}

interface CreateTransactionPayload {
  readonly memberId: string;
  readonly clientRequestId: string;
  readonly source: "DIRECT_ENTRY";
  readonly items: readonly TransactionItemPayload[];
}

interface Transaction {
  readonly id: string;
  readonly status: "DRAFT" | "FINALIZED" | "COMPLETED" | "CANCELLED" | "VOIDED";
  readonly totalWeightKg: string;
  readonly totalAmount: string;
}

interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

type TransactionResponse = ApiSuccessResponse<{ readonly transaction: Transaction }>;

function messageFrom(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? "Transaksi tidak dapat disimpan.";
  }
  return "Transaksi tidak dapat disimpan.";
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  try {
    const response = await api.post<TransactionResponse>("/transactions", payload);
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}

export async function finalizeTransaction(id: string): Promise<Transaction> {
  try {
    const response = await api.post<TransactionResponse>(`/transactions/${id}/finalize`);
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}
