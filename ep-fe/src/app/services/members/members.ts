import axios from "axios";

import { api } from "@/app/api/axiosInstance";

type MemberType = "INDIVIDUAL" | "UNIT";

// NOTE: "NEVER_ACTIVE" is confirmed from a real response; the other
// possible values (e.g. "ACTIVE" / "INACTIVE") are a guess — confirm the
// full set with your backend and tighten this union accordingly.
type ActivityStatus = "NEVER_ACTIVE" | "ACTIVE" | "INACTIVE";

interface AddMemberPayload {
  readonly fullName: string;
  readonly type: MemberType;
  readonly rt: string | null;
  readonly phone: string | null;
  readonly picName: string | null;
  readonly picPhone: string | null;
  readonly unitIds: string[];
}

export interface Member {
  readonly id: string;
  readonly memberNumber: string;
  readonly fullName: string;
  readonly type: MemberType;
  readonly rt: string | null;
  readonly phone: string | null;
  readonly picName: string | null;
  readonly picPhone: string | null;
  readonly isActive: boolean;
  readonly activityStatus: ActivityStatus;
  readonly lastActivityAt: string | null;
  // NOTE: shape of entries unconfirmed (always empty in the sample
  // response) — adjust once a populated example is available.
  readonly relatedUnits: unknown[];
  readonly relatedIndividuals: unknown[];
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

const DEFAULT_ERROR_MESSAGE = "Tidak dapat memuat data anggota. Silakan coba lagi.";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? fallback;
  }
  return fallback;
}

// ---------- Create ----------

// NOTE: unconfirmed — assumed to mirror the list item shape (`Member`)
// directly under `data`, not wrapped in an extra `{ member: ... }` key like
// the list response wraps its array in `items`. Confirm against a real
// create response and adjust if it's wrapped differently.
type MemberResponse = ApiSuccessResponse<{ readonly member: Member }>;

export async function addMembers(payload: AddMemberPayload): Promise<Member> {
  try {
    // NOTE: adjust the endpoint path ("/members") to whatever your backend
    // actually exposes for creating a member/unit.
    const response = await api.post<MemberResponse>("/members", payload);
    return response.data.data.member;
  } catch (error: unknown) {
    throw new Error(
      extractErrorMessage(error, "Tidak dapat menambahkan anggota. Silakan coba lagi."),
    );
  }
}

// ---------- List ----------

interface GetMembersParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly rt?: string;
  readonly type?: MemberType;
}

interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

type GetMembersResponse = ApiSuccessResponse<{
  items: Member[];
  pagination: PaginationMeta;
}>;

/**
 * Fetches a paginated, optionally filtered list of members — used to
 * populate tables like the Data Warga page. Pass `page`/`limit` for
 * pagination, and `search`/`rt`/`type` for filtering; all params are
 * optional and only sent when provided.
 */
export async function getMembers(
  params: GetMembersParams = {},
): Promise<{ items: Member[]; pagination: PaginationMeta }> {
  try {
    // NOTE: adjust the endpoint path ("/members") to match your backend.
    const response = await api.get<GetMembersResponse>("/members", { params });
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}

// ---------- Single ----------

// NOTE: unconfirmed — assumed to mirror the list item shape directly under
// `data`, matching the same assumption made for AddMemberResponse. Confirm
// against a real single-record response.
/**
 * Fetches a single member by id — used for edit/detail views.
 */
export async function getMemberById(id: string): Promise<Member> {
  try {
    // NOTE: adjust the endpoint path (`/members/${id}`) to match your backend.
    const response = await api.get<MemberResponse>(`/members/${id}`);
    return response.data.data.member;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}

interface UpdateMemberPayload {
  readonly fullName?: string;
  readonly rt?: string | null;
  readonly phone?: string | null;
  readonly picName?: string | null;
  readonly picPhone?: string | null;
  readonly isActive?: boolean;
  readonly unitIds?: readonly string[];
}

export async function updateMember(id: string, payload: UpdateMemberPayload): Promise<Member> {
  try {
    const response = await api.patch<MemberResponse>(`/members/${id}`, payload);
    return response.data.data.member;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Data anggota tidak dapat diperbarui."));
  }
}

export async function deactivateMember(id: string): Promise<Member> {
  try {
    const response = await api.delete<MemberResponse>(`/members/${id}`);
    return response.data.data.member;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Anggota tidak dapat dinonaktifkan."));
  }
}

export interface MemberSummary {
  readonly member: Member;
  readonly statistics: { readonly balance: string; readonly totalDepositAmount: string; readonly totalWeightKg: string; readonly completedTransactions: number };
  readonly transactions: readonly { readonly id: string; readonly status: "DRAFT" | "FINALIZED" | "COMPLETED" | "CANCELLED" | "VOIDED"; readonly payoutMethod: "DIRECT_CASH" | "SAVINGS" | null; readonly totalWeightKg: string; readonly totalAmount: string; readonly createdAt: string }[];
  readonly ledgerEntries: readonly { readonly id: string; readonly entryType: "DEPOSIT" | "WITHDRAWAL" | "REVERSAL" | "ADJUSTMENT"; readonly amount: string; readonly referenceKey: string; readonly createdAt: string }[];
}

type MemberSummaryResponse = ApiSuccessResponse<MemberSummary>;

export async function getMemberSummary(id: string): Promise<MemberSummary> {
  try {
    const response = await api.get<MemberSummaryResponse>(`/members/${id}/summary`);
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Ringkasan anggota tidak dapat dimuat."));
  }
}
