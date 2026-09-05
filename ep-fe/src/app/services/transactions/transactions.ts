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

interface UpdateTransactionPayload {
  readonly memberId: string;
  readonly items: readonly TransactionItemPayload[];
}

export type TransactionStatus = "DRAFT" | "FINALIZED" | "COMPLETED" | "CANCELLED" | "VOIDED";

export interface TransactionItem {
  readonly id: string;
  readonly wasteTypeId: string;
  readonly wasteTypeName: string;
  readonly condition: "SORTED" | "UNSORTED";
  readonly weightKg: string;
  readonly pricePerKg: string;
  readonly subtotalAmount: string;
}

export interface Transaction {
  readonly id: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly status: TransactionStatus;
  readonly source: "DIRECT_ENTRY" | "IMPORT";
  readonly payoutMethod: "DIRECT_CASH" | "SAVINGS" | null;
  readonly receiptToken: string;
  readonly receiptNumber: string | null;
  readonly items: readonly TransactionItem[];
  readonly totalWeightKg: string;
  readonly totalAmount: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

type TransactionResponse = ApiSuccessResponse<{ readonly transaction: Transaction }>;

interface TransactionPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

type TransactionListResponse = ApiSuccessResponse<{
  readonly items: readonly Transaction[];
  readonly pagination: TransactionPagination;
}>;

interface GetTransactionsParams {
  readonly search?: string;
  readonly status?: TransactionStatus;
  readonly page?: number;
  readonly limit?: number;
}

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

export async function getTransactionById(id: string): Promise<Transaction> {
  try {
    const response = await api.get<TransactionResponse>(`/transactions/${id}`);
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  try {
    const response = await api.patch<TransactionResponse>(`/transactions/${id}`, payload);
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}

export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<{ readonly items: readonly Transaction[]; readonly pagination: TransactionPagination }> {
  try {
    const response = await api.get<TransactionListResponse>("/transactions", { params });
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}

export async function completeTransaction(
  id: string,
  payoutMethod: "DIRECT_CASH" | "SAVINGS",
): Promise<Transaction> {
  try {
    const response = await api.post<TransactionResponse>(`/transactions/${id}/complete`, { payoutMethod });
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}

export async function cancelTransaction(id: string, reason: string): Promise<Transaction> {
  try {
    const response = await api.post<TransactionResponse>(`/transactions/${id}/cancel`, { reason });
    return response.data.data.transaction;
  } catch (error: unknown) {
    throw new Error(messageFrom(error));
  }
}
