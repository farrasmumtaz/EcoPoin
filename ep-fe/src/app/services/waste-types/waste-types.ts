import axios from "axios";

import { api } from "@/app/api/axiosInstance";

export type WasteCategory = "PLASTIC" | "PAPER" | "METAL" | "GLASS" | "OTHER";

interface AddWasteTypePayload {
  readonly name: string;
  readonly category: WasteCategory;
  readonly unit: string;
  readonly sortedPricePerKg: number;
  readonly unsortedPricePerKg: number;
}

export interface WasteType {
  readonly id: string;
  readonly name: string;
  readonly category: WasteCategory;
  readonly unit: string;
  readonly prices: {
    readonly sorted: string;
    readonly unsorted: string;
  };
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

const DEFAULT_ERROR_MESSAGE = "Tidak dapat memuat data jenis sampah. Silakan coba lagi.";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? fallback;
  }
  return fallback;
}

// ---------- Create ----------

// Confirmed: wrapped in `wasteType`, unlike the list response which wraps
// its array directly in `items`.
type AddWasteTypeResponse = ApiSuccessResponse<{ wasteType: WasteType }>;

export async function addWasteType(
  payload: AddWasteTypePayload,
): Promise<WasteType> {
  try {
    const response = await api.post<AddWasteTypeResponse>(
      "/waste-types",
      payload,
    );
    return response.data.data.wasteType;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(
        error,
        "Tidak dapat menambahkan jenis sampah. Silakan coba lagi.",
      ),
    );
  }
}

// ---------- List ----------

interface GetWasteTypesParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly category?: WasteCategory;
}

interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

type GetWasteTypesResponse = ApiSuccessResponse<{
  items: WasteType[];
  pagination: PaginationMeta;
}>;

/**
 * Fetches a paginated, optionally filtered list of waste types — used to
 * populate the Jenis Sampah table.
 */
export async function getWasteTypes(
  params: GetWasteTypesParams = {},
): Promise<{ items: WasteType[]; pagination: PaginationMeta }> {
  try {
    const response = await api.get<GetWasteTypesResponse>("/waste-types", {
      params,
    });
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}

// ---------- Single ----------

// Confirmed: wrapped in `wasteType`, same as the create response.
type GetWasteTypeByIdResponse = ApiSuccessResponse<{ wasteType: WasteType }>;

/**
 * Fetches a single waste type by id — used for edit/detail views.
 */
export async function getWasteTypeById(id: string): Promise<WasteType> {
  try {
    const response = await api.get<GetWasteTypeByIdResponse>(
      `/waste-types/${id}`,
    );
    return response.data.data.wasteType;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}

type UpdateWasteTypePayload = Partial<AddWasteTypePayload> & { readonly isActive?: boolean };

export async function updateWasteType(id: string, payload: UpdateWasteTypePayload): Promise<WasteType> {
  try {
    const response = await api.patch<GetWasteTypeByIdResponse>(`/waste-types/${id}`, payload);
    return response.data.data.wasteType;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Jenis sampah tidak dapat diperbarui."));
  }
}

type DeleteWasteTypeResponse = ApiSuccessResponse<{ wasteType: WasteType }>;

export async function deleteWasteType(id: string): Promise<WasteType> {
  try {
    const response = await api.delete<DeleteWasteTypeResponse>(
      `/waste-types/${id}`,
    );
    return response.data.data.wasteType;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Jenis sampah tidak dapat dihapus."),
    );
  }
}
